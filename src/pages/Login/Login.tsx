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
import { CreatePkWalletModal } from "components/CreatePkWalletModal";
import { ImportHdWalletModal } from "components/ImportHdWalletModal";
import { ImportPkWalletModal } from "components/ImportPkWalletModal";
import { ImportKeyfileWalletModal } from "components/ImportKeyfileWalletModal";
import { IKeyfileAccountsImportOutcome } from "components/ImportKeyfileWalletForm";
import { useScreen } from "hooks/";

const LoginPage = styled.div`
    box-sizing: border-box;
    width: 100%;
    padding: 0 ${({ theme }) => theme.layout.gutterMobile};

    @media (min-width: calc(${({ theme }) => theme.breakpoints.mobile} + 1px)) {
        padding: 0 ${({ theme }) => theme.layout.gutterDesktop};
    }
`;

const LoginContainer = styled.div`
    box-sizing: border-box;
    width: 100%;
    max-width: ${({ theme }) => theme.layout.contentNarrow};
    margin: clamp(24px, 8vh, 100px) auto;
`;

const UnlockForm = styled.form`
    width: 100%;
`;

const FormGroup = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing.xl};
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

/** Non-credential unlock failures — not attached to the password field. */
const StatusBanner = styled.div`
    background: ${({ theme }) => `${theme.danger}18`};
    border: 1px solid ${({ theme }) => `${theme.danger}40`};
    color: ${({ theme }) => theme.danger};
    padding: 12px;
    border-radius: ${({ theme }) => theme.radii.md};
    margin-bottom: ${({ theme }) => theme.spacing.lg};
    font-size: ${({ theme }) => theme.typography.size.sm};
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

const ImportNoticeBanner = styled.div`
    background: ${({ theme }) => `${theme.success}12`};
    border: 1px solid ${({ theme }) => `${theme.success}40`};
    color: ${({ theme }) => theme.text.primary};
    padding: 14px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 13px;
    line-height: 1.5;
`;

const ImportNoticeTitle = styled.div`
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 6px;
    color: ${({ theme }) => theme.success};
`;

const ImportNoticeActions = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 12px;
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
    margin-top: ${({ theme }) => theme.spacing.xl};
`;

const ActionsFooter = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const WalletActionsFooter = styled.div`
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${({ theme }) => theme.spacing.lg};
    margin-top: ${({ theme }) => theme.spacing.lg};
    margin-bottom: ${({ theme }) => theme.spacing.lg};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 1fr;
    }
`;

const InlineButton = styled(Button)`
    width: 100%;
    min-width: 0;
`;

const FieldLabel = styled.label`
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
`;

const ATTEMPTS_WARNING_THRESHOLD = 3;

type LoginWalletOption = {
    signerId: string;
    label: string;
    additionalLabel?: string;
};

type WalletKind = "hd" | "private_key";

const WALLET_KIND_OPTIONS: ISelectOption[] = [
    { id: "hd", value: "hd", label: "HD wallet" },
    { id: "private_key", value: "private_key", label: "Private key wallet" },
];

