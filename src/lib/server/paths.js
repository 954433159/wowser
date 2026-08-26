import { join } from 'node:path';

export function staticRoot(root = process.cwd()) {
  return join(root, 'dist');
}
