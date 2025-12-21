import { useState } from 'react';
import { openContractCall } from '@stacks/connect';
import { bufferCV } from '@stacks/transactions';
import { userSession } from '../utils/auth';
import { generateP256KeyPair, bufferToHex } from '../utils/crypto';

const InitializeWallet = () => {
    // Removed unused hook
    const [isInitializing, setIsInitializing] = useState(false);
    const [txId, setTxId] = useState<string | null>(null);

    const handleInitialize = async () => {
        setIsInitializing(true);
        try {
            // Generate a fresh P-256 key pair
            // In a real app, this would be stored securely or derived from WebAuthn
            const { publicKey } = await generateP256KeyPair();

            console.log('Generated Public Key:', bufferToHex(publicKey));

            const functionArgs = [
                bufferCV(publicKey)
            ];

            // Inspect Clarinet.toml to get standard deployer address for devnet if possible,
            // or assume standard `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM` 
            // and contract name `biometric-wallet`
            const contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
            const contractName = 'biometric-wallet';
            const functionName = 'initialize';

            await openContractCall({
                contractAddress,
                contractName,
                functionName,
                functionArgs,
                onFinish: (data) => {
                    console.log('Transaction finished:', data);
                    setTxId(data.txId);
                    setIsInitializing(false);
                },
                onCancel: () => {
                    console.log('Transaction canceled');
                    setIsInitializing(false);
                },
                userSession,
            });

        } catch (error) {
            console.error('Initialization failed:', error);
            setIsInitializing(false);
        }
    };

    if (!userSession.isUserSignedIn()) {
        return null;
    }

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>Initialize Smart Wallet</h3>
            <p>Generate a biometric key and initialize your on-chain wallet.</p>

            <button
                onClick={handleInitialize}
                disabled={isInitializing}
                style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
            >
                {isInitializing ? 'Initializing...' : 'Initialize Wallet'}
            </button>

            {txId && (
                <div style={{ marginTop: '10px', wordBreak: 'break-all' }}>
                    <strong>Transaction ID:</strong> {txId}
                </div>
            )}
        </div>
    );
};

export default InitializeWallet;
