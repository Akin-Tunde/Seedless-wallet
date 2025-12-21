export async function generateP256KeyPair(): Promise<{ publicKey: Uint8Array; privateKey: CryptoKey }> {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: 'ECDSA',
            namedCurve: 'P-256',
        },
        true,
        ['sign', 'verify']
    );

    const rawPublicKey = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
    const compressedPublicKey = compressPublicKey(new Uint8Array(rawPublicKey));

    return {
        publicKey: compressedPublicKey,
        privateKey: keyPair.privateKey,
    };
}

function compressPublicKey(uncompressed: Uint8Array): Uint8Array {
    // uncompressed key is 65 bytes: 0x04 + x (32) + y (32)
    if (uncompressed.length !== 65 || uncompressed[0] !== 0x04) {
        throw new Error('Invalid uncompressed public key format');
    }

    const x = uncompressed.slice(1, 33);
    const y = uncompressed.slice(33, 65);
    const yIsEven = (y[31] & 1) === 0;

    const compressed = new Uint8Array(33);
    compressed[0] = yIsEven ? 0x02 : 0x03;
    compressed.set(x, 1);

    return compressed;
}

export function bufferToHex(buffer: Uint8Array): string {
    return Array.from(buffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
