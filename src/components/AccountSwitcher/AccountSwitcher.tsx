import React, {
    useState,
    useRef,
    useEffect,
    useMemo,
    CSSProperties,
} from "react";
import styled, { css } from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "store";
import { selectAccount, fetchBalance } from "store/walletSlice";
import { truncateText } from "utils/textUtils";
import { formatBalanceCompact } from "utils/balanceUtils";

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
    max-width: 280px;
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

// Remove the old formatBalance function since we're using the utility now

interface IAccountSwitcherProps {
    adaptive?: boolean;
    layout?: "horizontal" | "vertical";
    fullWidth?: boolean;
    listDirection?: "top" | "bottom";
    wrapperStyle?: CSSProperties;
}

export const AccountSwitcher: React.FC<IAccountSwitcherProps> = ({
    adaptive = true,
    layout = "horizontal",
    fullWidth = false,
    listDirection = "bottom",
    wrapperStyle,
}: IAccountSwitcherProps) => {
    const dispatch = useDispatch();
    const { accounts, selectedAccount, selectedNetwork } = useSelector(
        (state: RootState) => state.wallet,
    );
    const [isOpen, setIsOpen] = useState(false);
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedNetworkId = selectedNetwork?.id;
    const filteredAccounts = useMemo(
        () =>
            selectedNetworkId
                ? accounts.filter(
                      (account) => account.networkId === selectedNetworkId,
                  )
                : accounts,
        [accounts, selectedNetworkId],
    );

    // Close dropdown when clicking outside
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
        dispatch(selectAccount(accountId));
        setIsOpen(false);
        fetchAllBalances(true); // Force refresh when selecting account
    };

    const fetchAllBalances = async (forceRefresh = false) => {
        if (
            !selectedNetwork ||
            !selectedNetwork.readOnlyUrl ||
            filteredAccounts.length === 0
        )
            return;

        setIsLoadingBalances(true);

        const balancePromises = filteredAccounts.map((account) =>
            dispatch(
                fetchBalance({
                    account,
                    network: selectedNetwork,
                    forceRefresh,
                }) as any,
            ),
        );

        try {
            await Promise.all(balancePromises);
        } catch (error) {
            console.error("Error fetching balances:", error);
        } finally {
            setIsLoadingBalances(false);
        }
    };

    const handleToggle = () => {
        const newIsOpen = !isOpen;

        if (newIsOpen && listDirection === "top") {
            // Проверяем, что дропдаун не выходит за пределы viewport
            setTimeout(() => {
                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const dropdownHeight = 300; // max-height из стилей
                    if (rect.top - dropdownHeight < 0) {
                        // Если не хватает места сверху, можно автоматически переключить на bottom
                        console.warn(
                            "Not enough space above, consider using bottom",
                        );
                    }
                }
            }, 0);
        }

        setIsOpen(newIsOpen);

        if (newIsOpen) {
            setTimeout(() => {
                fetchAllBalances(true);
            }, 100);
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
    // Don't render if no accounts
    if (filteredAccounts.length === 0) {
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
                id="header-account-switcher"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                $layout={layout}
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
                                    {formatAddress(selectedAccount.revAddress)}
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
                                {isLoadingBalances ? (
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
                <ChevronIcon $isOpen={isOpen}>▼</ChevronIcon>
            </SwitcherButton>

            <Dropdown $isOpen={isOpen} $listDirection={listDirection}>
                {filteredAccounts.length > 0 ? (
                    filteredAccounts.map((account) => (
                        <DropdownItem
                            key={account.id}
                            $isSelected={selectedAccount?.id === account.id}
                            $layout={layout}
                            onClick={() => handleAccountSelect(account.id)}
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
                                    {formatAddress(account.revAddress)}
                                </AccountAddress>
                            </AccountInfo>
                            <AccountBalance
                                $adaptive={adaptive}
                                $layout={layout}
                            >
                                {isLoadingBalances ? (
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
