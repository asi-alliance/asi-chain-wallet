import React, { useState, useRef, useEffect, CSSProperties } from "react";
import styled, { css } from "styled-components";
import { truncateText } from "utils/textUtils";
import { formatBalanceCompact } from "utils/balanceUtils";

export interface AccountView {
    id: string;
    name: string;
    address: string;
    balance: string;
}

const SwitcherContainer = styled.div<{ $fullWidth?: boolean }>`
    position: relative;
    display: inline-block;

    ${({ $fullWidth }) =>
        $fullWidth &&
        css`
            width: 100%;
        `};
`;

const SwitcherButton = styled.button<{
    $layout?: "horizontal" | "vertical";
    $fullWidth: boolean;
    $disabled?: boolean;
}>`
    display: flex;
    align-items: center;
    gap: 8px;
    height: ${({ $layout }) => ($layout === "vertical" ? "70px" : "30px")};
    padding: 0 12px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    background: ${({ theme }) => theme.surface};
    color: ${({ theme }) => theme.text.primary};
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 180px;
    ${({ $fullWidth }) =>
        !$fullWidth &&
        css`
            max-width: 280px;
        `};
    text-align: left;
    ${({ $layout }) =>
        $layout &&
        css`
            padding: 7px;
        `};

    @media (max-width: 768px) {
        min-width: 140px;

        ${({ $fullWidth }) =>
            !$fullWidth &&
            css`
                max-width: 220px;
            `};
    }

    &:hover {
        background: ${({ theme }) => theme.primary + "10"};
        border-color: ${({ theme }) => theme.primary};
    }

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.primary};
    }

    ${({ $fullWidth }) =>
        $fullWidth &&
        css`
            width: 100%;
        `};

    ${({ $disabled }) =>
        $disabled &&
        css`
            cursor: not-allowed;
            opacity: 0.6;

            &:hover {
                background: ${({ theme }) => theme.surface};
                border-color: ${({ theme }) => theme.border};
            }
        `};
`;

const AccountInfo = styled.div<{ $layout?: "horizontal" | "vertical" }>`
    flex: 1;
    display: flex;
    gap: 10px;
    align-items: center;
    overflow: hidden;

    ${({ $layout }) =>
        $layout === "vertical" &&
        css`
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
        `}
`;

const AccountName = styled.span`
    font-weight: bold;
    color: ${({ theme }) => theme.text.primary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;

    @media (max-width: 768px) {
        max-width: 80px;
    }
`;

const AccountAddress = styled.span<{
    $adaptive?: boolean;
    $layout?: "horizontal" | "vertical";
}>`
    font-size: 12px;
    color: ${({ theme }) => theme.text.primary};

    ${({ $adaptive }) =>
        $adaptive &&
        css`
            @media (max-width: 1024px) {
                display: none;
            }
        `}

    ${({ $layout }) =>
        $layout === "vertical" &&
        css`
            width: 100%;
            word-break: break-all;
        `}
`;

const AccountBalance = styled.span<{
    $adaptive?: boolean;
    $layout?: "horizontal" | "vertical";
}>`
    font-size: 12px;
    color: ${({ theme }) => theme.primary};
    font-weight: 500;
    flex-shrink: 0;
    white-space: nowrap;

    ${({ $adaptive }) =>
        $adaptive &&
        css`
            @media (max-width: 1024px) {
                display: none;
            }
        `}

    ${({ $layout }) =>
        $layout === "vertical" &&
        css`
            width: 100%;
            white-space: normal;
        `}
`;

const LoadingSpinner = styled.div`
    width: 12px;
    height: 12px;
    border: 1px solid ${({ theme }) => theme.primary};
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;

const ChevronIcon = styled.span<{ $isOpen: boolean }>`
    font-size: 12px;
    transition: transform 0.2s ease;
    transform: rotate(${({ $isOpen }) => ($isOpen ? "180deg" : "0deg")});
`;

const Dropdown = styled.div<{
    $isOpen: boolean;
    $listDirection?: "top" | "bottom";
}>`
    position: absolute;
    ${({ $listDirection }) =>
        $listDirection === "top"
            ? css`
                  bottom: 100%;
                  top: auto;
                  margin-bottom: 4px;
              `
            : css`
                  top: 100%;
                  bottom: auto;
                  margin-top: 4px;
              `}
    left: 0;
    right: 0;
    background: ${({ theme }) => theme.card};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 8px;
    box-shadow: ${({ theme }) => theme.shadowLarge};
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
    display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
