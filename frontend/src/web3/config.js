import { defineChain } from 'viem';
import { createConfig, createConnector, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  injectedWallet,
  rabbyWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
  trustWallet,
} from '@rainbow-me/rainbowkit/wallets';

export const robinhood = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.chain.robinhood.com'] } },
  blockExplorers: { default: { name: 'Blockscout', url: 'https://robinhoodchain.blockscout.com' } },
});

const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '1b4f4f3e7b1a1000d024b420088031d6'; // fallback for preview/testing

const hasMetaMaskExtension = () => {
  if (typeof window === 'undefined') return false;
  const eth = window.ethereum;
  if (!eth) return false;
  if (Array.isArray(eth.providers)) return eth.providers.some((p) => p && p.isMetaMask);
  return !!eth.isMetaMask;
};

// MetaMask via the plain injected provider (the extension itself) instead of the
// MetaMask SDK connector, which can hang on "Opening MetaMask..." in embedded/preview contexts.
const metaMaskExtensionWallet = (params) => {
  const base = metaMaskWallet(params);
  return {
    id: 'metaMaskExtension',
    name: 'MetaMask',
    rdns: 'io.metamask',
    iconUrl: base.iconUrl,
    iconBackground: base.iconBackground,
    iconAccent: base.iconAccent,
    installed: hasMetaMaskExtension(),
    downloadUrls: base.downloadUrls,
    extension: base.extension,
    createConnector: (walletDetails) =>
      createConnector((config) => ({
        ...injected({ target: 'metaMask' })(config),
        ...walletDetails,
      })),
  };
};

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Browser Wallets',
      wallets: [metaMaskExtensionWallet, rabbyWallet, injectedWallet],
    },
    {
      groupName: 'Mobile & Other',
      wallets: [rainbowWallet, walletConnectWallet, coinbaseWallet, trustWallet],
    },
  ],
  { appName: 'GoalHoodz - Early', projectId }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [robinhood],
  transports: { [robinhood.id]: http(robinhood.rpcUrls.default.http[0]) },
  ssr: false,
});

export const isEmbedded = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};
