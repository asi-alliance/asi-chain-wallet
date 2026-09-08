import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef,
    Fragment,
} from "react";
import styled from "styled-components";
import {
    selectHasWallets,
    selectWalletByFilter,
    selectWallets,
} from "store/WalletsStore";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { loginWithPassword } from "store/Auth/thunks";
import { RootState, AppDispatch } from "store";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    PasswordInput,
} from "components";
import {
    buildContextKey,
    getRateLimitInfo,
    formatLockoutMessage,
    RateLimitInfo,
} from "services/loginRateLimit";
import {
    analyzeRecentActivity,
    SuspiciousActivityReport,
} from "services/loginAuditLog";
import { Select } from "components/Select";
import { ISelectOption } from "components/Select/Select";
import { WalletTypes } from "@asichain/asi-wallet-sdk";
import { IWalletMeta, WalletActions } from "types/wallet";
import { CreateHdWalletModal } from "components/CreateHdWalletModal";
import { ImportHdWalletModal } from "components/ImportHdWalletModal";
import { ImportPkWalletModal } from "components/ImportPkWalletModal";
import { useScreen } from "hooks/";

const LoginContainer = styled.div`
    max-width: 705px;
    margin: 100px auto;
`;

const FormGroup = styled.div`
    margin-bottom: 24px;
`;

const ErrorMessage = styled.div`
    background: ${({ theme }) => theme.danger};
    color: white;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
`;

const WarningBanner = styled.div`
    background: ${({ theme }) => `${theme.warning}18`};
    border: 1px solid ${({ theme }) => `${theme.warning}40`};
    color: ${({ theme }) => theme.warning};
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    line-height: 1.4;
`;

const LockoutBanner = styled.div`
    background: ${({ theme }) => `${theme.danger}18`};
    border: 1px solid ${({ theme }) => `${theme.danger}40`};
    color: ${({ theme }) => theme.danger};
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    line-height: 1.4;
    text-align: center;
`;

const CountdownText = styled.span`
    font-variant-numeric: tabular-nums;
    font-weight: 600;
`;

const SecurityWarningBanner = styled.div`
    background: ${({ theme }) => `${theme.info}12`};
    border: 1px solid ${({ theme }) => `${theme.info}40`};
    color: ${({ theme }) => theme.text.primary};
    padding: 14px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 13px;
    line-height: 1.5;
`;

const SecurityWarningTitle = styled.div`
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 6px;
    color: ${({ theme }) => theme.info};
`;

const DismissLink = styled.button`
    background: none;
    border: none;
    color: ${({ theme }) => theme.text.secondary};
    font-size: 12px;
    cursor: pointer;
    padding: 0;
    margin-top: 8px;
    text-decoration: underline;

    &:hover {
        color: ${({ theme }) => theme.text.primary};
    }
`;

const ActionButtons = styled.div`
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;

    & button {
        display: block;
        width: 242px;
    }
`;

const ActionsFooter = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const WalletActionsFooter = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;
    margin-bottom: 16px;

    @media (max-width: 768px) {
        flex-direction: column;
        padding: 0 3rem;
    }
`;

const InlineButton = styled(Button)`
    height: 44px;
    min-width: 242px;

    @media (max-width: 768px) {
        min-width: auto;
        width: 100%;
    }
`;

const InfoText = styled.p`
    font-size: 12px;
    color: ${({ theme }) => theme.text.secondary};
    margin-bottom: 16px;
