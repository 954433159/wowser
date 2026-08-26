import { describe, expect, it } from 'vitest';
import ObjectUtil from '../../src/lib/utils/object-util';

describe('ObjectUtil.keyByValue legacy behavior', () => {
  it('caches the reverse lookup on the source object', () => {
    const values = { FIRST: 1, SECOND: 2 };

    expect(ObjectUtil.keyByValue(values, 2)).toBe('SECOND');
    expect(values.lookup).toEqual({ 1: 'FIRST', 2: 'SECOND' });
    expect(ObjectUtil.keyByValue(values, 1)).toBe('FIRST');
  });
});
