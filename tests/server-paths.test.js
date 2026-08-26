import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { staticRoot } from '../src/lib/server/paths';

describe('server paths', () => {
  it('maps an explicit project root to its dist directory', () => {
    expect(staticRoot('/tmp/wowser')).toBe(join('/tmp/wowser', 'dist'));
  });

  it('defaults to process.cwd()', () => {
    expect(staticRoot()).toBe(join(process.cwd(), 'dist'));
  });
});
