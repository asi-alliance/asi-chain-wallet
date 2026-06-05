import React from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";

const DesktopNavStyled = styled.nav`
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

const NavLinks = styled.nav`
    display: flex;
    align-items: center;
    gap: 16px;

    @media (max-width: 1250px) {
        display: none;
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

const Delimiter = styled.div`
    display: flex;
    align-items: center;
`;

const RightSection = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;

    @media (max-width: 705px) {
        margin: 0 auto;
    }
`;

const NetworkSelector = styled.select`
    padding: 6px;
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

const NetworkStatusBar = styled.div<{ $connected: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
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
`;

const StatusDot = styled.div<{ $connected: boolean }>`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    background: ${({ $connected, theme }) =>
        $connected ? theme.success : theme.danger};
`;

const DelimiterIcon = () => (
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

const ExternalIcon = () => (
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
);

const formatRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
};

const externalLinksSet = [
    { path: `${process.env.REACT_APP_EXPLORER_URL}`, label: "Explorer" },
    { path: `${process.env.REACT_APP_FAUCET_URL}`, label: "Faucet" },
];

interface NavItem {
    path: string;
    label: string;
}

interface DesktopNavComponentProps {
    navItems: NavItem[];
    networkStatus: "connected" | "disconnected" | "checking";
    lastRefresh: Date;
    selectedNetwork: any;
    networks: any[];
    onNetworkChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const DesktopNavComponent: React.FC<DesktopNavComponentProps> = ({
    navItems,
    networkStatus,
    lastRefresh,
    selectedNetwork,
    networks,
    onNetworkChange,
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <DesktopNavStyled>
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
                <DelimiterIcon />
                {externalLinksSet.map((item) => (
                    <ExternalNavLink
                        $active={false}
                        key={item.path}
                        className="text-1"
                        onClick={() => window.open(item.path, "_blank")}
                    >
                        {item.label}
                        <ExternalIcon />
                    </ExternalNavLink>
                ))}
            </NavLinks>
            <RightSection>
                <StatusDot $connected={networkStatus === "connected"} />
                <NetworkSelector
                    id="mobile-header-network-selector"
                    value={selectedNetwork.id}
                    onChange={onNetworkChange}
                >
                    {networks.map((network) => (
                        <option
                            key={network.id}
                            value={network.id}
                            disabled={!network.url || network.url.trim() === ""}
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
                        <DelimiterIcon />
                        <span id="dashboard-network-status">
                            {networkStatus === "checking"
                                ? "Checking..."
                                : networkStatus === "connected"
                                  ? "Connected"
                                  : "Disconnected"}
                        </span>
                        <DelimiterIcon />
                        <LastUpdated id="dashboard-last-updated">
                            <span>
                                Updated {formatRelativeTime(lastRefresh)}
                            </span>
                        </LastUpdated>
                    </NetworkInfo>
                </NetworkStatusBar>
            </RightSection>
        </DesktopNavStyled>
    );
};
