import { useState } from 'react';
import { openContractCall } from '@stacks/connect';
import { uintCV, principalCV, bufferCV } from '@stacks/transactions';
import { derToRaw } from '../utils/crypto';

export const TransactionSender = () => {
    const [loading, setLoading] = useState(false);

    const handleBiometricTransfer = async () => {
        setLoading(true);
        try {
            const amount = 1000000; // 1 STX
            const recipient = "ST1SJ3...YPD5";
            
            // 1. Request Biometric Signature via WebAuthn
            // The browser will show "Confirm with FaceID"
            const auth = await navigator.credentials.get({
                publicKey: {
                    challenge: new Uint8Array(32), // In prod, this is the message hash
                    userVerification: "required"
                }
            }) as any;

            const rawSig = derToRaw(auth.response.signature);

            // 2. Call the Smart Contract
            await openContractCall({
                contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
                contractName: 'biometric-wallet',
                functionName: 'send-stx',
                functionArgs: [
                    uintCV(amount),
                    principalCV(recipient),
                    bufferCV(rawSig)
                ],
                onFinish: (data) => console.log("Success!", data),
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded">
            <h3>Transfer STX</h3>
            <p>Authentication via FaceID/TouchID</p>
            <button onClick={handleBiometricTransfer} disabled={loading}>
                {loading ? "Authorizing..." : "Send 1 STX with Biometrics"}
            </button>
        </div>
    );
};
