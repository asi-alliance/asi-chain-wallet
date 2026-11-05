import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { PropsWithChildren, ReactElement } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "wagmiConfig";

export const EvmProvider = ({ children }: PropsWithChildren): ReactElement => {
    return (
        <WagmiProvider config={wagmiConfig}>
            <RainbowKitProvider>{children}</RainbowKitProvider>
        </WagmiProvider>
    );
};
