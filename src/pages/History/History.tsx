import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import styled, { css } from "styled-components";
import { RootState } from "store";
import { Card, CardHeader, CardTitle, CardContent, Button } from "components";
import TransactionHistoryService, {
    Transaction,
    TransactionFilter,
} from "services/transactionHistory";
import { RChainService } from "services/rchain";
import { ContentPasteIcon, DownloadIcon } from "components/Icons";
import { AdaptiveSelect } from "components/Select";
import { Search } from "components/Search";
import { AccountSelector } from "components/AccountSelector";
import { getTokenDisplayName } from "constants/token";
import { DefaultTheme } from "styled-components/dist/types";

const HistoryContainer = styled.div`
    max-width: 1200px;
    margin: 0 auto;
`;

const FilterSection = styled.div`
    display: flex;
    gap: 16px;
    margin-bottom: 53px;
    flex-wrap: wrap;
    align-items: flex-end;

    @media (max-width: 1023px) {
        flex-direction: column;
        gap: 16px;
        margin-bottom: 16px;
    }

    @media (max-width: 768px) {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
`;

const FilterGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;

    @media (min-width: 1024px) {
        width: auto;

        &:nth-child(1) {
            flex: 0 0 20%;
            max-width: 20%;
        }

        &:nth-child(2) {
            flex: 0 0 15%;
            max-width: 15%;
        }

        &:nth-child(3),
        &:nth-child(4) {
            flex: 0 0 18%;
            max-width: 18%;
        }

        &:nth-child(5) {
            flex: 1;
        }
    }

    @media (max-width: 1023px) {
        width: 100%;
        flex: none;
        max-width: 100%;
    }
`;

const FilterLabel = styled.label`
    // font-size: 14px;
    font-weight: 500;
    color: ${({ theme }) => theme.text.secondary};
`;

const FilterSearch = styled(Search)`
    padding: 8px 12px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    background: ${({ theme }) => theme.surface};
    color: ${({ theme }) => theme.text.primary};
    font-size: 14px;
    min-width: auto;
`;

const TransactionTable = styled.div`
    overflow-x: auto;
    margin-bottom: 36px;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;

    @media (max-width: 1023px) {
        table-layout: auto;
    }
`;

const TableHeader = styled.thead`
    background: ${({ theme }) => theme.surface};
    border-bottom: 2px solid ${({ theme }) => theme.border};
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
    border-bottom: 1px solid ${({ theme }) => theme.border};

    &:hover {
        background: ${({ theme }) => theme.surface};
    }
`;

const TableCell = styled.td<{
    $align?: string;
    $themeColorSelector?: (theme: DefaultTheme) => string;
}>`
    padding: 6px;
    text-align: ${({ $align }) => $align || "left"};
    font-size: 14px;
    ${({ $themeColorSelector, theme }) =>
        $themeColorSelector &&
        css`
            color: ${$themeColorSelector(theme)};
        `}
`;

const TableHeaderCell = styled.th<{ $align?: string; $width?: string }>`
    padding: 12px 12px 12px 6px;
    text-align: ${({ $align }) => $align || "left"};
    font-weight: 500;
    font-size: 14px;
    color: ${({ theme }) => theme.text.secondary};
    width: ${({ $width }) => $width || "auto"};
`;

const StatusBadge = styled.span<{
    $status: "pending" | "confirmed" | "failed";
}>`
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    background: ${({ $status, theme }) =>
        $status === "confirmed"
            ? theme.success + "20"
            : $status === "failed"
              ? theme.danger + "20"
              : theme.warning + "20"};
    color: ${({ $status, theme }) =>
        $status === "confirmed"
            ? theme.success
            : $status === "failed"
              ? theme.danger
              : theme.warning};
