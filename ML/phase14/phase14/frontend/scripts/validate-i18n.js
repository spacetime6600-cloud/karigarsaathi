#!/usr/bin/env node

/**
 * Translation validation script
 * Recursively compares every locale with en.json and reports:
 * - malformed JSON
 * - missing keys
 * - extra keys
 * - empty values
 * Exits with non-zero code when validation fails.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const BASE_LOCALE = 'en.json';

function flattenObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

function loadLocale(localeFile) {
  const filePath = path.join(LOCALES_DIR, localeFile);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ ${localeFile}: Malformed JSON - ${error.message}`);
    return null;
  }
}

function validateLocale(base, target, targetName) {
  const baseFlat = flattenObject(base);
  const targetFlat = flattenObject(target);

  const baseKeys = new Set(Object.keys(baseFlat));
  const targetKeys = new Set(Object.keys(targetFlat));

  let hasErrors = false;

  // Check for missing keys
  for (const key of baseKeys) {
    if (!targetKeys.has(key)) {
      console.error(`❌ ${targetName}: Missing key "${key}"`);
      hasErrors = true;
    }
  }

  // Check for extra keys
  for (const key of targetKeys) {
    if (!baseKeys.has(key)) {
      console.warn(`⚠️  ${targetName}: Extra key "${key}" (not in base locale)`);
    }
  }

  // Check for empty values
  for (const key of targetKeys) {
    const value = targetFlat[key];
    if (value === '' || value === null || value === undefined) {
      console.error(`❌ ${targetName}: Empty value for key "${key}"`);
      hasErrors = true;
    }
  }

  return hasErrors;
}

function main() {
  console.log('🔍 Validating translation files...\n');

  const baseLocale = loadLocale(BASE_LOCALE);
  if (!baseLocale) {
    console.error(`❌ Failed to load base locale ${BASE_LOCALE}`);
    process.exit(1);
  }

  const localeFiles = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json') && f !== BASE_LOCALE);

  let hasAnyErrors = false;

  for (const localeFile of localeFiles) {
    const localeName = localeFile.replace('.json', '');
    console.log(`\n📋 Checking ${localeName}...`);

    const targetLocale = loadLocale(localeFile);
    if (!targetLocale) {
      hasAnyErrors = true;
      continue;
    }

    const hasErrors = validateLocale(baseLocale, targetLocale, localeName);
    if (hasErrors) {
      hasAnyErrors = true;
    } else {
      console.log(`✅ ${localeName}: All keys present and non-empty`);
    }
  }

  // Also validate base locale for empty values
  console.log(`\n📋 Checking ${BASE_LOCALE} (base)...`);
  const baseFlat = flattenObject(baseLocale);
  for (const [key, value] of Object.entries(baseFlat)) {
    if (value === '' || value === null || value === undefined) {
      console.error(`❌ ${BASE_LOCALE}: Empty value for key "${key}"`);
      hasAnyErrors = true;
    }
  }
  if (!hasAnyErrors) {
    console.log(`✅ ${BASE_LOCALE}: All values non-empty`);
  }

  console.log('\n' + '='.repeat(50));
  if (hasAnyErrors) {
    console.log('❌ Translation validation FAILED');
    process.exit(1);
  } else {
    console.log('✅ Translation validation PASSED');
    process.exit(0);
  }
}

main();