`;

const DropdownItem = styled.button<{
    $isSelected: boolean;
    $layout?: "horizontal" | "vertical";
}>`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: ${({ $isSelected, theme }) =>
        $isSelected ? theme.primary + "10" : "transparent"};
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.border};
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;

    ${({ $layout }) =>
        $layout === "vertical" &&
        css`
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
        `}

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        background: ${({ theme }) => theme.surface};
    }

    &:focus {
        outline: none;
        background: ${({ theme }) => theme.primary + "10"};
    }
`;

const EmptyState = styled.div`
    padding: 16px;
    text-align: center;
    color: ${({ theme }) => theme.text.secondary};
    font-size: 14px;
`;

const formatAddress = (address: string): string => {
    if (!address) return "";
    return `${address.substring(0, 8)}...${address.substring(
        address.length - 6,
    )}`;
};

interface IAccountSwitcherProps {
    accounts: AccountView[];
    selectedId?: string;
    onSelect: (accountId: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
    onOpen?: () => void;
    adaptive?: boolean;
    layout?: "horizontal" | "vertical";
    fullWidth?: boolean;
    listDirection?: "top" | "bottom";
    wrapperStyle?: CSSProperties;
}

export const AccountSwitcher: React.FC<IAccountSwitcherProps> = ({
    accounts,
    selectedId,
    onSelect,
    isLoading = false,
    disabled = false,
    onOpen,
    adaptive = true,
    layout = "horizontal",
    fullWidth = false,
    listDirection = "bottom",
    wrapperStyle,
}: IAccountSwitcherProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedAccount = accounts.find(
        (account) => account.id === selectedId,
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAccountSelect = (accountId: string) => {
        onSelect(accountId);
        setIsOpen(false);
    };

    const handleToggle = () => {
        if (disabled) return;

        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);

        if (newIsOpen) {
            onOpen?.();
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleToggle();
        } else if (event.key === "Escape") {
            setIsOpen(false);
        }
    };

    if (accounts.length === 0) {
        return null;
    }

    return (
        <SwitcherContainer
            style={wrapperStyle}
            $fullWidth={fullWidth}
            ref={containerRef}
        >
            <SwitcherButton
                $fullWidth={fullWidth}
                $disabled={disabled}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                $layout={layout}
                type="button"
            >
                <AccountInfo $layout={layout} className="account-info">
                    {selectedAccount ? (
                        <>
                            <AccountName
                                id="header-account-name"
                                title={selectedAccount.name}
                            >
                                {truncateText(selectedAccount.name, 20)}
                            </AccountName>
                            <AccountAddress $adaptive={adaptive}>
                                <div className="text-4">
                                    {formatAddress(selectedAccount.address)}
                                </div>
                            </AccountAddress>
                        </>
                    ) : (
                        <AccountName>Select Account</AccountName>
                    )}
                    {selectedAccount && (
                        <AccountBalance
                            $adaptive={adaptive}
                            id="header-account-balance"
                        >
                            <h5>
                                {isLoading ? (
                                    <LoadingSpinner />
                                ) : (
                                    formatBalanceCompact(
                                        selectedAccount.balance,
                                    )
                                )}
                            </h5>
                        </AccountBalance>
                    )}
                </AccountInfo>
                {!disabled && <ChevronIcon $isOpen={isOpen}>▼</ChevronIcon>}
            </SwitcherButton>

            <Dropdown $isOpen={isOpen} $listDirection={listDirection}>
                {accounts.length > 0 ? (
                    accounts.map((account) => (
                        <DropdownItem
                            key={account.id}
                            $isSelected={selectedId === account.id}
                            $layout={layout}
                            onClick={() => handleAccountSelect(account.id)}
                            type="button"
                        >
                            <AccountInfo
                                $layout={layout}
                                className="account-info"
                            >
                                <AccountName title={account.name}>
                                    {truncateText(
                                        account.name,
                                        layout === "vertical" ? 35 : 25,
                                    )}
                                </AccountName>
                                <AccountAddress
                                    $adaptive={adaptive}
                                    $layout={layout}
                                >
                                    {formatAddress(account.address)}
                                </AccountAddress>
                            </AccountInfo>
                            <AccountBalance
                                $adaptive={adaptive}
                                $layout={layout}
                            >
                                {isLoading ? (
                                    <LoadingSpinner />
                                ) : (
                                    formatBalanceCompact(account.balance)
                                )}
                            </AccountBalance>
                        </DropdownItem>
                    ))
                ) : (
                    <EmptyState>No accounts available</EmptyState>
                )}
            </Dropdown>
        </SwitcherContainer>
    );
};
