#!/usr/bin/env node
// @ts-check
/**
 * Records e2e tests as videos for attaching to a PR or Jira ticket.
 *
 * Usage:
 *   npm run e2e:record <file-name> [...file-name] [--grep=<search-name>]
 *
 *   <file-name>       One or more test files (or path fragments) to run, e.g.
 *                     `table-gotorow` or `tests/table-gotorow.spec.ts`.
 *   --grep=<name>     Optional test-title filter passed to Playwright's `-g`,
 *                     e.g. --grep="Go to row works".
 *
 * Env:
 *   E2E_RECORD_CONFIG Playwright config to record with. Defaults to
 *                     `playwright-record.config.ts` (local dev server). CI uses
 *                     `playwright-record-ci.config.ts`.
 *
 * It runs the tests using the recording Playwright config (video + slowMo),
 * streams the test output to the console, and then writes the video(s) plus an
 * index.html that plays them inline to the gitignored test-results/e2e-video
 * directory.
 */
/* eslint-disable no-console, no-restricted-syntax */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const outputDir = path.join(rootDir, 'test-results', 'e2e-video');
const reportJsonPath = path.join(outputDir, 'report.json');
const reportHtmlPath = path.join(outputDir, 'index.html');
const configPath =
  process.env.E2E_RECORD_CONFIG || 'playwright-record.config.ts';

const args = process.argv.slice(2);
const searchName = args
  .find(arg => arg.startsWith('--grep='))
  ?.slice('--grep='.length);
const fileNames = args.filter(arg => !arg.startsWith('--'));

if (fileNames.length === 0) {
  console.error(
    'Usage: npm run e2e:record <file-name> [...file-name] [--grep=<search-name>]'
  );
  console.error('  <file-name>     Test file to run, e.g. table-gotorow');
  console.error(
    '  --grep=<name>   Optional test title to filter with -g, e.g. --grep="Go to row"'
  );
  process.exit(1);
}

/**
 * Recursively collects raw Playwright video files (.webm) under a directory,
 * newest first.
 * @param {string} dir
 * @returns {string[]}
 */
function collectVideos(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  /** @type {{ file: string; mtimeMs: number }[]} */
  const found = [];

  /** @param {string} current */
  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.webm$/i.test(entry.name)) {
        found.push({ file: full, mtimeMs: statSync(full).mtimeMs });
      }
    }
  }

  walk(dir);
  return found.sort((a, b) => b.mtimeMs - a.mtimeMs).map(v => v.file);
}

/**
 * @returns {boolean} Whether ffmpeg is available on the PATH.
 */
function hasFfmpeg() {
  const probe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  return !probe.error && probe.status === 0;
}

/** Edge energy below this counts as a blank or loading screen. */
const BLANK_EDGE_ENERGY = 0.3;
/** Fraction of the recording's peak edge energy that also counts as content. */
const CONTENT_EDGE_RATIO = 0.25;
/** Frames that must stay above the threshold before we call it content. */
const CONTENT_FRAME_RUN = 3;

/**
 * Detects how long the recording sits on a blank page or the app's loading
 * spinner before the real UI shows up.
 *
 * Both of those screens are nearly featureless, so we measure per-frame "edge
 * energy" - the mean intensity of an edge-detected, downscaled frame. A blank
 * page scores ~0, the loading spinner ~0.15, and a rendered app screen upwards
 * of 0.5, which separates them far more reliably than brightness does (the app
 * is dark-themed, so the loading screen isn't white).
 *
 * @param {string} video Path to the raw .webm recording.
 * @returns {number} Seconds of leading blank/loading screen (0 if none).
 */
function detectContentStart(video) {
  const probe = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-loglevel',
      'error',
      '-i',
      video,
      '-vf',
      'scale=320:-2,format=gray,edgedetect=low=0.1:high=0.4,signalstats,metadata=mode=print:key=lavfi.signalstats.YAVG:file=-',
      '-an',
      '-f',
      'null',
      '-',
    ],
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );

  /** @type {{ time: number; energy: number }[]} */
  const frames = [
    ...`${probe.stdout ?? ''}`.matchAll(
      /pts_time:([\d.]+)\s*\n\s*lavfi\.signalstats\.YAVG=([\d.]+)/g
    ),
  ].map(m => ({ time: Number(m[1]), energy: Number(m[2]) }));

  if (frames.length === 0) {
    return 0;
  }

  const sorted = [...frames].map(f => f.energy).sort((a, b) => a - b);
  const peak = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const threshold = Math.max(BLANK_EDGE_ENERGY, peak * CONTENT_EDGE_RATIO);

  const start = frames.findIndex((_, i) =>
    frames
      .slice(i, i + CONTENT_FRAME_RUN)
      .every(frame => frame.energy >= threshold)
  );

  // Never trim everything - a run that never reaches content is left as-is.
  return start > 0 ? frames[start].time : 0;
}

/**
 * Trims the leading blank/loading screen and exports an mp4 next to the source
 * video. mp4 is widely supported for attaching to GitHub PRs and Jira tickets.
 *
 * @param {string} video Path to the raw .webm recording.
 * @param {number} startSec Seconds to skip from the start.
 * @returns {string|null} Path to the generated mp4, or null on failure.
 */
function exportTrimmedMp4(video, startSec) {
  const baseName = path.basename(video, path.extname(video));
  const outPath = path.join(path.dirname(video), `${baseName}.mp4`);
  const args = ['-y', '-loglevel', 'error'];
  // Seek before -i for a fast, keyframe-aligned trim.
  if (startSec > 0.3) {
    args.push('-ss', startSec.toFixed(2));
  }
  args.push('-i', video, '-an', '-movflags', '+faststart', outPath);

  const ret = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  return !ret.error && ret.status === 0 ? outPath : null;
}

