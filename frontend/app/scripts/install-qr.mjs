import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const tempDir = path.join(os.tmpdir(), 'npm-qr-install-' + Date.now());
fs.mkdirSync(tempDir, { recursive: true });

console.log('Installing in:', tempDir);
fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'qr-installer', private: true }));

execSync('npm install qrcode@1.5.4 jsqr@1.4.0 @types/qrcode@1.5.5 --no-audit --no-fund', {
  cwd: tempDir,
  stdio: 'inherit',
  shell: true,
});

const targetNodeModules = path.resolve('node_modules');
const srcNodeModules = path.join(tempDir, 'node_modules');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('Copying packages to:', targetNodeModules);
copyRecursive(srcNodeModules, targetNodeModules);
console.log('Installation completed successfully!');
