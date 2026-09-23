import React, { useCallback, useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { RootState } from "store";
import { HeaderBar } from "./HeaderBar";
import { DesktopNavComponent } from "./DesktopNavComponent";
import { MobileNavDrawerComponent } from "./MobileNavDrawerComponent";
import { useNavItems } from "./useNavItems";
import { selectAccounts } from "store/WalletsStore";

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
    const accounts = useSelector(selectAccounts);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [networkStatus, setNetworkStatus] = useState<
        "connected" | "disconnected" | "checking"
    >("checking");

    const openMobileMenu = useCallback(() => setMobileMenuOpen(true), []);
    const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

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

    // Desktop nav replaces the drawer above the navigation breakpoint; clear open state
    // so body scroll lock and aria-expanded do not linger after a resize.
    useEffect(() => {
        const media = window.matchMedia(
            `(max-width: ${theme.breakpoints.navigation})`,
        );
        const syncDrawerToViewport = () => {
            if (!media.matches) {
                setMobileMenuOpen(false);
            }
        };

        syncDrawerToViewport();
        media.addEventListener("change", syncDrawerToViewport);
        return () => media.removeEventListener("change", syncDrawerToViewport);
    }, [theme.breakpoints.navigation]);

    const navItems = useNavItems(accounts);

    return (
        <Container>
            <HeaderBar
                isMobileMenuOpen={mobileMenuOpen}
                onMobileMenuToggle={openMobileMenu}
            />

            <DesktopNavComponent
                navItems={navItems}
                networkStatus={networkStatus}
                lastRefresh={lastRefresh}
            />

            <MobileNavDrawerComponent
                isOpen={mobileMenuOpen}
                navItems={navItems}
                onClose={closeMobileMenu}
            />

            <Main $fullWidth={location.pathname === "/deploy"}>{children}</Main>
        </Container>
    );
};