/**
 * Maps each recorded video back to the test that produced it, using the json
 * reporter output. Videos from specs that build their own context aren't
 * attached to a test and so won't appear here.
 *
 * @returns {Map<string, { file: string; title: string }>} Keyed by video path.
 */
function readVideoLabels() {
  /** @type {Map<string, { file: string; title: string }>} */
  const labels = new Map();

  if (!existsSync(reportJsonPath)) {
    return labels;
  }

  /** @type {any} */
  let report;
  try {
    report = JSON.parse(readFileSync(reportJsonPath, 'utf8'));
  } catch {
    return labels;
  }

  /**
   * @param {any} suite
   * @param {string} file
   * @param {string[]} titles
   */
  function walk(suite, file, titles) {
    const suiteFile = suite.file ?? file;
    for (const spec of suite.specs ?? []) {
      const title = [...titles, spec.title].filter(Boolean).join(' > ');
      for (const test of spec.tests ?? []) {
        for (const testResult of test.results ?? []) {
          for (const attachment of testResult.attachments ?? []) {
            if (attachment.name === 'video' && attachment.path != null) {
              labels.set(path.resolve(attachment.path), {
                file: suiteFile,
                title,
              });
            }
          }
        }
      }
    }
    for (const child of suite.suites ?? []) {
      // The outermost suite per file is titled with the file itself.
      const childTitles =
        child.file != null && child.title === child.file
          ? titles
          : [...titles, child.title];
      walk(child, suiteFile, childTitles);
    }
  }

  for (const suite of report.suites ?? []) {
    walk(suite, suite.file ?? suite.title ?? '', []);
  }

  return labels;
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Writes a standalone page that plays every recording inline, so the artifact
 * can be reviewed by opening one file instead of hunting through hashed names.
 *
 * @param {{ src: string; file: string; title: string }[]} entries
 */
function writeHtmlReport(entries) {
  const sections = entries
    .map(
      entry => `    <section>
      <h2>${escapeHtml(entry.title)}</h2>
      <p>${escapeHtml(entry.file)}</p>
      <video controls preload="metadata" src="${escapeHtml(entry.src)}"></video>
    </section>`
    )
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>e2e recordings</title>
    <style>
      body {
        margin: 0 auto;
        max-width: 1000px;
        padding: 24px;
        background: #1a1a1a;
        color: #f0f0f0;
        font-family: system-ui, sans-serif;
      }
      section {
        margin-bottom: 32px;
      }
      h2 {
        margin-bottom: 4px;
        font-size: 1.1rem;
      }
      p {
        margin-top: 0;
        color: #a0a0a0;
        font-family: monospace;
      }
      video {
        width: 100%;
        border-radius: 4px;
        background: #000;
      }
    </style>
  </head>
  <body>
    <h1>e2e recordings</h1>
${sections}
  </body>
</html>
`;

  writeFileSync(reportHtmlPath, html);
}

// Record which videos already existed so we can highlight the new ones.
const previousVideos = new Set(collectVideos(outputDir));

const playwrightArgs = [
  'playwright',
  'test',
  `--config=${configPath}`,
  // Snapshot diffs shouldn't cut a recording short.
  '--ignore-snapshots',
  // json is used to label each video with the test that produced it.
  '--reporter=list,json',
  ...fileNames,
];
if (searchName) {
  playwrightArgs.push('-g', searchName);
}

console.log(
  `\nRecording e2e test(s): ${fileNames.join(', ')}${
    searchName ? ` (grep: "${searchName}")` : ''
  }\n`
);

const result = spawnSync('npx', playwrightArgs, {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: reportJsonPath },
});

const allVideos = collectVideos(outputDir);
const newVideos = allVideos.filter(v => !previousVideos.has(v));
const videos = newVideos.length > 0 ? newVideos : allVideos;

const labels = readVideoLabels();
rmSync(reportJsonPath, { force: true });

const divider = '-'.repeat(60);
console.log(`\n${divider}`);

/** @type {{ src: string; file: string; title: string }[]} */
const entries = [];
const ffmpegAvailable = hasFfmpeg();

if (videos.length === 0) {
  console.log(`No video files were found in ${outputDir}`);
  console.log('(The test may not have started a browser context.)');
} else {
  if (!ffmpegAvailable) {
    // No ffmpeg: just report the raw recordings (with the leading load screen).
    console.log('Recorded video(s) (raw - includes initial load screen):');
  } else {
    console.log('Recorded video(s):');
  }

  for (const video of videos) {
    let output = video;
    let note = '';

    if (ffmpegAvailable) {
      const contentStart = detectContentStart(video);
      const mp4 = exportTrimmedMp4(video, contentStart);
      if (mp4) {
        output = mp4;
        note =
          contentStart > 0.3
            ? ` (trimmed ${contentStart.toFixed(1)}s of leading load screen)`
            : '';
      } else {
        note = ' (mp4 export failed)';
      }
    }

    const label = labels.get(path.resolve(video));
    entries.push({
      src: path.relative(outputDir, output),
      file: label?.file ?? path.relative(rootDir, output),
      title: label?.title ?? path.basename(output),
    });

    console.log(`  ${path.relative(rootDir, output)}${note}`);
  }

  if (!ffmpegAvailable) {
    console.log(
      '\nInstall ffmpeg to auto-trim the leading load screen and export an mp4.'
    );
  }

  writeHtmlReport(entries);
  console.log(
    `\nOpen ${path.relative(rootDir, reportHtmlPath)} to watch them.`
  );
}
console.log(`${divider}\n`);

process.exit(result.status ?? 1);