function formatCountdown(ms: number): string {
    const totalSeconds = Math.ceil(ms / 1_000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** RTK unwrap() rejects with SerializedError, not Error instances. */
function getRejectField(error: unknown, field: "message" | "name"): string {
    if (error instanceof Error) {
        return field === "message" ? error.message : error.name;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        field in error &&
        typeof (error as Record<string, unknown>)[field] === "string"
    ) {
        return (error as Record<string, string>)[field];
    }

    return "";
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
    // Match walletOptions order (HD first), not wallets[] insertion order.
    const [selectedSignerId, setSelectedSignerId] = useState<string>(() => {
        if (loginWallet?.signerId) {
            return loginWallet.signerId;
        }

        const firstHdWallet = wallets.find(
            (walletMeta) => walletMeta.type !== WalletTypes.PRIVATE_KEY,
        );

        return firstHdWallet?.signerId ?? wallets[0]?.signerId ?? "";
    });
    const [passwordError, setPasswordError] = useState<string>("");
    const [statusError, setStatusError] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submissionRef = useRef(false);

    const clearUnlockErrors = (): void => {
        setPasswordError("");
        setStatusError("");
    };

    const [showCreateModal, setShowCreateModal] = useState(
        action === WalletActions.CREATE_WALLET,
    );
    const [showCreatePkModal, setShowCreatePkModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showImportPkModal, setShowImportPkModal] = useState(false);
    const [showImportKeyfileModal, setShowImportKeyfileModal] = useState(false);
    const [walletKind, setWalletKind] = useState<WalletKind>("hd");

    const [keyfileImport, setKeyfileImport] =
        useState<IKeyfileAccountsImportOutcome | null>(null);

    const passwordInputRef = useRef<HTMLInputElement>(null);

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

    const refreshRateLimitInfo = useCallback(async (): Promise<RateLimitInfo> => {
        const contextKey = buildContextKey(selectedSignerId || undefined);
        const info = await getRateLimitInfo(contextKey);
        setRateLimitInfo(info);

        if (info.locked && info.remainingMs > 0) {
            setCountdownMs(info.remainingMs);
        } else {
            setCountdownMs(0);
        }

        return info;
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
        if (action === WalletActions.CREATE_WALLET) {
            setShowCreateModal(true);

            return;
        }
    }, [action]);

    // ── Handlers ────────────────────────────────────────────────────────────

    const isPending = isLoading || isSubmitting;

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (
            submissionRef.current ||
            isPending ||
            !password.trim() ||
            !selectedSignerId ||
            isLockedOut
        ) return;

        submissionRef.current = true;
        setIsSubmitting(true);
        clearUnlockErrors();

        try {
            await dispatch(
                loginWithPassword({
                    signerId: selectedSignerId,
                    password,
                }),
            ).unwrap();

            clearUnlockErrors();

            navigate(specificRedirectUrl ?? "/");
        } catch (error: unknown) {
            setSecurityWarningDismissed(false);

            const message = getRejectField(error, "message").toLowerCase();
            const name = getRejectField(error, "name");
            const isRateLimitedMessage = message.includes(
                "too many failed attempts",
            );
            const isNetworkMessage =
                message.includes("network") ||
                message.includes("failed to fetch");
            const isTimeoutMessage =
                name === "TimeoutError" ||
                message.includes("timeout") ||
                message.includes("timed out");
            const isCancelledMessage = name === "AbortError";

            // Surface the unlock outcome before side-effect refreshes so a
            // failed rate-limit/audit read cannot swallow feedback.
            // Credential failures attach to the password field; other failures
            // use a status banner so the input is not marked invalid.
            if (isRateLimitedMessage) {
                setStatusError(getRejectField(error, "message"));
            } else if (isNetworkMessage) {
                setStatusError(
                    "Unable to unlock. Check your connection and try again.",
                );
            } else if (isTimeoutMessage) {
                setStatusError(
                    "Unable to unlock. The request timed out. Please try again.",
                );
            } else if (isCancelledMessage) {
                setStatusError(
                    "Unable to unlock. The request was cancelled. Please try again.",
                );
            } else {
                setPasswordError(
                    "Unable to unlock. Check your password and try again.",
                );
            }

            try {
                const info = await refreshRateLimitInfo();
                await refreshActivity();

                // Lockout banner owns rate-limit messaging once state is available.
                if (info.locked && info.remainingMs > 0) {
                    setStatusError("");
                    setPasswordError("");
                }
            } catch {
                // Rate-limit / audit refresh must not block unlock error UI.
            }
        } finally {
            submissionRef.current = false;
            setIsSubmitting(false);
        }
    };

    if (!hasWallets) {
        return <Navigate to={"/accounts"} replace />;
    }

    const importedWalletLabel: string = keyfileImport
        ? (walletOptions.find(
              (option: LoginWalletOption) =>
                  option.signerId === keyfileImport.signerId,
          )?.label ?? "the existing wallet")
        : "";

    const handleSelectImportedWallet = (): void => {
        if (!keyfileImport) {
            return;
        }

        setSelectedSignerId(keyfileImport.signerId);
        setPassword("");
        clearUnlockErrors();
        passwordInputRef.current?.focus();
    };

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
            <LoginPage>
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
                                    We noticed several failed login attempts on
                                    this wallet. If it wasn&apos;t you, consider
                                    changing your password after logging in.
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

                            {statusError && !isLockedOut && (
                                <StatusBanner role="alert">
                                    {statusError}
                                </StatusBanner>
                            )}

                            {keyfileImport && (
                                <ImportNoticeBanner>
                                    <ImportNoticeTitle>
                                        Accounts imported, you are not signed in
                                        yet
                                    </ImportNoticeTitle>
                                    {keyfileImport.importedAccountsCount === 1
                                        ? "1 account was added to "
                                        : `${keyfileImport.importedAccountsCount} accounts were added to `}
                                    <strong>{importedWalletLabel}</strong>. This
                                    was an import into an existing wallet, not a
                                    login. Unlock that wallet to see the imported
                                    accounts.
                                    <ImportNoticeActions>
                                        {selectedSignerId !==
                                            keyfileImport.signerId && (
                                            <Button
                                                id="select-imported-wallet-button"
                                                size="small"
                                                variant="secondary"
                                                onClick={
                                                    handleSelectImportedWallet
                                                }
                                            >
                                                Select this wallet
                                            </Button>
                                        )}
                                        <DismissLink
                                            onClick={() =>
                                                setKeyfileImport(null)
                                            }
                                        >
                                            Dismiss
                                        </DismissLink>
                                    </ImportNoticeActions>
                                </ImportNoticeBanner>
                            )}

                            <UnlockForm
                                aria-label="Unlock wallet"
                                onSubmit={handleLogin}
                            >
                                {walletOptions.length > 1 && (
                                    <FormGroup>
                                        <label
                                            id="login-account-selector-label"
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
                                            aria-labelledby="login-account-selector-label"
                                            value={selectedSignerId}
                                            disabled={isPending}
                                            onChange={(value: string) => {
                                                setSelectedSignerId(value);
                                                setPassword("");
                                                clearUnlockErrors();
                                            }}
                                            options={selectWalletOptions}
                                        />
                                    </FormGroup>
                                )}

                                <FormGroup>
                                    <PasswordInput
                                        id="login-password-input"
                                        data-testid="login-password-input"
                                        data-cy="login-password-input"
                                        label="Password"
                                        value={password}
                                        error={
                                            !isLockedOut
                                                ? passwordError || undefined
                                                : undefined
                                        }
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            clearUnlockErrors();
                                        }}
                                        onInput={(e) => {
                                            const nextPassword =
                                                e.currentTarget.value;
                                            if (nextPassword !== password) {
                                                setPassword(nextPassword);
                                                clearUnlockErrors();
                                            }
                                        }}
                                        placeholder={
                                            isLockedOut
                                                ? "Temporarily locked"
                                                : "Enter your password"
                                        }
                                        autoFocus={
                                            walletOptions.length <= 1 &&
                                            !isLockedOut
                                        }
                                        autoComplete="current-password"
                                        disabled={isLockedOut || isPending}
                                        inputRef={passwordInputRef}
                                    />
                                </FormGroup>

                                <ActionButtons>
                                    <Button
                                        id="login-unlock-button"
                                        type="submit"
                                        fullWidth
                                        loading={isPending}
                                        disabled={
                                            !password.trim() ||
                                            !selectedSignerId ||
                                            isLockedOut ||
                                            isPending
                                        }
                                    >
                                        {isLockedOut ? "Locked" : "Unlock"}
                                    </Button>
                                </ActionButtons>
                            </UnlockForm>

                        <ActionsFooter>
                            <FormGroup style={{ marginTop: "24px", marginBottom: 0 }}>
                                <FieldLabel htmlFor="login-account-type-button">
                                    Account Type
                                </FieldLabel>
                                <Select
                                    id="login-account-type"
                                    aria-label="Account Type"
                                    value={walletKind}
                                    onChange={(value: string) =>
                                        setWalletKind(value as WalletKind)
                                    }
                                    options={WALLET_KIND_OPTIONS}
                                    style={{ width: "100%" }}
                                />
                            </FormGroup>
                            <WalletActionsFooter>
                                {walletKind === "hd" ? (
                                    <>
                                        <InlineButton
                                            id="create-wallet-button"
                                            onClick={() =>
                                                setShowCreateModal(true)
                                            }
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
                                            onClick={() =>
                                                setShowImportModal(true)
                                            }
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
                                    </>
                                ) : (
                                    <>
                                        <InlineButton
                                            id="create-private-key-wallet-button"
                                            variant="secondary"
                                            onClick={() =>
                                                setShowCreatePkModal(true)
                                            }
                                            fullWidth={isLaptop}
                                            style={{
                                                flexWrap: "nowrap",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <h3>Create Private Key Wallet</h3>
                                        </InlineButton>
                                        <InlineButton
                                            id="import-private-key-button"
                                            variant="secondary"
                                            onClick={() =>
                                                setShowImportPkModal(true)
                                            }
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
                                    </>
                                )}
                            </WalletActionsFooter>
                            <InlineButton
                                id="import-keyfile-wallet-button"
                                variant="full-ghost"
                                onClick={() => setShowImportKeyfileModal(true)}
                                fullWidth={isLaptop}
                                style={{
                                    flexWrap: "nowrap",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <h3>Import Wallet from keyfile</h3>
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
            </LoginPage>
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
            <CreatePkWalletModal
                isOpen={showCreatePkModal}
                onCancel={() => setShowCreatePkModal(false)}
                onClose={() => setShowCreatePkModal(false)}
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
            <ImportKeyfileWalletModal
                isOpen={showImportKeyfileModal}
                onCancel={() => setShowImportKeyfileModal(false)}
                onClose={() => setShowImportKeyfileModal(false)}
                onWalletImported={() => {
                    navigate("/");
                }}
                onAccountsImported={setKeyfileImport}
            />
        </Fragment>
    );
};
