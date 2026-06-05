import React, { createContext, useContext, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "store";
import { RChainService } from "services/rchain";
import { SecureStorage } from "services/secureStorage";
import { getGasFeeAsNumber } from "../../constants/gas";
import { Button, DeploymentConfirmationModal } from "components";
import { DeleteIcon, PreviewIcon } from "components/Icons";
import { useScreen } from "hooks/";

const PENDING_TRANSACTIONS_KEY = "asi_wallet_pending_transactions";

interface PendingTransaction {
    deployId: string;
    from: string;
    to?: string;
    amount?: string;
    timestamp: string;
    accountId: string;
    type: "send" | "receive" | "deploy";
    expectedBalance?: string;
}

enum DeployResultStatus {
    Completed = "completed",
    Errored = "errored",
    SystemError = "system_error",
    Pending = "pending",
    Submitted = "submitted",
}

type DeployResultData = {
    status: DeployResultStatus;
    message?: string;
    error?: string;
    blockHash?: string;
    cost?: string;
    [key: string]: unknown;
};

const savePendingTransaction = (tx: PendingTransaction) => {
    if (typeof window === "undefined" || !window.localStorage) {
        return;
    }

    try {
        const existing = localStorage.getItem(PENDING_TRANSACTIONS_KEY);
        const pendingTxs: PendingTransaction[] = existing
            ? JSON.parse(existing)
            : [];

        const existingIndex = pendingTxs.findIndex(
            (t) => t.deployId === tx.deployId,
        );
        if (existingIndex >= 0) {
            pendingTxs[existingIndex] = tx;
        } else {
            pendingTxs.push(tx);
        }

        localStorage.setItem(
            PENDING_TRANSACTIONS_KEY,
            JSON.stringify(pendingTxs),
        );
    } catch (error) {
        console.error(
            "Failed to save pending transaction to localStorage:",
            error,
        );
    }
};

const CodeEditor = styled.textarea`
    width: 100%;
    height: 300px;
    padding: 16px;
    font-size: 14px;
    background: ${({ theme }) => theme.surface};
    border: 2px solid ${({ theme }) => theme.border};
    border-radius: 8px;
    color: ${({ theme }) => theme.text.primary};
    resize: vertical;
    margin-bottom: 36px;

    &:focus {
        border-color: ${({ theme }) => theme.primary};
        outline: none;
    }

    &::placeholder {
        color: ${({ theme }) => theme.text.secondary};
        opacity: 0.7;
    }

    /* Force better contrast in dark mode */
    &::-webkit-input-placeholder {
        color: ${({ theme }) => theme.text.secondary};
    }
    &::-moz-placeholder {
        color: ${({ theme }) => theme.text.secondary};
    }
`;

const FormGroup = styled.div``;

const FormRow = styled.div`
    display: flex;
    gap: 16px;
    align-items: end;

    @media (max-width: 768px) {
        width: 100%;
    }
`;

const BoardActions = styled.div`
    display: flex;
    gap: 24px;
    align-items: center;
`;

const DeployButton = styled(Button)`
    @media (min-width: 768px) {
        min-width: 157px;
    }
`;

const ResultContainer = styled.div`
    margin-top: 24px;
    padding: 16px;
    background: ${({ theme }) => theme.surface};
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.border};
`;

const ResultTitle = styled.h4`
    margin: 0 0 12px 0;
    color: ${({ theme }) => theme.text.primary};
`;

const ResultContent = styled.pre`
    margin: 0;
    font-size: 12px;
    color: ${({ theme }) => theme.text.secondary};
    white-space: pre-wrap;
    word-break: break-all;
`;

const ErrorMessage = styled.div`
    background: ${({ theme }) => theme.danger};
    color: white;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
`;

const SuccessMessage = styled.div`
    background: ${({ theme }) => theme.success};
    color: ${({ theme }) => theme.text.inverse};
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    word-break: break-all;

    /* Force inverse text for all content */
    * {
        color: ${({ theme }) => theme.text.inverse} !important;
    }

    .deploy-id {
        font-size: 12px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid ${({ theme }) => `${theme.text.inverse}20`};
        color: ${({ theme }) => theme.text.inverse};
        opacity: 0.9;
        line-height: 1.4;
    }
`;

export const exampleContract = `new stdout(\`rho:io:stdout\`), deployerId(\`rho:rchain:deployerId\`) in {
  stdout!("Hello from ASI Wallet!") |
  deployerId!("Deploy successful")
}`;

interface DeployLiteModeContextValue {
    code: string;
    setCode: (value: string) => void;
    isLoading: boolean;
    error: string;
    result: any;
    deployId: string;
    showDeployConfirmation: boolean;
    showExploreConfirmation: boolean;
    phloLimit: string;
    phloPrice: string;
    selectedAccount: RootState["wallet"]["selectedAccount"];
    isAccountUnlocked: boolean;
    loadExample: () => void;
    clearCode: () => void;
    handleDeployClick: () => void;
    handleExploreClick: () => void;
    handleConfirmDeploy: () => void;
    handleConfirmExplore: () => void;
    closeDeployConfirmation: () => void;
    closeExploreConfirmation: () => void;
}

const DeployLiteModeContext = createContext<DeployLiteModeContextValue | null>(
    null,
);

const useDeployLiteMode = (): DeployLiteModeContextValue => {
    const context = useContext(DeployLiteModeContext);
    if (!context) {
        throw new Error(
            "DeployLiteModeWidget compound components must be used within <DeployLiteModeWidget>",
        );
    }
    return context;
};

interface DeployLiteModeWidgetProps {
    phloLimit: string;
    phloPrice: string;
    children: React.ReactNode;
}

const DeployLiteModeWidgetRoot: React.FC<DeployLiteModeWidgetProps> = ({
    phloLimit,
    phloPrice,
    children,
}) => {
    const { selectedAccount, selectedNetwork } = useSelector(
        (state: RootState) => state.wallet,
    );
    const { unlockedAccounts } = useSelector((state: RootState) => state.auth);

    const [code, setCode] = useState(exampleContract);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<any>(null);
    const [deployId, setDeployId] = useState("");
    const [showDeployConfirmation, setShowDeployConfirmation] = useState(false);
    const [showExploreConfirmation, setShowExploreConfirmation] =
        useState(false);

    const isAccountUnlocked = unlockedAccounts.some(
        (unlockedAcc) => unlockedAcc.id === selectedAccount?.id,
    );

    const handleDeployClick = () => {
        if (!selectedAccount || !code.trim()) return;
        setShowDeployConfirmation(true);
    };

    const applyFinalDeployResult = (
        finalResult: DeployResultData,
        deployId: string,
    ) => {
        if (finalResult.status === DeployResultStatus.Completed) {
            setResult({
                ...finalResult,
                deployId,
                message: `${finalResult.message}`,
                blockHash: finalResult.blockHash,
                cost: finalResult.cost,
            });
            return;
        }

        if (finalResult.status === DeployResultStatus.Errored) {
            setError(`[ERROR] Deploy execution failed: ${finalResult.error}`);
            return;
        }

        if (finalResult.status === DeployResultStatus.SystemError) {
            setError(`[ERROR] System error: ${finalResult.error}`);
            return;
        }

        setResult(finalResult);
    };

    const applyFallbackDeployResult = (deployId: string, err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        const isCorsOrNetwork = msg.includes("CORS") || msg.includes("network");

        setResult({
            deployId,
            status: isCorsOrNetwork
                ? DeployResultStatus.Pending
                : DeployResultStatus.Submitted,
            message: isCorsOrNetwork
                ? "[PENDING] Deploy submitted successfully. Status check unavailable due to CORS/network issues."
                : "[PENDING] Deploy submitted successfully. It may still be processing or pending block inclusion.",
        });
    };

    const handleConfirmDeploy = async () => {
        if (!selectedAccount) return;
        if (!SecureStorage.hasSessionToken()) {
            setError("Session expired. Please login again.");
            return;
        }

        const balance = parseFloat(selectedAccount.balance || "0");
        const phloLimitNum = parseInt(phloLimit);
        const minGasCost = (phloLimitNum * parseFloat(phloPrice)) / 1000000000;

        if (balance <= 0 || balance < minGasCost) {
            setError("Transaction aborted: Insufficient balance");
            setShowDeployConfirmation(false);
            return;
        }

        if (isNaN(phloLimitNum) || phloLimitNum <= 0) {
            setError("Transaction aborted: Invalid phlo limit");
            setShowDeployConfirmation(false);
            return;
        }

        setShowDeployConfirmation(false);
        setIsLoading(true);
        setError("");
        setResult(null);

        try {
            if (!selectedNetwork.url || !selectedNetwork.url.trim()) {
                throw new Error(
                    `Network "${selectedNetwork.name}" has no validator URL configured`,
                );
            }

            const rchain = new RChainService(
                selectedNetwork.url.trim(),
                selectedNetwork.readOnlyUrl,
                selectedNetwork.adminUrl,
                selectedNetwork.shardId,
            );

            const unlockedAccount = unlockedAccounts.find(
                (acc) => acc.id === selectedAccount.id,
            );
            const privateKey = unlockedAccount?.privateKey;

            if (!privateKey) {
                throw new Error(
                    "Account is locked. Please unlock your account first.",
                );
            }

            let expectedBalanceAfterConfirmation: string | undefined;
            try {
                const atomicBalanceBefore = await rchain.getBalance(
                    selectedAccount.revAddress,
                    true,
                );
                const chainBalanceBefore =
                    Number(atomicBalanceBefore) / 100000000;
                const gasFee = getGasFeeAsNumber();
                const expected = Math.max(0, chainBalanceBefore - gasFee);
                expectedBalanceAfterConfirmation = expected.toFixed(8);
            } catch (error) {
                console.warn(
                    "[Deploy] Failed to fetch balance before deploy for pending metadata:",
                    error,
                );
            }

            const deployResult = await rchain.sendDeploy(
                code,
                privateKey,
                parseInt(phloLimit),
            );
            setDeployId(deployResult);

            savePendingTransaction({
                deployId: deployResult,
                from: selectedAccount.revAddress,
                timestamp: new Date().toISOString(),
                accountId: selectedAccount.id,
                type: "deploy",
                expectedBalance: expectedBalanceAfterConfirmation,
            });

            try {
                const finalResult =
                    await rchain.waitForDeployResult(deployResult);
                applyFinalDeployResult(finalResult, deployResult);
            } catch (resultError: unknown) {
                applyFallbackDeployResult(deployResult, resultError);
            }
        } catch (err: any) {
            setError(err.message || "Deploy failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExploreClick = () => {
        if (!code.trim()) return;
        setShowExploreConfirmation(true);
    };

    const handleConfirmExplore = async () => {
        setShowExploreConfirmation(false);
        setIsLoading(true);
        setError("");
        setResult(null);

        try {
            if (!selectedNetwork.url || !selectedNetwork.url.trim()) {
                throw new Error(
                    `Network "${selectedNetwork.name}" has no validator URL configured`,
                );
            }

            const rchain = new RChainService(
                selectedNetwork.url.trim(),
                selectedNetwork.readOnlyUrl,
                selectedNetwork.adminUrl,
                selectedNetwork.shardId,
            );
            const exploreResult = await rchain.exploreDeployData(code);
            setResult({ type: "explore", data: exploreResult });
        } catch (err: any) {
            setError(err.message || "Explore failed");
        } finally {
            setIsLoading(false);
        }
    };

    const loadExample = () => {
        setCode(exampleContract);
    };

    const clearCode = () => {
        setCode("");
    };

    const value: DeployLiteModeContextValue = {
        code,
        setCode,
        isLoading,
        error,
        result,
        deployId,
        showDeployConfirmation,
        showExploreConfirmation,
        phloLimit,
        phloPrice,
        selectedAccount,
        isAccountUnlocked,
        loadExample,
        clearCode,
        handleDeployClick,
        handleExploreClick,
        handleConfirmDeploy,
        handleConfirmExplore,
        closeDeployConfirmation: () => setShowDeployConfirmation(false),
        closeExploreConfirmation: () => setShowExploreConfirmation(false),
    };

    return (
        <DeployLiteModeContext.Provider value={value}>
            {children}
        </DeployLiteModeContext.Provider>
    );
};

const DeployLiteModeActions: React.FC = () => {
    const { loadExample } = useDeployLiteMode();
    const { isTablet } = useScreen();

    return (
        <FormRow>
            <Button
                style={{ height: "44px", whiteSpace: "nowrap" }}
                fullWidth={isTablet}
                onClick={loadExample}
            >
                <h3>Load Example</h3>
            </Button>
        </FormRow>
    );
};

const DeployLiteModeBoard: React.FC = () => {
    const {
        code,
        setCode,
        isLoading,
        error,
        result,
        deployId,
        showDeployConfirmation,
        showExploreConfirmation,
        phloLimit,
        phloPrice,
        selectedAccount,
        isAccountUnlocked,
        clearCode,
        handleDeployClick,
        handleExploreClick,
        handleConfirmDeploy,
        handleConfirmExplore,
        closeDeployConfirmation,
        closeExploreConfirmation,
    } = useDeployLiteMode();

    const { isLaptop } = useScreen();

    const clearButtonVariant = !isLaptop ? "ghost" : "icon-button";

    return (
        <>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {(deployId || (result && (result as any).deployId)) && (
                <SuccessMessage>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <div style={{ flex: "1", minWidth: "200px" }}>
                            <div>Deploy submitted successfully!</div>
                            <div className="deploy-id">
                                Deploy ID:{" "}
                                {deployId || (result as any).deployId}
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="small"
                            style={{
                                flexShrink: 0,
                                whiteSpace: "nowrap",
                            }}
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(
                                        deployId || (result as any).deployId,
                                    );
                                } catch {}
                            }}
                        >
                            Copy
                        </Button>
                    </div>
                </SuccessMessage>
            )}
            <FormGroup>
                <label
                    style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "500",
                    }}
                >
                    Rholang Code
                </label>
                <CodeEditor
                    id="deploy-rholang-code-editor"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter your Rholang code here..."
                    disabled={isLoading}
                />
                <BoardActions>
                    <DeployButton
                        id="deploy-contract-button"
                        onClick={handleDeployClick}
                        loading={isLoading}
                        disabled={
                            !code.trim() ||
                            !selectedAccount ||
                            !isAccountUnlocked
                        }
                    >
                        <h3>Deploy</h3>
                    </DeployButton>
                    <Button
                        variant="secondary"
                        onClick={handleExploreClick}
                        loading={isLoading}
                        disabled={!code.trim()}
                    >
                        <h3>Explore</h3>
                        {!isLaptop && <PreviewIcon />}
                    </Button>
                    <Button
                        variant={clearButtonVariant}
                        onClick={clearCode}
                        dangerHover
                        style={{
                            height: "30px",
                        }}
                    >
                        {!isLaptop && (
                            <h3
                                style={{ fontSize: "0.75rem" }}
                                className="text-danger"
                            >
                                Clear
                            </h3>
                        )}
                        <DeleteIcon />
                    </Button>
                </BoardActions>
            </FormGroup>
            {result && (
                <ResultContainer>
                    <ResultTitle>
                        {result.type === "explore"
                            ? "Explore Result"
                            : "Deploy Result"}
                    </ResultTitle>
                    <ResultContent>
                        {JSON.stringify(result.data || result, null, 2)}
                    </ResultContent>
                </ResultContainer>
            )}

            <DeploymentConfirmationModal
                isOpen={showDeployConfirmation}
                onClose={closeDeployConfirmation}
                onConfirm={handleConfirmDeploy}
                rholangCode={code}
                phloLimit={phloLimit}
                phloPrice={phloPrice}
                accountName={selectedAccount?.name || ""}
                accountAddress={selectedAccount?.revAddress || ""}
                loading={isLoading}
            />

            <DeploymentConfirmationModal
                isOpen={showExploreConfirmation}
                onClose={closeExploreConfirmation}
                onConfirm={handleConfirmExplore}
                rholangCode={code}
                phloLimit={phloLimit}
                phloPrice={phloPrice}
                accountName={selectedAccount?.name || ""}
                accountAddress={selectedAccount?.revAddress || ""}
                isExplore={true}
                loading={isLoading}
            />
        </>
    );
};

export const DeployLiteModeWidget = Object.assign(DeployLiteModeWidgetRoot, {
    Actions: DeployLiteModeActions,
    Board: DeployLiteModeBoard,
});
