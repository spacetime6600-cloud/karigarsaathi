import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import fs from 'fs';
import path from 'path';

export const PROJECT_ID = 'demo-karigarsaathi';

let testEnvInstance: RulesTestEnvironment | null = null;

function findRulesFile(filename: string): string {
  const candidates = [
    path.resolve(process.cwd(), filename),
    path.resolve(process.cwd(), '../../', filename),
    path.resolve(process.cwd(), '../', filename),
    path.resolve(__dirname, '../../../..', filename),
    path.resolve(__dirname, '../../../../..', filename),
    path.resolve(__dirname, '../../', filename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf8');
    }
  }

  throw new Error(`Could not find ${filename} in candidates: ${candidates.join(', ')}`);
}

export async function getTestEnvironment(): Promise<RulesTestEnvironment> {
  if (testEnvInstance) {
    return testEnvInstance;
  }

  const firestoreRules = findRulesFile('firestore.rules');
  const storageRules = findRulesFile('storage.rules');

  testEnvInstance = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: firestoreRules,
      host: '127.0.0.1',
      port: 8085,
    },
    storage: {
      rules: storageRules,
      host: '127.0.0.1',
      port: 9199,
    },
  });

  return testEnvInstance;
}
