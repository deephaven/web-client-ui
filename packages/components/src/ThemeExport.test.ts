import fs from 'fs';
import path from 'path';
import ThemeExport from './ThemeExport';

// Jest maps .css imports to identity-obj-proxy, so read the stylesheets as text
function readCss(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function getDeclaration(css: string, property: string): string | undefined {
  return new RegExp(`(?:^|[\\s;{])${property}:\\s*([^;]+);`, 'm')
    .exec(css)?.[1]
    .trim();
}

function secondsToMs(value: string | undefined): number {
  expect(value).toMatch(/^\d*\.?\d+s$/);
  return Math.round(parseFloat(value ?? '') * 1000);
}

describe('transition durations stay in sync', () => {
  const baseStyleSheet = readCss('../styles/BaseStyleSheet.css');
  const themeExportCss = readCss('./ThemeExport.module.css');

  it.each([
    ['--dh-transition', ThemeExport.transitionMs],
    ['--dh-transition-mid', ThemeExport.transitionMidMs],
    ['--dh-transition-long', ThemeExport.transitionLongMs],
  ])('%s matches ThemeExport', (token, ms) => {
    expect(secondsToMs(getDeclaration(baseStyleSheet, token))).toBe(ms);
  });

  it('the exported transition literal matches --dh-transition', () => {
    expect(getDeclaration(themeExportCss, 'transition')).toBe(
      getDeclaration(baseStyleSheet, '--dh-transition')
    );
  });
});
