import React, { Fragment, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { RootState } from "store";
import { toggleTheme } from "store/themeSlice";
import { selectNetwork } from "store/walletSlice";
import { logout } from "store/authSlice";
import { AccountSwitcher } from "components/AccountSwitcher";
import {
    SunIcon,
    MoonIcon,
    MenuIcon,
    CloseIcon,
    LogoutIcon,
} from "components/Icons";
import { Button } from "components/Button";

const Container = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
`;

const Header = styled.header`
    background: ${({ theme }) => theme.card};
    border-bottom: 1px solid ${({ theme }) => theme.border};
    padding: 12px 16px;
    position: sticky;
    top: 0;
    z-index: 100;
`;

const HeaderTop = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
`;

const LeftSection = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
`;

const LogoContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
`;

const LogoText = styled.h1`
    font-family: "Roboto Mono", monospace;
    font-size: 18px;
    font-weight: 700;
    color: ${({ theme }) => theme.text.primary};
    margin: 0;
    display: none;

    @media (min-width: 1024px) {
        display: block;
    }
`;

const NavLinks = styled.nav`
    display: flex;
    align-items: center;
    gap: 16px;

    @media (max-width: 1250px) {
        display: none;
    }
`;

const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;

    @media (min-width: 769px) {
        gap: 16px;
    }
`;

const NetworkSelector = styled.select`
    padding: 6px;
    // border: 1px solid ${({ theme }) => theme.border};
    border: none;
    border-radius: 6px;
    background: ${({ theme }) => theme.surface};
    color: ${({ theme }) => theme.text.primary};
    font-size: 14px;
    max-width: 100px;
    margin-right: 16px;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const IconButton = styled.button`
    padding: 8px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    background: ${({ theme }) => theme.surface};
    color: ${({ theme }) => theme.text.primary};
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;

    &:hover {
        background: ${({ theme }) => theme.primary};
        color: white;
    }
`;

const AsideMenuToggle = styled(IconButton)`
    @media (min-width: 1250px) {
        display: none;
    }
`;

const DesktopButton = styled(IconButton)`
    @media (max-width: 1024px) {
        display: none;
    }
`;

// Desktop Nav
const DesktopNav = styled.nav`
    height: 41px;
    background: ${({ theme }) => theme.surface};
    border-bottom: 1px solid ${({ theme }) => theme.border};
    padding: 0 24px;
    display: flex;
    gap: 24px;
    overflow-x: auto;

    &::-webkit-scrollbar {
        height: 3px;
    }

    &::-webkit-scrollbar-track {
        background: ${({ theme }) => theme.surface};
    }

    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.border};
        border-radius: 3px;
    }
`;

// Mobile Nav Drawer
const MobileNavDrawer = styled.div<{ $isOpen: boolean }>`
    position: fixed;
    top: 0;
    right: ${({ $isOpen }) => ($isOpen ? "0" : "-100%")};
    width: 80%;
    max-width: 320px;
    height: 100vh;
    background: ${({ theme }) => theme.card};
    border-left: 1px solid ${({ theme }) => theme.border};
    transition: right 0.3s ease;
    z-index: 1000;
    overflow-y: auto;

    display: flex;
    flex-direction: column;

    @media (min-width: 1250px) {
        display: none;
    }
`;

const MobileNavOverlay = styled.div<{ $isOpen: boolean }>`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
    z-index: 999;

    @media (min-width: 1024px) {
        display: none;
    }
`;

const MobileNavHeader = styled.div`
    padding: 16px;
    border-bottom: 1px solid ${({ theme }) => theme.border};
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const MobileNavContent = styled.div`
    padding: 16px;
`;

const MobileNavSection = styled.div`
    // margin-bottom: 24px;
`;

const LogoutSection = styled.div`
    padding: 25px;
    margin-top: auto;
`;

const MobileNavLink = styled.button<{ $active: boolean }>`
    width: 100%;
    padding: 12px 16px;
    background: ${({ $active, theme }) =>
        $active ? theme.primary + "20" : "transparent"};
    border: none;
    border-left: 3px solid
        ${({ $active, theme }) => ($active ? theme.primary : "transparent")};
    color: ${({ $active, theme }) =>
        $active ? theme.primary : theme.text.secondary};
    font-weight: ${({ $active }) => ($active ? "600" : "400")};
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-size: 14px;
    margin-bottom: 4px;
    border-radius: 4px;

    &:hover {
        background: ${({ theme }) => theme.surface};
        color: ${({ theme }) => theme.primary};
    }
`;

const NavLink = styled.button<{ $active: boolean }>`
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 8px 0;
    background: none;
    border: none;
    border-bottom: 2px solid
        ${({ $active, theme }) => ($active ? theme.primary : "transparent")};
    color: ${({ $active, theme }) =>
        $active ? theme.primary : theme.text.secondary};
    font-weight: ${({ $active }) => ($active ? "600" : "400")};
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-size: 14px;

    &:hover {
        color: ${({ theme }) => theme.primary};
    }
`;

const ExternalNavLink = styled(NavLink)`
    color: ${({ theme }) => theme.text.primary};
    display: flex;
    align-items: center;
    gap: 5px;
`;

const ExternalNavLinkMobile = styled(MobileNavLink)`
    color: ${({ theme }) => theme.text.primary};
    display: flex;
    align-items: center;
    gap: 5px;
`;

const Delimiter = styled.div`
    display: flex;
    align-items: center;
`;

const DelimiterLine = styled.div`
    width: 100%;
    height: 1px;
    background: ${({ theme }) => theme.border};
    margin: 16px auto;
`;

const RightSection = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;

    @media (max-width: 705px) {
        margin: 0 auto;
    }
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

const NetworkInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 14px;
    color: ${({ theme }) => theme.text.secondary};
`;

const LastUpdated = styled.span`
    font-size: 14px;
    // color: ${({ theme }) => theme.text.tertiary};
`;

const StatusDot = styled.div<{ $connected: boolean }>`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    background: ${({ $connected, theme }) =>
        $connected ? theme.success : theme.danger};
`;

const NetworkStatusBar = styled.div<{ $connected: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const LogoutButton = styled(Button)`
    border-color: ${({ theme }) => theme.danger};
    color: ${({ theme }) => theme.danger};

    &:hover:not(:disabled) {
        background: ${({ theme }) =>
            theme.danger}1F; /* 12% opacity as per brand guide */
    }
`;

interface LogoImageProps {
    isDarkMode: boolean;
}

const LogoImage = ({ isDarkMode }: LogoImageProps) => {
    const fillColor = isDarkMode ? "#FFFFFF" : "#000000";

    return (
        <svg
            width="34"
            height="23"
            viewBox="0 0 186 126"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M0.473633 63.0687C0.473633 51.6685 9.70995 42.4211 21.1101 42.4211C32.5103 42.4211 41.7596 33.1829 41.7596 21.7827C41.7596 10.3844 51.0071 1.13504 62.4073 1.13504C73.8075 1.13504 83.0438 10.3844 83.0438 21.7827C83.0438 33.1829 73.8075 42.4211 62.4073 42.4211C51.0071 42.4211 41.7596 51.6685 41.7596 63.0687C41.7596 74.4689 51.0071 83.7052 62.4073 83.7052C73.8075 83.7052 83.0438 92.9545 83.0438 104.355C83.0438 115.753 73.8075 124.991 62.4073 124.991C51.0071 124.991 41.7596 115.753 41.7596 104.355C41.7596 92.9545 32.5103 83.7052 21.1101 83.7052C9.70995 83.7052 0.473633 74.4689 0.473633 63.0687Z"
                fill={fillColor}
                fillOpacity="0.87"
            />
            <path
                d="M185.525 63.0576C185.525 74.4577 176.289 83.7052 164.889 83.7052C153.489 83.7052 144.241 92.9434 144.241 104.344C144.241 115.742 134.992 124.991 123.592 124.991C112.191 124.991 102.955 115.742 102.955 104.344C102.955 92.9434 112.191 83.7052 123.592 83.7052C134.992 83.7052 144.241 74.4577 144.241 63.0576C144.241 51.6574 134.992 42.4211 123.592 42.4211C112.191 42.4211 102.955 33.1717 102.955 21.7716C102.955 10.3732 112.191 1.13504 123.592 1.13504C134.992 1.13504 144.241 10.3732 144.241 21.7716C144.241 33.1717 153.489 42.4211 164.889 42.4211C176.289 42.4211 185.525 51.6574 185.525 63.0576Z"
                fill={fillColor}
                fillOpacity="0.87"
            />
            <path
                d="M93.1989 82.8094C104.278 82.8094 113.26 73.8274 113.26 62.7482C113.26 51.6672 104.278 42.6852 93.1989 42.6852C82.1179 42.6852 73.1377 51.6672 73.1377 62.7482C73.1377 73.8274 82.1179 82.8094 93.1989 82.8094Z"
                fill={fillColor}
                fillOpacity="0.87"
            />
        </svg>
    );
};

const formatRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
};

const externalLinksSet = [
    { path: "/0", label: "Explorer" },
    { path: "/1", label: "Faucet" },
];

interface LayoutProps {
    children: React.ReactNode;
}

export const MobileLayout: React.FC<LayoutProps> = ({ children }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { darkMode } = useSelector((state: RootState) => state.theme);
    const { networks, selectedNetwork, accounts, selectedAccount } =
        useSelector((state: RootState) => state.wallet);
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
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

    const handleThemeToggle = () => {
        dispatch(toggleTheme());
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
        setMobileMenuOpen(false);
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    const navItems = useMemo(() => {
        if (!accounts?.length) {
            return [{ path: "/accounts", label: "Accounts" }];
        }

        return [
            { path: "/", label: "Wallet" },
            { path: "/send", label: "Send" },
            { path: "/receive", label: "Receive" },
            { path: "/accounts", label: "Accounts" },
            { path: "/history", label: "Transactions" },
            { path: "/deploy", label: "Deploy" },
            { path: "/settings", label: "Network Settings" },
        ];
    }, [accounts]);

    const DelimiterBlock = () => (
        <Delimiter>
            <svg
                width="1"
                height="24"
                viewBox="0 0 1 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <line
                    x1="0.5"
                    y1="24"
                    x2="0.500001"
                    y2="-2.18557e-08"
                    stroke="currentcolor"
                />
            </svg>
        </Delimiter>
    );

    const DelimiterBlockMobile = () => (
        <DelimiterLine>{/* <hr /> */}</DelimiterLine>
    );

    const ExternalLinks = () => {
        return (
            <Fragment>
                {externalLinksSet.map((item) => (
                    <ExternalNavLink
                        $active={false}
                        key={item.path}
                        className="text-1"
                        onClick={() => navigate(item.path)}
                    >
                        {item.label}
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M10.6667 10.6667H1.33333V1.33333H6V0H1.33333C0.593333 0 0 0.6 0 1.33333V10.6667C0 11.4 0.593333 12 1.33333 12H10.6667C11.4 12 12 11.4 12 10.6667V6H10.6667V10.6667ZM7.33333 0V1.33333H9.72667L3.17333 7.88667L4.11333 8.82667L10.6667 2.27333V4.66667H12V0H7.33333Z"
                                fill="currentcolor"
                            />
                        </svg>
                    </ExternalNavLink>
                ))}
            </Fragment>
        );
    };

    const ExternalLinksMobile = () => {
        return (
            <Fragment>
                {externalLinksSet.map((item) => (
                    <ExternalNavLinkMobile
                        $active={false}
                        key={item.path}
                        className="text-1"
                        onClick={() => navigate(item.path)}
                    >
                        {item.label}
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M10.6667 10.6667H1.33333V1.33333H6V0H1.33333C0.593333 0 0 0.6 0 1.33333V10.6667C0 11.4 0.593333 12 1.33333 12H10.6667C11.4 12 12 11.4 12 10.6667V6H10.6667V10.6667ZM7.33333 0V1.33333H9.72667L3.17333 7.88667L4.11333 8.82667L10.6667 2.27333V4.66667H12V0H7.33333Z"
                                fill="currentcolor"
                            />
                        </svg>
                    </ExternalNavLinkMobile>
                ))}
            </Fragment>
        );
    };

    return (
        <Container>
            <Header>
                <HeaderTop>
                    <LeftSection>
                        <LogoContainer onClick={() => navigate("/")}>
                            <LogoImage isDarkMode={darkMode} />
                            <LogoText>ASI:Chain Wallet</LogoText>
                        </LogoContainer>
                    </LeftSection>

                    <HeaderActions>
                        {isAuthenticated && accounts.length > 0 && (
                            <AccountSwitcher />
                        )}
                        <DesktopButton
                            onClick={handleThemeToggle}
                            title={
                                darkMode
                                    ? "Switch to Light Mode"
                                    : "Switch to Dark Mode"
                            }
                        >
                            {darkMode ? (
                                <SunIcon size={20} />
                            ) : (
                                <MoonIcon size={20} />
                            )}
                        </DesktopButton>

                        {isAuthenticated && (
                            <DesktopButton
                                onClick={handleLogout}
                                title={"Logout"}
                            >
                                <LogoutIcon size={20} />
                            </DesktopButton>
                        )}

                        <AsideMenuToggle
                            id="sidebar-menu-button"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <MenuIcon size={20} />
                        </AsideMenuToggle>
                    </HeaderActions>
                </HeaderTop>
            </Header>

            <DesktopNav>
                <NavLinks>
                    {navItems.map((item) => (
                        <NavLink
                            className="text-1"
                            key={item.path}
                            $active={location.pathname === item.path}
                            onClick={() => navigate(item.path)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                    <DelimiterBlock />
                    <ExternalLinks />
                </NavLinks>
                <RightSection>
                    <StatusDot $connected={networkStatus === "connected"} />
                    <NetworkSelector
                        id="mobile-header-network-selector"
                        value={selectedNetwork.id}
                        onChange={handleNetworkChange}
                    >
                        {networks.map((network) => (
                            <option
                                key={network.id}
                                value={network.id}
                                disabled={
                                    !network.url || network.url.trim() === ""
                                }
                            >
                                {network.name}
                            </option>
                        ))}
                    </NetworkSelector>
                    <NetworkStatusBar
                        id="dashboard-network-status-bar"
                        $connected={networkStatus === "connected"}
                    >
                        <NetworkInfo id="dashboard-network-info">
                            <DelimiterBlock />
                            <span id="dashboard-network-status">
                                {networkStatus === "checking"
                                    ? "Checking..."
                                    : networkStatus === "connected"
                                      ? "Connected"
                                      : "Disconnected"}
                            </span>
                            <DelimiterBlock />
                            <LastUpdated id="dashboard-last-updated ">
                                <span>
                                    Updated {formatRelativeTime(lastRefresh)}
                                </span>
                            </LastUpdated>
                        </NetworkInfo>
                    </NetworkStatusBar>
                </RightSection>
            </DesktopNav>

            <MobileNavOverlay
                $isOpen={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(false)}
            />
            <MobileNavDrawer $isOpen={mobileMenuOpen}>
                <MobileNavHeader>
                    <h2 style={{ margin: 0, fontSize: "18px" }}>Menu</h2>
                    <IconButton onClick={() => setMobileMenuOpen(false)}>
                        <CloseIcon size={20} />
                    </IconButton>
                </MobileNavHeader>

                <MobileNavContent>
                    <MobileNavSection>
                        {navItems.map((item) => (
                            <MobileNavLink
                                key={item.path}
                                $active={location.pathname === item.path}
                                onClick={() => handleNavigation(item.path)}
                            >
                                {item.label}
                            </MobileNavLink>
                        ))}
                        <DelimiterBlockMobile />
                        <ExternalLinksMobile />
                    </MobileNavSection>
                </MobileNavContent>
                <LogoutSection>
                    {isAuthenticated && (
                        <LogoutButton
                            fullWidth
                            variant="secondary"
                            onClick={handleLogout}
                        >
                            Logout
                            <svg
                                width="20"
                                height="18"
                                viewBox="0 0 20 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M2 2L10 2L10 0L2 6.99382e-07C0.899998 7.95547e-07 -1.49493e-06 0.9 -1.39876e-06 2L-1.74846e-07 16C-7.86805e-08 17.1 0.9 18 2 18L10 18L10 16L2 16L2 2Z"
                                    fill="currentcolor"
                                />
                                <path
                                    d="M15 4L13.6 5.4L16.2 8H6V10H16.2L13.6 12.6L15 14L20 9L15 4Z"
                                    fill="currentcolor"
                                />
                            </svg>
                        </LogoutButton>
                    )}
                </LogoutSection>
            </MobileNavDrawer>

            <Main $fullWidth={location.pathname === "/deploy"}>{children}</Main>
        </Container>
    );
};
