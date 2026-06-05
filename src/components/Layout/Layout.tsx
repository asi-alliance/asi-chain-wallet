import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { RootState } from "store";
import { selectNetwork } from "store/walletSlice";
import { HeaderBar } from "./HeaderBar";
import { DesktopNavComponent } from "./DesktopNavComponent";
import { MobileNavDrawerComponent } from "./MobileNavDrawerComponent";
import { useNavItems } from "./useNavItems";

const Container = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
`;

const Main = styled.main<{ $fullWidth?: boolean }>`
    flex: 1;
    padding: ${({ $fullWidth }) => ($fullWidth ? "16px" : "16px")};
    max-width: ${({ $fullWidth }) => ($fullWidth ? "none" : "1200px")};
    margin: 0 auto;
    width: 100%;

    @media (min-width: 769px) {
        padding: ${({ $fullWidth }) => ($fullWidth ? "24px" : "24px")};
    }
`;

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const dispatch = useDispatch();
    const location = useLocation();
    const { networks, selectedNetwork, selectedAccount } = useSelector(
        (state: RootState) => state.wallet,
    );
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const { accounts } = useSelector((state: RootState) => state.wallet);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [networkStatus, setNetworkStatus] = useState<
        "connected" | "disconnected" | "checking"
    >("checking");

    useEffect(() => {
        const checkNetwork = async () => {
            if (!selectedNetwork) return;

            const networkUrl =
                selectedNetwork.readOnlyUrl || selectedNetwork.url;
            if (!networkUrl || !networkUrl.trim()) {
                setNetworkStatus("disconnected");
                return;
            }

            setNetworkStatus("checking");
            try {
                const response = await fetch(networkUrl + "/api/status", {
                    method: "GET",
                    headers: { Accept: "application/json" },
                    signal: AbortSignal.timeout(5000),
                });
                setNetworkStatus(response.ok ? "connected" : "disconnected");
            } catch {
                setNetworkStatus("disconnected");
            } finally {
                setLastRefresh(new Date());
            }
        };

        checkNetwork();
        const interval = setInterval(checkNetwork, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [selectedNetwork]);

    useEffect(() => {
        const setCachedNetwork = () => {
            if (!isAuthenticated || !selectedAccount?.address) {
                return;
            }

            if (
                selectedNetwork?.id &&
                selectedAccount.networkId === selectedNetwork.id
            ) {
                return;
            }

            const networkByAddressMapRaw = localStorage.getItem(
                "NETWORKS_BY_ADDRESS",
            );

            if (!networkByAddressMapRaw) {
                return;
            }

            const networkByAddressMap = JSON.parse(networkByAddressMapRaw);
            const lastSelectedNetworkId =
                networkByAddressMap[selectedAccount.address];

            if (!lastSelectedNetworkId) {
                return;
            }

            if (selectedNetwork?.id === lastSelectedNetworkId) {
                return;
            }

            const networkToSet = networks.find(
                (network) => network.id === lastSelectedNetworkId,
            );

            if (!networkToSet) {
                return;
            }

            dispatch(selectNetwork(networkToSet.id));
        };

        setCachedNetwork();
    }, [
        isAuthenticated,
        selectedAccount,
        networks,
        dispatch,
        selectedNetwork?.id,
    ]);

    const cacheNetworkByAddress = (networkId: string) => {
        if (!isAuthenticated || !selectedAccount?.address) {
            return;
        }

        const networkByAddressMapRaw = localStorage.getItem(
            "NETWORKS_BY_ADDRESS",
        );

        const networkByAddressMap = !!networkByAddressMapRaw
            ? JSON.parse(networkByAddressMapRaw)
            : {};

        networkByAddressMap[selectedAccount?.address] = networkId;

        localStorage.setItem(
            "NETWORKS_BY_ADDRESS",
            JSON.stringify(networkByAddressMap),
        );
    };

    const handleNetworkChange = (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        dispatch(selectNetwork(event.target.value));
        cacheNetworkByAddress(event.target.value);
    };

    const navItems = useNavItems(accounts);

    return (
        <Container>
            <HeaderBar onMobileMenuToggle={() => setMobileMenuOpen(true)} />

            <DesktopNavComponent
                navItems={navItems}
                networkStatus={networkStatus}
                lastRefresh={lastRefresh}
                selectedNetwork={selectedNetwork}
                networks={networks}
                onNetworkChange={handleNetworkChange}
            />

            <MobileNavDrawerComponent
                isOpen={mobileMenuOpen}
                navItems={navItems}
                onClose={() => setMobileMenuOpen(false)}
            />

            <Main $fullWidth={location.pathname === "/deploy"}>{children}</Main>
        </Container>
    );
};
