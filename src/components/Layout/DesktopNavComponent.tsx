import React from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import { VisuallyHidden } from "components/Foundation";
import { NetworkSelector } from "components/NetworkSelector";

const DesktopNavStyled = styled.nav`
    height: ${({ theme }) => theme.layout.navigationHeight};
    align-items: center;
    background: ${({ theme }) => theme.surface};
    border-bottom: 1px solid ${({ theme }) => theme.border};
    padding: 0 ${({ theme }) => theme.layout.gutterMobile};
    display: flex;
    gap: ${({ theme }) => theme.spacing["3xl"]};
    overflow-x: auto;

    @media (min-width: calc(${({ theme }) => theme.breakpoints.mobile} + 1px)) {
        padding: 0 ${({ theme }) => theme.layout.gutterDesktop};
    }

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
    gap: ${({ theme }) => theme.spacing.xl};

    @media (max-width: ${({ theme }) => theme.breakpoints.navigation}) {
        display: none;
    }
`;

const NavLink = styled.button<{ $active: boolean }>`
    display: flex;
    align-items: center;
    gap: 5px;
    height: 100%;
    padding: 8px 0;
    background: none;
    border: none;
    border-bottom: 3px solid
        ${({ $active, theme }) => ($active ? theme.primary : "transparent")};
    color: ${({ $active, theme }) =>
        $active ? theme.primary : theme.text.secondary};
    font-weight: ${({ $active }) => ($active ? "600" : "400")};
    cursor: pointer;
    transition:
        color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        border-color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing};
    white-space: nowrap;
    font-size: ${({ theme }) => theme.typography.size.sm};

    &:hover {
        color: ${({ theme }) => theme.primary};
    }

    &:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 2px ${({ theme }) => theme.focusRing};
        border-radius: ${({ theme }) => theme.radii.xs};
    }
`;

const ExternalNavLink = styled(NavLink)`
    color: ${({ theme }) => theme.text.primary};
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

const NetworkStatusBar = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.md};
`;

const NetworkInfo = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.xl};
    font-size: ${({ theme }) => theme.typography.size.sm};
    color: ${({ theme }) => theme.text.secondary};
`;

const LastUpdated = styled.span`
    font-size: ${({ theme }) => theme.typography.size.sm};
    text-wrap: nowrap;
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
        aria-hidden="true"
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
    {
        path: `${process.env.REACT_APP_EXPLORER_URL}`,
        label: "Explorer",
    },
    {
        path: `${process.env.REACT_APP_FAUCET_URL}`,
        label: "Faucet",
    },
];

const openExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
};

interface NavItem {
    path: string;
    label: string;
}

interface DesktopNavComponentProps {
    navItems: NavItem[];
    networkStatus: "connected" | "disconnected" | "checking";
    lastRefresh: Date;
}

export const DesktopNavComponent: React.FC<DesktopNavComponentProps> = ({
    navItems,
    networkStatus,
    lastRefresh,
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <DesktopNavStyled aria-label="Secondary navigation">
            <NavLinks aria-label="Primary">
                {navItems.map((item) => (
                    <NavLink
                        className="text-1"
                        key={item.path}
                        type="button"
                        $active={location.pathname === item.path}
                        aria-current={
                            location.pathname === item.path ? "page" : undefined
                        }
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
                        type="button"
                        className="text-1"
                        aria-label={`${item.label} (opens in a new tab)`}
                        onClick={() => openExternalLink(item.path)}
                    >
                        {item.label}
                        <ExternalIcon />
                    </ExternalNavLink>
                ))}
            </NavLinks>

            <RightSection>
                <StatusDot $connected={networkStatus === "connected"} />
                <VisuallyHidden id="header-network-selector-label">
                    Network
                </VisuallyHidden>
                <NetworkSelector
                    id="header-network-selector"
                    aria-labelledby="header-network-selector-label"
                    style={{
                        width: "200px",
                        minWidth: "200px",
                    }}
                />
                <NetworkStatusBar id="dashboard-network-status-bar">
                    <NetworkInfo id="dashboard-network-info">
                        <DelimiterIcon />

                        <span>
                            {networkStatus === "checking"
                                ? "Checking..."
                                : networkStatus === "connected"
                                  ? "Connected"
                                  : "Disconnected"}
                        </span>

                        <DelimiterIcon />

                        <LastUpdated>
                            Updated {formatRelativeTime(lastRefresh)}
                        </LastUpdated>
                    </NetworkInfo>
                </NetworkStatusBar>
            </RightSection>
        </DesktopNavStyled>
    );
};
