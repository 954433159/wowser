import { describe, expect, it } from 'vitest';
import * as DBC from 'blizzardry/lib/dbc/entities';
import { DecodeStream } from 'blizzardry/lib/restructure';

describe('Blizzardry compatibility surface', () => {
  it('keeps the pure module paths used by Wowser', () => {
    expect(DBC.Map).toBeDefined();
    expect(DecodeStream).toBeTypeOf('function');
  });
});
