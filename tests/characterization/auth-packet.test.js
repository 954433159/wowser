import { describe, expect, it } from 'vitest';
import AuthOpcode from '../../src/lib/auth/opcode';
import AuthPacket from '../../src/lib/auth/packet';

describe('AuthPacket legacy behavior', () => {
  it('reserves one header byte and writes the opcode during finalize', () => {
    const packet = new AuthPacket(AuthOpcode.LOGON_PROOF, 4);

    expect(packet.headerSize).toBe(1);
    expect(packet.index).toBe(1);
    expect(packet.opcodeName).toBe('LOGON_PROOF');

    packet.writeByte(0xaa);
    packet.finalize();

    expect(new Uint8Array(packet.buffer)[0]).toBe(AuthOpcode.LOGON_PROOF);
  });
});
