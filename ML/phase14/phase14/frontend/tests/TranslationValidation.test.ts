import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

function loadLocale(localeFile: string): Record<string, unknown> {
  const filePath = path.join(LOCALES_DIR, localeFile);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

describe('Translation Key Validation', () => {
  it('all five locales have identical key structures to en.json', () => {
    const baseLocale = loadLocale('en.json');
    const baseFlat = flattenObject(baseLocale);
    const baseKeys = new Set(Object.keys(baseFlat));

    const localeFiles = ['hi.json', 'or.json', 'bn.json', 'te.json'];

    for (const localeFile of localeFiles) {
      const targetLocale = loadLocale(localeFile);
      const targetFlat = flattenObject(targetLocale);
      const targetKeys = new Set(Object.keys(targetFlat));

      for (const key of baseKeys) {
        expect(targetKeys.has(key)).toBe(true);
      }

      for (const key of targetKeys) {
        const value = targetFlat[key];
        expect(value).not.toBe('');
        expect(value).not.toBeNull();
        expect(value).not.toBeUndefined();
      }
    }
  });

  it('en.json has no empty values', () => {
    const baseLocale = loadLocale('en.json');
    const baseFlat = flattenObject(baseLocale);

    for (const [, value] of Object.entries(baseFlat)) {
      expect(value).not.toBe('');
      expect(value).not.toBeNull();
      expect(value).not.toBeUndefined();
    }
  });

  it('no corrupted mixed-script fragments in translations', () => {
    const localeFiles = ['hi.json', 'or.json', 'bn.json', 'te.json'];
    const forbiddenPatterns = [
      /stoj/,
      /دائما/,
      /कारीগর/,
      /오/,
      /본다/,
      /Outlined/,
      /Техник/,
      / प्रमाण/,
      / אות /,
      / दिशा/,
      /igid/,
      /ಮುಂದుకు/,
      /செல்ல/,
    ];

    for (const localeFile of localeFiles) {
      const content = fs.readFileSync(path.join(LOCALES_DIR, localeFile), 'utf-8');
      for (const pattern of forbiddenPatterns) {
        expect(content).not.toMatch(pattern);
      }
    }
  });
});