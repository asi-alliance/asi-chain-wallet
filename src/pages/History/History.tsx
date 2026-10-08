import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import styled, { useTheme } from "styled-components";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { RootState } from "store";
import {
    selectIsAccountUnlocked,
    selectSelectedAccount,
    selectSelectedNetworkId,
} from "store/WalletsStore/";
import {
    IHistoryQueryArgs,
    useGetTransactionHistoryQuery,
} from "store/WalletsStore/api";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    VisuallyHidden,
} from "components";
import { Transaction } from "types/transactions";
import { DownloadIcon } from "components/Icons";
import { AccountSelector } from "components/AccountSelector";
import {
    ACCOUNT_DATA_POLLING_INTERVAL_MS,
    ACCOUNT_DATA_POLLING_INTERVAL_SECONDS,
} from "constants/polling";
import { useHistoryFilters, useMediaQuery, useScreen } from "hooks";
import { HistoryFilter } from "./components/HistoryFilter";
import { TransactionDetailsModal } from "./components/TransactionDetailsModal";
import { TransactionRow } from "./components/TransactionRow";
import {
    filterTransactions,
    getNextDatePresetBoundary,
    hasActiveFilters,
    TPanelFilterKey,
} from "utils/historyFilters";

const HistoryContainer = styled.div`
    max-width: ${({ theme }) => theme.layout.contentWide};
    margin: 0 auto;
`;

const AccountBar = styled.div`
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.xl};
    margin-bottom: ${({ theme }) => theme.spacing["3xl"]};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column;
        align-items: stretch;
        gap: ${({ theme }) => theme.spacing.lg};
    }
`;

const AccountBarActions = styled.div`
    display: flex;
    align-items: flex-end;
    padding-bottom: 1px;
`;

const MobileFilterBar = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.lg};
    margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const TransactionTable = styled.div`
    overflow-x: auto;
    margin-bottom: ${({ theme }) => theme.spacing["3xl"]};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: ${({ theme }) => theme.radii.md};

    @media (min-width: 1025px) {
        overflow-x: hidden;
    }
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;

    @media (max-width: ${({ theme }) => theme.breakpoints.laptop}) {
        table-layout: auto;
    }
`;

const TableHeader = styled.thead`
    border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const TableBody = styled.tbody``;

const TableHeaderCell = styled.th`
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.text.secondary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    text-align: left;
    vertical-align: bottom;
`;

const EmptyState = styled.div`
    padding: ${({ theme }) => theme.spacing["6xl"]} ${({ theme }) => theme.spacing["3xl"]};
    color: ${({ theme }) => theme.text.secondary};
    text-align: center;
`;

const ErrorMessage = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing.xl};
    padding: ${({ theme }) => theme.spacing.lg};
    border: 1px solid ${({ theme }) => `${theme.danger}40`};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => `${theme.danger}1F`};
    color: ${({ theme }) => theme.dangerText};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;

const RefreshText = styled.div`
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: ${({ theme }) => theme.spacing.xs};
    color: ${({ theme }) => theme.textSecondaryAdditional};
    line-height: 1.4;
`;

const RefreshTextLine = styled.span`
    font-size: ${({ theme }) => theme.typography.size.xs};
    white-space: nowrap;
`;

const RefreshSpinner = styled.span`
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-right: ${({ theme }) => theme.spacing.sm};
    vertical-align: middle;
    border: 1px solid ${({ theme }) => theme.primary};
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

const ExportButtonsWrapper = styled.div`
    display: flex;
`;

const ExportButton = styled(Button)`
    padding: 10px 24px;
    width: 100%;
`;

const EMPTY_TRANSACTIONS: Transaction[] = [];

const HISTORY_UNAVAILABLE_ERROR =
    "Failed to load transaction history for the selected network.";

const HISTORY_REFRESH_ERROR =
    "Could not refresh. Showing the last loaded transactions.";

