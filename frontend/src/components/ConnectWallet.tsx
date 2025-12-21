import { useState, useEffect } from 'react';
import { userSession, authenticate } from '../lib/stacks-auth';

// Configure the app with permissions
// Removed local appConfig
// Create a UserSession object
// Removed local userSession

const ConnectWallet = () => {
    const [userData, setUserData] = useState<any>(null);

    const handleConnect = () => {
        authenticate();
    };

    const handleSignOut = () => {
        userSession.signUserOut();
        setUserData(null);
    };

    useEffect(() => {
        if (userSession.isUserSignedIn()) {
            setUserData(userSession.loadUserData());
        }
    }, []);

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
            <h2>Stacks Wallet Connection</h2>
            {!userData ? (
                <button
                    onClick={handleConnect}
                    style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
                >
                    Connect Wallet
                </button>
            ) : (
                <div>
                    <p><strong>Status:</strong> Connected</p>
                    <p><strong>Address (Testnet):</strong> {userData.profile.stxAddress.testnet}</p>
                    <p><strong>Address (Mainnet):</strong> {userData.profile.stxAddress.mainnet}</p>
                    <button
                        onClick={handleSignOut}
                        style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

export default ConnectWallet;
