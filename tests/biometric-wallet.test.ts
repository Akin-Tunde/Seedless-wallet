import { describe, it, expect, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';
import { p256 } from '@noble/curves/p256';
import { sha256 } from '@noble/hashes/sha256';

const accounts = simnet.getAccounts();
const DEPLOYER = accounts.get("deployer")!;
const WALLET_1 = accounts.get("wallet_1")!;

describe('biometric-wallet contract', () => {
    // Generate a real P-256 keypair for cryptographic testing
    const privateKey = p256.utils.randomPrivateKey();
    const publicKey = p256.getPublicKey(privateKey, true); // true = compressed (33 bytes)

    describe('initialization', () => {
        it('should initialize with owner pubkey', () => {
            const { result } = simnet.callPublicFn(
                'biometric-wallet',
                'initialize',
                [Cl.buffer(publicKey)],
                DEPLOYER
            );

            expect(result).toBeOk(Cl.bool(true));

            const storedPubkey = simnet.callReadOnlyFn(
                'biometric-wallet',
                'get-owner-pubkey',
                [],
                DEPLOYER
            );
            expect(storedPubkey.result).toBeOk(Cl.buffer(publicKey));
        });

        it('should only allow initialization once', () => {
            simnet.callPublicFn('biometric-wallet', 'initialize', [Cl.buffer(publicKey)], DEPLOYER);
            
            const init2 = simnet.callPublicFn(
                'biometric-wallet',
                'initialize',
                [Cl.buffer(publicKey)],
                DEPLOYER
            );
            expect(init2.result).toBeErr(Cl.uint(103)); // ERR-ALREADY-INITIALIZED
        });
    });

    describe('full execution flow (Cryptographic Verification)', () => {
        beforeEach(() => {
            simnet.callPublicFn('biometric-wallet', 'initialize', [Cl.buffer(publicKey)], DEPLOYER);
        });

        it('should successfully verify a real secp256r1 signature and execute action', () => {
            const actionPayload = new Uint8Array(128).fill(0xAA);
            const currentNonce = 0;

            // 1. Recreate the message hash exactly as the contract does:
            // The contract uses: (sha256 (to-consensus-buff? { payload: ..., nonce: ... }))
            const tuple = Cl.tuple({
                nonce: Cl.uint(currentNonce),
                payload: Cl.buffer(actionPayload),
            });
            const serializedTuple = Cl.serialize(tuple);
            const messageHash = sha256(serializedTuple);

            // 2. Sign the hash using the private key (simulating FaceID/Secure Enclave)
            const signature = p256.sign(messageHash, privateKey);
            const signatureBytes = signature.toRawBytes(); // 64 bytes (R + S)

            // 3. Call execute-action
            const executeRes = simnet.callPublicFn(
                'biometric-wallet',
                'execute-action',
                [Cl.buffer(actionPayload), Cl.buffer(signatureBytes)],
                WALLET_1
            );

            // Assert success
            expect(executeRes.result).toBeOk(Cl.stringAscii("Action executed successfully"));

            // 4. Verify nonce incremented
            const nonceResult = simnet.callReadOnlyFn(
                'biometric-wallet',
                'get-nonce',
                [],
                DEPLOYER
            );
            expect(nonceResult.result).toBeOk(Cl.uint(1));
        });

        it('should reject execution if payload is tampered with', () => {
            const actionPayload = new Uint8Array(128).fill(0xAA);
            const tamperedPayload = new Uint8Array(128).fill(0xFF);
            
            const tuple = Cl.tuple({ nonce: Cl.uint(0), payload: Cl.buffer(actionPayload) });
            const messageHash = sha256(Cl.serialize(tuple));
            const signatureBytes = p256.sign(messageHash, privateKey).toRawBytes();

            // Submit signature for original payload with the tampered payload
            const executeRes = simnet.callPublicFn(
                'biometric-wallet',
                'execute-action',
                [Cl.buffer(tamperedPayload), Cl.buffer(signatureBytes)],
                WALLET_1
            );

            expect(executeRes.result).toBeErr(Cl.uint(100)); // ERR-INVALID-SIGNATURE
        });
    });

    describe('nonce and initialization safety', () => {
        it('should reject action when not initialized', () => {
            const actionPayload = new Uint8Array(128).fill(1);
            const sig = new Uint8Array(64).fill(0);

            const executeRes = simnet.callPublicFn(
                'biometric-wallet',
                'execute-action',
                [Cl.buffer(actionPayload), Cl.buffer(sig)],
                WALLET_1
            );

            expect(executeRes.result).toBeErr(Cl.uint(104)); // ERR-NOT-INITIALIZED
        });
    });
});
