import React, { useCallback, useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { RootState } from "store";
import { HeaderBar } from "./HeaderBar";
import { DesktopNavComponent } from "./DesktopNavComponent";
import { MobileNavDrawerComponent } from "./MobileNavDrawerComponent";
import { getNavItems } from "./navItems";
import { useMediaQuery } from "hooks";
import { selectAccounts, selectSelectedNetworkId } from "store/WalletsStore";

const Container = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
`;

const Main = styled.main<{ $fullWidth?: boolean }>`
    flex: 1;
    padding: ${({ theme }) => theme.layout.gutterMobile};
    max-width: ${({ $fullWidth, theme }) =>
        $fullWidth ? "none" : theme.layout.contentWide};
    margin: 0 auto;
    width: 100%;

    @media (min-width: calc(${({ theme }) => theme.breakpoints.mobile} + 1px)) {
        padding: ${({ theme }) => theme.layout.gutterDesktop};
    }
`;

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const theme = useTheme();
    const observerUrl = useSelector(
        (state: RootState) => state.walletsStore.selectedNetwork.observerUrl,
    );
    const selectedNetworkId = useSelector(selectSelectedNetworkId);
    const hasAccounts = useSelector(
        (state: RootState) => selectAccounts(state).length > 0,
    );
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [networkStatus, setNetworkStatus] = useState<
        "connected" | "disconnected" | "checking"
    >("checking");

    const openMobileMenu = useCallback(() => setMobileMenuOpen(true), []);
    const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

    useEffect(() => {
        let active = true;
        let latestCheck = 0;
        const checkNetwork = async () => {
            const checkId = ++latestCheck;
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
                if (active && checkId === latestCheck) {
                    setNetworkStatus(response.ok ? "connected" : "disconnected");
                }
            } catch {
                if (active && checkId === latestCheck) {
                    setNetworkStatus("disconnected");
                }
            } finally {
                if (active && checkId === latestCheck) {
                    setLastRefresh(new Date());
                }
            }
        };

        checkNetwork();
        const interval = setInterval(checkNetwork, 60000); // Check every minute

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [observerUrl, selectedNetworkId]);

    const isNavCollapsed = useMediaQuery(
        `(max-width: ${theme.breakpoints.navigation})`,
    );
    const isMobileMenuVisible = mobileMenuOpen && isNavCollapsed;
    const navItems = getNavItems(hasAccounts);

    return (
        <Container>
            <HeaderBar
                isMobileMenuOpen={isMobileMenuVisible}
                onMobileMenuToggle={openMobileMenu}
            />

            <DesktopNavComponent
                navItems={navItems}
                networkStatus={networkStatus}
                lastRefresh={lastRefresh}
            />

            <MobileNavDrawerComponent
                isOpen={isMobileMenuVisible}
                navItems={navItems}
                onClose={closeMobileMenu}
            />

            <Main $fullWidth={location.pathname === "/deploy"}>{children}</Main>
        </Container>
    );
};