export const History: React.FC = () => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const networkId = useSelector(selectSelectedNetworkId);
    const isAccountUnlocked = useSelector((state: RootState) =>
        selectedAccount
            ? selectIsAccountUnlocked(state, selectedAccount.id)
            : false,
    );
    const theme = useTheme();
    const { isTablet } = useScreen();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.mobile})`);

    const filters = useHistoryFilters();
    const { appliedFilters } = filters;
    const [dateTick, setDateTick] = useState(0);
    const [selectedTransactionId, setSelectedTransactionId] = useState<
        string | null
    >(null);

    const historyArgs: IHistoryQueryArgs | typeof skipToken =
        selectedAccount && isAccountUnlocked
            ? {
                  accountId: selectedAccount.id,
                  networkId,
                  // Status is filtered on the transaction model, so every source stays loaded.
                  source: "all",
              }
            : skipToken;

    const {
        currentData: transactions = EMPTY_TRANSACTIONS,
        isFetching,
        isError,
        fulfilledTimeStamp,
    } = useGetTransactionHistoryQuery(historyArgs, {
        pollingInterval: ACCOUNT_DATA_POLLING_INTERVAL_MS,
    });

    const hasLoadedTransactions = transactions !== EMPTY_TRANSACTIONS;

    useEffect(() => {
        const now = Date.now();
        const nextBoundary = getNextDatePresetBoundary(
            transactions,
            appliedFilters.date.preset,
            now,
        );

        if (nextBoundary === null) return;

        const timer = window.setTimeout(
            () => setDateTick((current) => current + 1),
            Math.max(1, Math.min(nextBoundary - now, 2_147_483_647)),
        );
        return () => window.clearTimeout(timer);
    }, [appliedFilters.date.preset, transactions, dateTick]);

    const visibleTransactions = useMemo<Transaction[]>(
        () => filterTransactions(transactions, appliedFilters, Date.now()),
        [transactions, appliedFilters, dateTick],
    );

    const hasVisibleTransactions = visibleTransactions.length > 0;
    const hasLoadError = isError && !hasLoadedTransactions;
    const hasRefreshError = isError && hasLoadedTransactions;
    // Keep column filters mounted while any history is loaded so an empty
    // filtered result does not remove the controls needed to clear it.
    const showTransactionTable =
        hasLoadedTransactions && transactions.length > 0;
    const selectedTransaction =
        visibleTransactions.find(
            (transaction) => transaction.id === selectedTransactionId,
        ) ?? null;

    const renderPlainHeader = (label: string): React.ReactElement => (
        <span>{label}</span>
    );

    const renderFilter = (filterKey: TPanelFilterKey): React.ReactElement => (
        <HistoryFilter filterKey={filterKey} filters={filters} />
    );

    return (
        <HistoryContainer>
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <RefreshText>
                        <RefreshTextLine>
                            Auto-refresh: every{" "}
                            {ACCOUNT_DATA_POLLING_INTERVAL_SECONDS}s
                        </RefreshTextLine>
                        <RefreshTextLine>
                            {isFetching && <RefreshSpinner aria-hidden="true" />}
                            Last:{" "}
                            {fulfilledTimeStamp
                                ? new Date(
                                      fulfilledTimeStamp,
                                  ).toLocaleTimeString()
                                : "—"}
                        </RefreshTextLine>
                    </RefreshText>
                </CardHeader>
                <CardContent>
                    <AccountBar>
                        <AccountSelector fullWidth={isTablet || isMobile} />
                        <AccountBarActions>
                            <Button
                                id="history-clear-filters-button"
                                type="button"
                                size="small"
                                variant="secondary"
                                disabled={!hasActiveFilters(appliedFilters)}
                                onClick={filters.clearAllFilters}
                            >
                                Clear Filter
                            </Button>
                        </AccountBarActions>
                    </AccountBar>

                    {isMobile && showTransactionTable && (
                        <MobileFilterBar aria-label="Transaction filters">
                            {renderFilter("date")}
                            {renderFilter("type")}
                            {renderFilter("status")}
                            {renderFilter("from")}
                            {renderFilter("to")}
                            {renderFilter("amount")}
                            {renderFilter("details")}
                        </MobileFilterBar>
                    )}

                    {hasLoadError && (
                        <ErrorMessage id="history-load-error" role="alert">
                            {HISTORY_UNAVAILABLE_ERROR}
                        </ErrorMessage>
                    )}

                    {hasRefreshError && (
                        <ErrorMessage id="history-refresh-error" role="alert">
                            {HISTORY_REFRESH_ERROR}
                        </ErrorMessage>
                    )}

                    {showTransactionTable && (
                        <TransactionTable data-testid="history-transaction-table">
                            <Table>
                                <VisuallyHidden as="caption">
                                    Transactions
                                </VisuallyHidden>
                                <TableHeader>
                                    <tr>
                                        <TableHeaderCell
                                            scope="col"
                                            style={{
                                                width: isMobile ? "34%" : "11%",
                                            }}
                                        >
                                            {isMobile
                                                ? renderPlainHeader("Date")
                                                : renderFilter("date")}
                                        </TableHeaderCell>
                                        <TableHeaderCell
                                            scope="col"
                                            style={{
                                                width: isMobile ? "22%" : "8%",
                                            }}
                                        >
                                            {isMobile
                                                ? renderPlainHeader("Type")
                                                : renderFilter("type")}
                                        </TableHeaderCell>
                                        <TableHeaderCell
                                            scope="col"
                                            style={{
                                                width: isMobile ? "22%" : "10%",
                                            }}
                                        >
                                            {isMobile
                                                ? renderPlainHeader("Status")
                                                : renderFilter("status")}
                                        </TableHeaderCell>
                                        {isMobile ? (
                                            <TableHeaderCell
                                                scope="col"
                                                style={{ width: "22%" }}
                                            >
                                                {renderPlainHeader("Details")}
                                            </TableHeaderCell>
                                        ) : (
                                            <>
                                                <TableHeaderCell
                                                    scope="col"
                                                    style={{ width: "18%" }}
                                                >
                                                    {renderFilter("from")}
                                                </TableHeaderCell>
                                                <TableHeaderCell
                                                    scope="col"
                                                    style={{ width: "18%" }}
                                                >
                                                    {renderFilter("to")}
                                                </TableHeaderCell>
                                                <TableHeaderCell
                                                    scope="col"
                                                    style={{ width: "20%" }}
                                                >
                                                    {renderFilter("amount")}
                                                </TableHeaderCell>
                                                <TableHeaderCell
                                                    scope="col"
                                                    style={{ width: "15%" }}
                                                >
                                                    {renderFilter("details")}
                                                </TableHeaderCell>
                                            </>
                                        )}
                                    </tr>
                                </TableHeader>
                                <TableBody>
                                    {visibleTransactions.map((transaction) => (
                                        <TransactionRow
                                            key={transaction.id}
                                            transaction={transaction}
                                            isMobile={isMobile}
                                            onViewDetails={setSelectedTransactionId}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </TransactionTable>
                    )}

                    {hasVisibleTransactions && (
                        // TODO: Restore transaction export once the SDK exposes a history download flow
                        <ExportButtonsWrapper>
                            <ExportButton
                                id="history-export-button"
                                variant="secondary"
                                disabled
                            >
                                <h3>Export</h3>
                                <DownloadIcon size={24} />
                            </ExportButton>
                        </ExportButtonsWrapper>
                    )}

                    {!hasVisibleTransactions && !hasLoadError && (
                        <EmptyState>
                            {!selectedAccount && (
                                <p>
                                    Please select an account to view transaction
                                    history.
                                </p>
                            )}
                            {selectedAccount &&
                                !hasLoadedTransactions &&
                                isFetching && (
                                    <p role="status">
                                        Loading transaction history for{" "}
                                        {selectedAccount.name}…
                                    </p>
                                )}
                            {selectedAccount &&
                                (hasLoadedTransactions || !isFetching) &&
                                transactions.length === 0 && (
                                    <>
                                        <p>
                                            No transactions found for{" "}
                                            {selectedAccount.name}.
                                        </p>
                                        <p>
                                            Your transaction history will appear
                                            here once you send, receive, or
                                            deploy contracts.
                                        </p>
                                    </>
                                )}
                            {selectedAccount && transactions.length > 0 && (
                                <p>
                                    No transactions match the selected filters.
                                </p>
                            )}
                        </EmptyState>
                    )}
                </CardContent>
            </Card>

            <TransactionDetailsModal
                transaction={selectedTransaction}
                onClose={() => setSelectedTransactionId(null)}
            />
        </HistoryContainer>
    );
};
