import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import {
    AnchorMode,
    PostConditionMode,
    makeContractCall,
    broadcastTransaction,
    Pc,
    FungibleConditionCode,
} from '@stacks/transactions';

export {
    AnchorMode,
    PostConditionMode,
    makeContractCall,
    broadcastTransaction,
    Pc,
    FungibleConditionCode,
};

export const getNetwork = (isMainnet: boolean = false) => {
    return isMainnet ? STACKS_MAINNET : STACKS_TESTNET;
};

export const createStxPostCondition = (address: string, amount: bigint) => {
    return Pc.principal(address).willSendEq(amount).ustx();
};
