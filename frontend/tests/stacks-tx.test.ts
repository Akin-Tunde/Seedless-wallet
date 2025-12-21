import { describe, it, expect } from 'vitest';
import { getNetwork } from '../src/lib/stacks-tx';
import { ChainId } from '@stacks/network';

describe('stacks-tx library', () => {
    it('returns testnet by default', () => {
        const network = getNetwork();
        expect(network.chainId).toBe(ChainId.Testnet);
    });

    it('returns mainnet when requested', () => {
        const network = getNetwork(true);
        expect(network.chainId).toBe(ChainId.Mainnet);
    });
});
