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


/**
 * Triggers the browser's Passkey creation (FaceID/TouchID)
 * Returns the compressed P-256 public key for Clarity
 */
export async function registerPasskey(username: string = "User"): Promise<Uint8Array> {
    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    
    const credential = await navigator.credentials.create({
        publicKey: {
            challenge,
            rp: { name: "Stacks Biometric Wallet" },
            user: {
                id: window.crypto.getRandomValues(new Uint8Array(16)),
                name: username,
                displayName: username
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }], // -7 = ES256 (P-256)
            authenticatorSelection: { userVerification: "required" },
            timeout: 60000
        }
    }) as AuthenticatorAttestationResponseJSON;

    // This requires a helper to parse the CBOR/COSE public key
    // For this fix, we assume a standard WebAuthn parser is used 
    // or the raw coordinates are extracted.
    return extractRawPublicKey(credential); 
}

/**
 * Converts a DER signature (WebAuthn default) to a 64-byte Raw signature (Clarity)
 */
export function derToRaw(der: ArrayBuffer): Uint8Array {
    const buf = new Uint8Array(der);
    let offset = 0;

    if (buf[offset++] !== 0x30) throw new Error("Invalid DER");
    offset++; // length

    // Extract R
    if (buf[offset++] !== 0x02) throw new Error("Invalid DER R");
    let rLen = buf[offset++];
    let r = buf.slice(offset, offset + rLen);
    if (r[0] === 0x00) r = r.slice(1); // remove padding
    offset += rLen;

    // Extract S
    if (buf[offset++] !== 0x02) throw new Error("Invalid DER S");
    let sLen = buf[offset++];
    let s = buf.slice(offset, offset + sLen);
    if (s[0] === 0x00) s = s.slice(1); // remove padding

    const raw = new Uint8Array(64);
    raw.set(r, 32 - r.length);
    raw.set(s, 64 - s.length);
    return raw;
}

// Internal mock for COSE parsing (normally use @passwordless-id/webauthn)
function extractRawPublicKey(cred: any): Uint8Array {
    // Logic to parse the credential.response.getPublicKey() 
    // and compress it to 33 bytes starting with 0x02 or 0x03
    return new Uint8Array(33); // Placeholder
}
