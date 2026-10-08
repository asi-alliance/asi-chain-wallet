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
import { FilterLabel } from "styles/sharedStyledComponents";
import { HistoryFilter } from "./components/HistoryFilter";
import { MobileTransactionRow } from "./components/MobileTransactionRow";
import { TransactionDetailsModal } from "./components/TransactionDetailsModal";
import { TransactionRow } from "./components/TransactionRow";
import {
    filterTransactions,
    getNextDatePresetBoundary,
    hasActiveFilters,
    HISTORY_FILTER_KEYS,
    HISTORY_FILTER_LABELS,
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

const MobileFilterSection = styled.section`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.md};
    margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const MobileFilterGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: ${({ theme }) => theme.spacing.md};
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

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        width: max-content;
        min-width: 100%;
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

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        font-size: ${({ theme }) => theme.typography.size.xs};
        line-height: ${({ theme }) => theme.typography.lineHeight.xs};
        white-space: nowrap;
    }
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

const DESKTOP_COLUMN_WIDTHS: Record<TPanelFilterKey, string> = {
    date: "11%",
    type: "8%",
    status: "10%",
    from: "18%",
    to: "18%",
    amount: "20%",
    details: "15%",
};

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
                        <MobileFilterSection aria-labelledby="history-mobile-filters-label">
                            <FilterLabel id="history-mobile-filters-label">
                                Filter
                            </FilterLabel>
                            <MobileFilterGrid>
                                {HISTORY_FILTER_KEYS.map((filterKey) => (
                                    <HistoryFilter
                                        key={filterKey}
                                        filterKey={filterKey}
                                        filters={filters}
                                    />
                                ))}
                            </MobileFilterGrid>
                        </MobileFilterSection>
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
                                        {HISTORY_FILTER_KEYS.map((filterKey) => (
                                            <TableHeaderCell
                                                key={filterKey}
                                                scope="col"
                                                style={
                                                    isMobile
                                                        ? undefined
                                                        : {
                                                              width: DESKTOP_COLUMN_WIDTHS[
                                                                  filterKey
                                                              ],
                                                          }
                                                }
                                            >
                                                {isMobile ? (
                                                    HISTORY_FILTER_LABELS[filterKey]
                                                ) : (
                                                    <HistoryFilter
                                                        filterKey={filterKey}
                                                        filters={filters}
                                                    />
                                                )}
                                            </TableHeaderCell>
                                        ))}
                                        {isMobile && (
                                            <TableHeaderCell scope="col">
                                                <VisuallyHidden>Actions</VisuallyHidden>
                                            </TableHeaderCell>
                                        )}
                                    </tr>
                                </TableHeader>
                                <TableBody>
                                    {visibleTransactions.map((transaction) =>
                                        isMobile ? (
                                            <MobileTransactionRow
                                                key={transaction.id}
                                                transaction={transaction}
                                                onViewDetails={setSelectedTransactionId}
                                            />
                                        ) : (
                                            <TransactionRow
                                                key={transaction.id}
                                                transaction={transaction}
                                            />
                                        ),
                                    )}
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