`;

const ATTEMPTS_WARNING_THRESHOLD = 3;

type LoginWalletOption = {
    signerId: string;
    label: string;
    additionalLabel?: string;
};

function formatCountdown(ms: number): string {
    const totalSeconds = Math.ceil(ms / 1_000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const Login: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const { isLaptop } = useScreen();

    const [searchParams] = useSearchParams();

    const loginWalletSignerId: string | null = searchParams.get("id");
    const specificRedirectUrl: string | null = searchParams.get("redirectUrl");
    const action: string | null = searchParams.get("action");

    const isLoading = useSelector((state: RootState) => state.auth.isLoading);
    const wallets = useSelector(selectWallets);
    const hasWallets = useSelector(selectHasWallets);
    const loginWallet = useSelector((state: RootState) =>
        selectWalletByFilter(
            state,
            (walletMeta) => walletMeta.signerId === loginWalletSignerId,
        ),
    );

    const [password, setPassword] = useState("");
    const [selectedSignerId, setSelectedSignerId] = useState<string>("");
    const [loginError, setLoginError] = useState<string>("");
    const [showError, setShowError] = useState(false);

    const [showCreateModal, setShowCreateModal] = useState(
        action === WalletActions.CREATE_WALLET,
    );
    const [showImportModal, setShowImportModal] = useState(false);
    const [showImportPkModal, setShowImportPkModal] = useState(false);

    // Rate limit UI state
    const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(
        null,
    );
    const [countdownMs, setCountdownMs] = useState(0);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Security warning state (persists across sessions via audit log)
    const [activityReport, setActivityReport] =
        useState<SuspiciousActivityReport | null>(null);
    const [securityWarningDismissed, setSecurityWarningDismissed] =
        useState(false);

    const isLockedOut = rateLimitInfo?.locked === true && countdownMs > 0;
    const remainingAttempts = rateLimitInfo
        ? rateLimitInfo.maxAttempts - rateLimitInfo.failedAttempts
        : null;
    const showAttemptsWarning =
        !isLockedOut &&
        remainingAttempts !== null &&
        rateLimitInfo !== null &&
        rateLimitInfo.failedAttempts >= ATTEMPTS_WARNING_THRESHOLD &&
        remainingAttempts > 0;

    const walletOptions = useMemo<LoginWalletOption[]>(() => {
        const hdWallets = wallets.filter(
            (wallet: IWalletMeta) => wallet.type !== WalletTypes.PRIVATE_KEY,
        );
        const pkWallets = wallets.filter(
            (wallet: IWalletMeta) => wallet.type === WalletTypes.PRIVATE_KEY,
        );

        return [
            ...hdWallets.map((wallet: IWalletMeta, index: number) => ({
                signerId: wallet.signerId,
                label: `Wallet ${index + 1}`,
            })),
            ...pkWallets.map((wallet: IWalletMeta, index: number) => ({
                signerId: wallet.signerId,
                label: `Private Key Account ${index + 1}`,
                additionalLabel: "imported",
            })),
        ];
    }, [wallets]);

    // ── Rate limit polling ──────────────────────────────────────────────────

    const refreshRateLimitInfo = useCallback(async () => {
        const contextKey = buildContextKey(selectedSignerId || undefined);
        const info = await getRateLimitInfo(contextKey);
        setRateLimitInfo(info);

        if (info.locked && info.remainingMs > 0) {
            setCountdownMs(info.remainingMs);
        } else {
            setCountdownMs(0);
        }
    }, [selectedSignerId]);

    // Analyze audit log for security warnings (3+ consecutive failures, account switching)
    const refreshActivity = useCallback(async () => {
        const report = await analyzeRecentActivity();
        setActivityReport(report);
    }, []);

    const showSecurityWarning =
        !securityWarningDismissed &&
        activityReport !== null &&
        activityReport.showSecurityWarning;

    // Check rate limit + activity on mount and when selected account changes
    useEffect(() => {
        refreshRateLimitInfo();
        refreshActivity();
    }, [refreshRateLimitInfo, refreshActivity]);

    // Countdown timer
    useEffect(() => {
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }

        if (countdownMs <= 0) return;

        countdownRef.current = setInterval(() => {
            setCountdownMs((prev) => {
                const next = prev - 1_000;
                if (next <= 0) {
                    if (countdownRef.current)
                        clearInterval(countdownRef.current);
                    countdownRef.current = null;
                    refreshRateLimitInfo();
                    return 0;
                }
                return next;
            });
        }, 1_000);

        return () => {
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
        };
    }, [countdownMs > 0]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Existing effects ────────────────────────────────────────────────────

    useEffect(() => {
        if (selectedSignerId) {
            return;
        }

        if (loginWallet) {
            setSelectedSignerId(loginWallet.signerId);
            return;
        }

        if (walletOptions.length > 0) {
            setSelectedSignerId(walletOptions[0].signerId);
        }
    }, [walletOptions, selectedSignerId, loginWallet]);

    useEffect(() => {
        if (!!selectedSignerId || !wallets.length) {
            return;
        }

        setSelectedSignerId(wallets[0].signerId);
    }, [wallets]);

    useEffect(() => {
        if (loginError) {
            setShowError(true);
            const timer = setTimeout(() => setShowError(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [loginError]);

    useEffect(() => {
        if (action === WalletActions.CREATE_WALLET) {
            setShowCreateModal(true);

            return;
        }
    }, [action]);

    // ── Handlers ────────────────────────────────────────────────────────────

    const handleLogin = async () => {
        if (!password.trim() || !selectedSignerId || isLockedOut) return;

        try {
            await dispatch(
                loginWithPassword({
                    signerId: selectedSignerId,
                    password,
                }),
            ).unwrap();

            setLoginError("");

            navigate(specificRedirectUrl ?? "/");
        } catch (error: unknown) {
            setLoginError((error as Error).message || "Login failed");
            setSecurityWarningDismissed(false);
            await refreshRateLimitInfo();
            await refreshActivity();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && password.trim() && !isLockedOut && !isLoading) {
            handleLogin();
        }
    };

    if (!hasWallets) {
        return <Navigate to={"/accounts"} replace />;
    }

    const selectWalletOptions: ISelectOption[] = walletOptions.map(
        (option) => ({
            id: option.signerId,
            value: option.signerId,
            label: option.label,
            additionalLabel: option.additionalLabel,
        }),
    );

    return (
        <Fragment>
            <LoginContainer>
                <Card>
                    <CardHeader>
                        <CardTitle>Unlock Wallet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLockedOut && (
                            <LockoutBanner>
                                {formatLockoutMessage(countdownMs)}
                                <br />
                                <CountdownText>
                                    {formatCountdown(countdownMs)}
                                </CountdownText>
                            </LockoutBanner>
                        )}

                        {showAttemptsWarning && (
                            <WarningBanner>
                                {remainingAttempts === 1
                                    ? "Last attempt before temporary lockout."
                                    : `${remainingAttempts} attempts remaining before temporary lockout.`}
                            </WarningBanner>
                        )}

                        {showSecurityWarning && (
                            <SecurityWarningBanner>
                                <SecurityWarningTitle>
                                    Security notice
                                </SecurityWarningTitle>
                                We noticed several failed login attempts on this
                                wallet. If it wasn&apos;t you, consider changing
                                your password after logging in.
                                {activityReport?.accountNameChanged && (
                                    <>
                                        <br />
                                        Attempts were made with different
                                        account names.
                                    </>
                                )}
                                <br />
                                <DismissLink
                                    onClick={() =>
                                        setSecurityWarningDismissed(true)
                                    }
                                >
                                    Dismiss
                                </DismissLink>
                            </SecurityWarningBanner>
                        )}

                        {showError && loginError && !isLockedOut && (
                            <ErrorMessage>{loginError}</ErrorMessage>
                        )}

                        {walletOptions.length > 1 && (
                            <FormGroup>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "inherit",
                                    }}
                                >
                                    Select Wallet
                                </label>
                                <Select
                                    id="login-account-selector"
                                    value={selectedSignerId}
                                    onChange={(value: string) =>
                                        setSelectedSignerId(value)
                                    }
                                    options={selectWalletOptions}
                                />
                                <InfoText>
                                    Different wallets can have the same
                                    password. Select the wallet you want to
                                    unlock.
                                </InfoText>
                            </FormGroup>
                        )}

                        <FormGroup>
                            <PasswordInput
                                id="login-password-input"
                                data-testid="login-password-input"
                                data-cy="login-password-input"
                                label="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onInput={(e) => {
                                    const target = e.currentTarget;
                                    if (target.value !== password) {
                                        setPassword(target.value);
                                    }
                                }}
                                onKeyPress={handleKeyPress}
                                placeholder={
                                    isLockedOut
                                        ? "Temporarily locked"
                                        : "Enter your password"
                                }
                                autoFocus={
                                    walletOptions.length <= 1 && !isLockedOut
                                }
                                autoComplete="current-password"
                                disabled={isLockedOut}
                            />
                        </FormGroup>

                        <ActionButtons>
                            <Button
                                id="login-unlock-button"
                                onClick={handleLogin}
                                loading={isLoading}
                                disabled={
                                    !password.trim() ||
                                    !selectedSignerId ||
                                    isLockedOut
                                }
                            >
                                {isLockedOut ? "Locked" : "Unlock"}
                            </Button>
                        </ActionButtons>

                        <ActionsFooter>
                            <WalletActionsFooter>
                                <InlineButton
                                    id="create-wallet-button"
                                    onClick={() => setShowCreateModal(true)}
                                    fullWidth={isLaptop}
                                    variant="secondary"
                                    style={{
                                        flexWrap: "nowrap",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    <h3>Create Wallet</h3>
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 14 14"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M14 8H8V14H6V8H0L0 6H6V0L8 0V6H14V8Z"
                                            fill="currentcolor"
                                        />
                                    </svg>
                                </InlineButton>
                                <InlineButton
                                    id="import-wallet-button"
                                    variant="secondary"
                                    onClick={() => setShowImportModal(true)}
                                    fullWidth={isLaptop}
                                    style={{
                                        flexWrap: "nowrap",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    <h3>Import Wallet</h3>
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <g clipPath="url(#clip0_3_1930)">
                                            <path
                                                d="M12 16L16 12H13V3H11V12H8L12 16ZM21 3H15V4.99H21V19.02H3V4.99H9V3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3Z"
                                                fill="currentcolor"
                                            />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_3_1930">
                                                <rect
                                                    width="24"
                                                    height="24"
                                                    fill="currentcolor"
                                                />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </InlineButton>
                            </WalletActionsFooter>
                            <InlineButton
                                id="import-private-key-button"
                                variant="full-ghost"
                                onClick={() => setShowImportPkModal(true)}
                                fullWidth={isLaptop}
                                style={{
                                    flexWrap: "nowrap",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <h3>Import Private Key</h3>
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <g clipPath="url(#clip0_3_1930)">
                                        <path
                                            d="M12 16L16 12H13V3H11V12H8L12 16ZM21 3H15V4.99H21V19.02H3V4.99H9V3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3Z"
                                            fill="currentcolor"
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_3_1930">
                                            <rect
                                                width="24"
                                                height="24"
                                                fill="currentcolor"
                                            />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </InlineButton>
                        </ActionsFooter>
                    </CardContent>
                </Card>
            </LoginContainer>
            <CreateHdWalletModal
                isOpen={showCreateModal}
                onCancel={() => {
                    setShowCreateModal(false);
                    navigate("/login");
                }}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    navigate("/");
                }}
            />
            <ImportHdWalletModal
                isOpen={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    navigate("/");
                }}
            />
            <ImportPkWalletModal
                isOpen={showImportPkModal}
                onCancel={() => setShowImportPkModal(false)}
                onClose={() => setShowImportPkModal(false)}
                onSuccess={() => {
                    navigate("/");
                }}
            />
        </Fragment>
    );
};
