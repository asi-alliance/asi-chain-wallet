import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, ReactElement } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "wagmiConfig";

const queryClient = new QueryClient();

export const EvmProvider = ({ children }: PropsWithChildren): ReactElement => {
    return (
        <WagmiProvider config={wagmiConfig}>
            <RainbowKitProvider>{children}</RainbowKitProvider>
        </WagmiProvider>
    );
};
