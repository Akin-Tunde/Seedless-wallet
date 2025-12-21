import { openContractCall } from '@stacks/connect';

export const TransactionSender = () => {
    const handleSend = () => {
        openContractCall({
            contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
            contractName: 'example-contract',
            functionName: 'example-function',
            functionArgs: [],
            onFinish: (data) => {
                console.log('Finished', data);
            },
        });
    };

    return (
        <div>
            <h3>Send Transaction</h3>
            <button onClick={handleSend}>Send</button>
        </div>
    );
};
