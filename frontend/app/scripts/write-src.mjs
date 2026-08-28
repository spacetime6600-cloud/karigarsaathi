import fs from 'node:fs';
const input = fs.readFileSync(0, 'utf-8');
const { filePath, content } = JSON.parse(input);
fs.writeFileSync(filePath, content, 'utf-8');
console.log('Written: ' + filePath);
