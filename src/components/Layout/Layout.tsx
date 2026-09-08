import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { RootState } from "store";
import { selectAccounts } from "store/WalletsStore";
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
    const location = useLocation();
    const observerUrl = useSelector(
        (state: RootState) => state.walletsStore.selectedNetwork.observerUrl,
    );
    const accounts = useSelector(selectAccounts);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [networkStatus, setNetworkStatus] = useState<
        "connected" | "disconnected" | "checking"
    >("checking");

    useEffect(() => {
        const checkNetwork = async () => {
            if (!observerUrl) {
                setNetworkStatus("disconnected");
                return;
            }

            setNetworkStatus("checking");
            try {
                const response = await fetch(observerUrl + "/api/status", {
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
    }, [observerUrl]);

    const navItems = useNavItems(accounts);

    return (
        <Container>
            <HeaderBar onMobileMenuToggle={() => setMobileMenuOpen(true)} />

            <DesktopNavComponent
                navItems={navItems}
                networkStatus={networkStatus}
                lastRefresh={lastRefresh}
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
