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
 * streams the test output to the console, and then prints where the video(s)
 * were saved under the gitignored test-results/e2e-video directory.
 */
/* eslint-disable no-console, no-restricted-syntax */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const outputDir = path.join(rootDir, 'test-results', 'e2e-video');
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

/**
 * Detects how long the recording stays on a blank/white screen at the start.
 *
 * The app is dark-themed once loaded, so the only near-white frames are the
 * blank page shown while the dev server loads/authenticates. We negate the
 * video (turning white into black) and use ffmpeg's blackdetect to find that
 * leading blank segment, returning the timestamp (seconds) where it ends.
 *
 * @param {string} video Path to the raw .webm recording.
 * @returns {number} Seconds of leading blank screen (0 if none detected).
 */
function detectLeadingBlankEnd(video) {
  const probe = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-i',
      video,
      '-vf',
      'negate,blackdetect=d=0.2:pix_th=0.10',
      '-an',
      '-f',
      'null',
      '-',
    ],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );

  const output = `${probe.stderr ?? ''}`;
  const matches = [
    ...output.matchAll(/black_start:([\d.]+)[^\n]*?black_end:([\d.]+)/g),
  ];

  // Only trim a blank segment that begins at (or very near) the start.
  const leading = matches.find(m => Number(m[1]) < 0.5);
  return leading ? Number(leading[2]) : 0;
}

/**
 * Trims the leading blank screen and exports an mp4 next to the source video.
 * mp4 is widely supported for attaching to GitHub PRs and Jira tickets.
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

// Record which videos already existed so we can highlight the new ones.
const previousVideos = new Set(collectVideos(outputDir));

const playwrightArgs = [
  'playwright',
  'test',
  `--config=${configPath}`,
  // Snapshot diffs shouldn't cut a recording short.
  '--ignore-snapshots',
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
  env: process.env,
});

const allVideos = collectVideos(outputDir);
const newVideos = allVideos.filter(v => !previousVideos.has(v));
const videos = newVideos.length > 0 ? newVideos : allVideos;

const divider = '-'.repeat(60);
console.log(`\n${divider}`);

if (videos.length === 0) {
  console.log(`No video files were found in ${outputDir}`);
  console.log('(The test may not have started a browser context.)');
} else if (!hasFfmpeg()) {
  // No ffmpeg: just report the raw recordings (with the leading load screen).
  console.log('Recorded video(s) (raw - includes initial load screen):');
  for (const video of videos) {
    console.log(`  ${path.relative(rootDir, video)}`);
  }
  console.log(
    '\nInstall ffmpeg to auto-trim the leading load screen and export an mp4.'
  );
} else {
  console.log('Recorded video(s):');
  for (const video of videos) {
    const blankEnd = detectLeadingBlankEnd(video);
    const mp4 = exportTrimmedMp4(video, blankEnd);
    if (mp4) {
      const trimNote =
        blankEnd > 0.3
          ? ` (trimmed ${blankEnd.toFixed(1)}s of leading load screen)`
          : '';
      console.log(`  ${path.relative(rootDir, mp4)}${trimNote}`);
    } else {
      console.log(`  ${path.relative(rootDir, video)} (mp4 export failed)`);
    }
  }
}
console.log(`${divider}\n`);

process.exit(result.status ?? 1);
