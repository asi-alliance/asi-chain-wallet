import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { sepolia, baseSepolia } from "wagmi/chains";

const connectors = connectorsForWallets(
    [
        {
            groupName: "Recommended",
            wallets: [injectedWallet],
        },
    ],
    {
        appName: "ASI Wallet Bridge",
        projectId:
            process.env.REACT_APP_WALLETCONNECT_PROJECT_ID ||
            "asi-wallet-bridge",
    },
);

export const wagmiConfig = createConfig({
    connectors,
    chains: [sepolia, baseSepolia],
    transports: {
        [sepolia.id]: http(),
        [baseSepolia.id]: http(),
    },
    ssr: false,
});
