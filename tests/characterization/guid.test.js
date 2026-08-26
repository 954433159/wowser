import { describe, expect, it } from 'vitest';
import ByteBuffer from 'byte-buffer';
import GUID from '../../src/lib/game/guid';

describe('GUID legacy behavior', () => {
  it('reads low then high 32-bit words', () => {
    const buffer = new ByteBuffer(GUID.LENGTH, ByteBuffer.LITTLE_ENDIAN);
    buffer.writeUnsignedInt(0x12345678);
    buffer.writeUnsignedInt(0x9abcdef0);
    buffer.front();

    const guid = new GUID(buffer);
    expect(guid.low).toBe(0x12345678);
    expect(guid.high).toBe(0x9abcdef0);
  });

  it('preserves the current shortened debug string', () => {
    const buffer = new ByteBuffer(GUID.LENGTH, ByteBuffer.LITTLE_ENDIAN);
    buffer.writeUnsignedInt(0x12345678);
    buffer.writeUnsignedInt(0x9abcdef0);
    buffer.front();

    expect(new GUID(buffer).toString()).toBe('[GUID; Hex: 0xdef05678]');
  });
});
