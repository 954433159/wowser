import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const extensions = new Set(['.js', '.jsx', '.styl']);
const violations = [];
const exportExtension = /^\s*export\s+(?:default\s+)?[A-Za-z_$][\w$]*\s+from\s+['"]/;

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!extensions.has(extname(path))) continue;

    const source = await readFile(path, 'utf8');
    source.split(/\r?\n/).forEach((line, index) => {
      if (line.includes('::')) {
        violations.push(`${path}:${index + 1}: Babel function-bind syntax`);
      }
      if (exportExtension.test(line)) {
        violations.push(`${path}:${index + 1}: Babel export-extension syntax`);
      }
      if (line.includes('worker!')) {
        violations.push(`${path}:${index + 1}: webpack worker-loader inline prefix`);
      }
      if (line.includes('~normalize.css')) {
        violations.push(`${path}:${index + 1}: webpack tilde package import`);
      }
    });
  }
}

await walk('src');

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}