`;

const TypeBadge = styled.span<{ $type: "send" | "receive" | "deploy" }>`
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    background: ${({ $type, theme }) =>
        $type === "send"
            ? theme.primary + "20"
            : $type === "receive"
              ? theme.success + "20"
              : theme.secondary + "20"};
    color: ${({ $type, theme }) =>
        $type === "send"
            ? theme.primary
            : $type === "receive"
              ? theme.success
              : theme.secondary};
`;

const AddressLink = styled.a`
    color: ${({ theme }) => theme.primary};
    text-decoration: none;
    font-size: 12px;

    &:hover {
        text-decoration: underline;
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 48px 24px;
    color: ${({ theme }) => theme.text.secondary};
`;

const RefreshText = styled.div`
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: 4px;
    color: ${({ theme }) => theme.textSecondaryAdditional};
    line-height: 1.4;
`;

const RefreshTextLine = styled.span`
    font-size: 12px;
    white-space: nowrap;

    @media (max-width: 768px) {
        font-size: 0.5rem;
    }
`;

const ExportButtonsWrapper = styled.div`
    width: 100%;
    justify-content: end;
    display: flex;
    gap: 24px;

    @media (max-width: 1023px) {
        justify-content: center;
    }
`;

const ExportButton = styled(Button)`
    padding: 10px 24px;
`;

const formatAddress = (address: string): string => {
    if (!address) return "";
    return `${address.substring(0, 10)}...${address.substring(
        address.length - 8,
    )}`;
};

const formatAmount = (amount?: string): string => {
    if (!amount) return "-";
    try {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum)) return `${amount} ${getTokenDisplayName()}`;

        return `${amountNum.toFixed(8)} ${getTokenDisplayName()}`;
    } catch (error) {
        return `${amount} ${getTokenDisplayName()}`;
    }
};

const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
};

const typeOptions = [
    { id: "all", value: "all", label: "All Types" },
    { id: "send", value: "send", label: "Send" },
    { id: "receive", value: "receive", label: "Receive" },
    { id: "deploy", value: "deploy", label: "Deploy" },
];
const statusOptions = [
    { id: "all", value: "all", label: "All Status" },
    { id: "pending", value: "pending", label: "Pending" },
    { id: "confirmed", value: "confirmed", label: "Confirmed" },
    { id: "failed", value: "failed", label: "Failed" },
];
const weekOptions = [{ id: "1-week", value: "1 Week", label: "1 Week" }];

export const History: React.FC = () => {
    const { selectedAccount, selectedNetwork } = useSelector(
        (state: RootState) => state.wallet,
    );
    const { unlockedAccounts } = useSelector((state: RootState) => state.auth);
    const isAccountUnlocked = React.useMemo(() => {
        if (!selectedAccount) return false;
        return unlockedAccounts.some(
            (account) => account.id === selectedAccount.id,
        );
    }, [unlockedAccounts, selectedAccount]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filter, setFilter] = useState<TransactionFilter>({});
    const [_stats, setStats] = useState<any>({});
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const handleCopy = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {}
    }, []);

    const checkPendingTransactionStatuses = useCallback(async () => {
        if (!selectedAccount || !selectedNetwork || !isAccountUnlocked) return;

        if (!selectedNetwork.graphqlUrl || !selectedNetwork.graphqlUrl.trim()) {
            return;
        }

        const _rchain = new RChainService(
            selectedNetwork.url.trim(),
            selectedNetwork.readOnlyUrl,
            selectedNetwork.adminUrl,
            selectedNetwork.shardId,
            selectedNetwork.graphqlUrl,
        );

        // Optional: lightweight pending status check disabled to avoid heavy polling
        // const pendingTxs = await TransactionHistoryService.getTransactions(
        //     selectedAccount.revAddress,
        //     selectedAccount.publicKey,
        //     selectedNetwork.name,
        //     selectedNetwork.graphqlUrl,
        //     25
        // ).then((txs) => txs.filter((tx) => tx.status === "pending"));
        // for (const tx of pendingTxs) {
        //     if (!tx.deployId) continue;
        //     try {
        //         await rchain.waitForDeployResult(tx.deployId, 1);
        //     } catch (error) {
        //         console.error(
        //             `Error checking deploy status for ${tx.deployId}:`,
        //             error
        //         );
        //     }
        // }
    }, [selectedAccount, selectedNetwork, isAccountUnlocked]);

    const loadTransactions = useCallback(async () => {
        if (!selectedAccount || !selectedNetwork) {
            setTransactions([]);
            setStats({
                total: 0,
                sent: 0,
                received: 0,
                deployed: 0,
                pending: 0,
                confirmed: 0,
                failed: 0,
            });
            return;
        }

        try {
            if (!selectedAccount.revAddress || !selectedAccount.publicKey) {
                setTransactions([]);
                return;
            }

            const txs = await TransactionHistoryService.getTransactions(
                selectedAccount.revAddress,
                selectedAccount.publicKey,
                selectedNetwork.name,
                selectedNetwork.graphqlUrl || "",
                100,
            );

            let filteredTxs = txs;
            if (filter.type) {
                filteredTxs = filteredTxs.filter(
                    (tx) => tx.type === filter.type,
                );
            }
            if (filter.status) {
                filteredTxs = filteredTxs.filter(
                    (tx) => tx.status === filter.status,
                );
            }
            if (filter.network) {
                filteredTxs = filteredTxs.filter(
                    (tx) => tx.network === filter.network,
                );
            }
            if (filter.startDate) {
                const startDate = new Date(filter.startDate);
                startDate.setHours(0, 0, 0, 0);
                filteredTxs = filteredTxs.filter(
                    (tx) => new Date(tx.timestamp) >= startDate,
                );
            }
            if (filter.endDate) {
                const endDate = new Date(filter.endDate);
                endDate.setHours(23, 59, 59, 999);
                filteredTxs = filteredTxs.filter(
                    (tx) => new Date(tx.timestamp) <= endDate,
                );
            }

            setTransactions(filteredTxs);

            const statistics = {
                total: filteredTxs.length,
                sent: filteredTxs.filter((tx) => tx.type === "send").length,
                received: filteredTxs.filter((tx) => tx.type === "receive")
                    .length,
                deployed: filteredTxs.filter((tx) => tx.type === "deploy")
                    .length,
                pending: filteredTxs.filter((tx) => tx.status === "pending")
                    .length,
                confirmed: filteredTxs.filter((tx) => tx.status === "confirmed")
                    .length,
                failed: filteredTxs.filter((tx) => tx.status === "failed")
                    .length,
            };
            setStats(statistics);
        } catch (error) {
            setTransactions([]);
            setStats({
                total: 0,
                sent: 0,
                received: 0,
                deployed: 0,
                pending: 0,
                confirmed: 0,
                failed: 0,
            });
        }
    }, [selectedAccount, selectedNetwork, filter]);

    useEffect(() => {
        loadTransactions();

        checkPendingTransactionStatuses().then(() => {
            loadTransactions();
        });
    }, [
        loadTransactions,
        checkPendingTransactionStatuses,
        selectedAccount,
        selectedNetwork,
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            loadTransactions();
            setLastRefresh(new Date());
        }, 30000);

        return () => clearInterval(interval);
    }, [loadTransactions]);

    const handleExportJSON = async () => {
        if (!selectedAccount || !selectedNetwork) return;

        try {
            await TransactionHistoryService.downloadTransactions(
                "json",
                selectedAccount.revAddress,
                selectedAccount.publicKey,
                selectedNetwork.name,
                selectedNetwork.graphqlUrl || "",
            );
        } catch (error) {}
    };

    const handleExportCSV = async () => {
        if (!selectedAccount || !selectedNetwork) return;

        try {
            await TransactionHistoryService.downloadTransactions(
                "csv",
                selectedAccount.revAddress,
                selectedAccount.publicKey,
                selectedNetwork.name,
                selectedNetwork.graphqlUrl || "",
            );
        } catch (error) {}
    };

    const handleFilterChange = (key: keyof TransactionFilter, value: any) => {
        setFilter((prev) => ({
            ...prev,
            [key]: value === "all" || value === "" ? undefined : value,
        }));
    };

    const handleClearFilters = () => {
        setFilter({});
    };

    const hasActiveFilters = () => {
        return !!(
            filter.type ||
            filter.status ||
            filter.network ||
            filter.startDate ||
            filter.endDate
        );
    };

    return (
        <HistoryContainer>
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <RefreshText>
                        <RefreshTextLine>
                            Auto-refresh: every 30s
                        </RefreshTextLine>
                        <RefreshTextLine>
                            Last: {lastRefresh.toLocaleTimeString()}
                        </RefreshTextLine>
                    </RefreshText>
                </CardHeader>
                <CardContent>
                    <FilterSection>
                        <AccountSelector />

                        <FilterGroup>
                            <FilterLabel>
                                <h4 className="light">Search</h4>
                            </FilterLabel>
                            <FilterSearch
                                className="text-2"
                                placeholder="Search"
                                disabled
                                wrapperStyle={{ marginBottom: "0" }}
                            />
                        </FilterGroup>

                        <FilterGroup>
                            <FilterLabel>
                                <h4 className="light">Type</h4>
                            </FilterLabel>
                            <AdaptiveSelect
                                id="history-filter-type-select"
                                value={filter.type || "all"}
                                onChange={(value) =>
                                    handleFilterChange("type", value)
                                }
                                options={typeOptions}
                            />
                        </FilterGroup>

                        <FilterGroup>
                            <FilterLabel>
                                <h4 className="light">Status</h4>
                            </FilterLabel>
                            <AdaptiveSelect
                                id="history-filter-status-select"
                                value={filter.status || "all"}
                                onChange={(value) =>
                                    handleFilterChange("status", value)
                                }
                                options={statusOptions}
                            />
                        </FilterGroup>

                        <FilterGroup>
                            <FilterLabel>
                                <h4 className="light">Period</h4>
                            </FilterLabel>
                            <AdaptiveSelect
                                id="history-filter-week-select"
                                value="1 Week"
                                onChange={() => {}}
                                disabled
                                placeholder="1 Week"
                                options={weekOptions}
                            />
                        </FilterGroup>

                        {hasActiveFilters() && (
                            <FilterGroup>
                                <FilterLabel>
                                    <h4 className="light">&nbsp;</h4>
                                </FilterLabel>
                                <Button
                                    id="history-clear-filters-button"
                                    size="small"
                                    variant="ghost"
                                    onClick={handleClearFilters}
                                >
                                    Clear Filters
                                </Button>
                            </FilterGroup>
                        )}
                    </FilterSection>
                    {transactions.length > 0 ? (
                        <div className="transactions-table-wrapper">
                            <TransactionTable>
                                <Table>
                                    <TableHeader>
                                        <tr>
                                            <TableHeaderCell
                                                style={{ width: "10%" }}
                                            >
                                                Date
                                            </TableHeaderCell>
                                            <TableHeaderCell
                                                style={{ width: "10%" }}
                                            >
                                                Type
                                            </TableHeaderCell>
                                            <TableHeaderCell
                                                style={{ width: "12%" }}
                                            >
                                                Status
                                            </TableHeaderCell>
                                            <TableHeaderCell
                                                style={{ width: "17%" }}
                                            >
                                                From
                                            </TableHeaderCell>
                                            <TableHeaderCell
                                                style={{ width: "17%" }}
                                            >
                                                To
                                            </TableHeaderCell>
                                            <TableHeaderCell
                                                style={{ width: "17%" }}
                                            >
                                                Amount
                                            </TableHeaderCell>
                                            <TableHeaderCell
                                                style={{ width: "17%" }}
                                            >
                                                Details
                                            </TableHeaderCell>
                                        </tr>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((tx: Transaction) => (
                                            <TableRow
                                                key={tx.id}
                                                id={`history-transaction-row-${tx.id}`}
                                            >
                                                <TableCell
                                                    $themeColorSelector={(
                                                        theme: DefaultTheme,
                                                    ) => theme.text.secondary}
                                                >
                                                    {formatDate(tx.timestamp)}
                                                </TableCell>
                                                <TableCell>
                                                    <TypeBadge $type={tx.type}>
                                                        {tx.type}
                                                    </TypeBadge>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        $status={tx.status}
                                                    >
                                                        {tx.status}
                                                    </StatusBadge>
                                                </TableCell>
                                                <TableCell>
                                                    {tx.from === "Unknown" ? (
                                                        <span
                                                            style={{
                                                                color: "inherit",
                                                                opacity: 0.5,
                                                            }}
                                                        >
                                                            Unknown
                                                        </span>
                                                    ) : (
                                                        <AddressLink
                                                            href="#"
                                                            onClick={(e) =>
                                                                e.preventDefault()
                                                            }
                                                        >
                                                            {formatAddress(
                                                                tx.from,
                                                            )}
                                                        </AddressLink>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {tx.to ? (
                                                        <AddressLink
                                                            href="#"
                                                            onClick={(e) =>
                                                                e.preventDefault()
                                                            }
                                                        >
                                                            {formatAddress(
                                                                tx.to,
                                                            )}
                                                        </AddressLink>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatAmount(tx.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    {tx.note && (
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                marginBottom:
                                                                    "4px",
                                                            }}
                                                        >
                                                            {tx.note}
                                                        </div>
                                                    )}
                                                    {tx.deployId && (
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "11px",
                                                                fontFamily:
                                                                    "monospace",
                                                                display:
                                                                    "inline-flex",
                                                                alignItems:
                                                                    "center",
                                                            }}
                                                        >
                                                            {tx.deployId.substring(
                                                                0,
                                                                16,
                                                            )}
                                                            …
                                                            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                                                            <a
                                                                title="Copy Deploy ID"
                                                                id={`copy-deployid-${tx.id}`}
                                                                href="#"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    handleCopy(
                                                                        tx.deployId as string,
                                                                    );
                                                                }}
                                                                style={{
                                                                    marginLeft: 8,
                                                                    height: 16,
                                                                }}
                                                            >
                                                                <ContentPasteIcon />
                                                            </a>
                                                        </div>
                                                    )}
                                                    {tx.blockHash && (
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "11px",
                                                                fontFamily:
                                                                    "monospace",
                                                            }}
                                                        >
                                                            Block:{" "}
                                                            {tx.blockHash.substring(
                                                                0,
                                                                16,
                                                            )}
                                                            ...
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TransactionTable>
                            <ExportButtonsWrapper>
                                <ExportButton
                                    variant="secondary"
                                    onClick={handleExportCSV}
                                >
                                    <h3>Export CSV</h3>
                                    <DownloadIcon size={24} />
                                </ExportButton>
                                <ExportButton
                                    variant="secondary"
                                    onClick={handleExportJSON}
                                >
                                    <h3>Export JSON</h3>
                                    <DownloadIcon size={24} />
                                </ExportButton>
                            </ExportButtonsWrapper>
                        </div>
                    ) : (
                        <EmptyState>
                            {selectedAccount ? (
                                <>
                                    <p>
                                        No transactions found for{" "}
                                        {selectedAccount.name}.
                                    </p>
                                    <p>
                                        Your transaction history will appear
                                        here once you send, receive, or deploy
                                        contracts.
                                    </p>
                                </>
                            ) : (
                                <p>
                                    Please select an account to view transaction
                                    history.
                                </p>
                            )}
                        </EmptyState>
                    )}
                </CardContent>
            </Card>
        </HistoryContainer>
    );
};
