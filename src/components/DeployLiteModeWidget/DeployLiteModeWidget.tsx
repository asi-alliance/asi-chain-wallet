import React, { createContext, useContext, useState } from "react";
import styled from "styled-components";
import {
    Button,
    DeploymentConfirmationModal,
    PasswordModal,
} from "components";
import { DeleteIcon, PreviewIcon } from "components/Icons";
import {
    DeployEventTypes,
    IUseDeployContractResponse,
    TDeployEvent,
    useDeployContract,
    useScreen,
} from "hooks/";
import { stringifyWithBigInt } from "utils/helpers";

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

const LoadingMessage = styled.div`
    background: ${({ theme }) => `${theme.primary}20`};
    color: ${({ theme }) => theme.primary};
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    word-break: break-all;

    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid ${({ theme }) => theme.primary};
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 8px;
        vertical-align: middle;
    }

    .deploy-id {
        font-size: 12px;
        margin-top: 8px;
        opacity: 0.8;
        line-height: 1.4;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;

export const exampleContract = `new stdout(\`rho:io:stdout\`), deployerId(\`rho:rchain:deployerId\`) in {
  stdout!("Hello from ASI Wallet!") |
  deployerId!("Deploy successful")
}`;

const SENT_STATUS_LABEL = "Sent";

interface IDeployLiteModeContextValue extends IUseDeployContractResponse {
    code: string;
    setCode: (value: string) => void;
    error: string;
    exploreResult: unknown;
    deployId: string;
    deployStatus: string;
    phloLimit: string;
    phloPrice: string;
    loadExample: () => void;
    clearCode: () => void;
    handleDeployClick: () => void;
    handleExploreClick: () => void;
}

const DeployLiteModeContext =
    createContext<IDeployLiteModeContextValue | null>(null);

const useDeployLiteMode = (): IDeployLiteModeContextValue => {
    const context = useContext(DeployLiteModeContext);

    if (!context) {
        throw new Error(
            "DeployLiteModeWidget compound components must be used within <DeployLiteModeWidget>",
        );
    }

    return context;
};

interface IDeployLiteModeWidgetProps {
    phloLimit: string;
    phloPrice: string;
    children: React.ReactNode;
}

const DeployLiteModeWidgetRoot: React.FC<IDeployLiteModeWidgetProps> = ({
    phloLimit,
    phloPrice,
    children,
}) => {
    const [code, setCode] = useState(exampleContract);
    const [error, setError] = useState("");
    const [exploreResult, setExploreResult] = useState<unknown>(null);
    const [deployId, setDeployId] = useState("");
    const [deployStatus, setDeployStatus] = useState("");

    const resetOutput = (): void => {
        setError("");
        setExploreResult(null);
        setDeployId("");
        setDeployStatus("");
    };

    const handleDeployEvent = (event: TDeployEvent): void => {
        switch (event.type) {
            case DeployEventTypes.DEPLOY_STARTED:
            case DeployEventTypes.EXPLORE_STARTED:
                resetOutput();

                return;
            case DeployEventTypes.DEPLOY_SUBMITTED:
                setDeployId(event.deployId);
                setDeployStatus(SENT_STATUS_LABEL);

                return;
            case DeployEventTypes.DEPLOY_STATUS:
                setDeployStatus(event.status);

                return;
            case DeployEventTypes.EXPLORE_COMPLETED:
                setExploreResult(event.result);

                return;
            case DeployEventTypes.DEPLOY_FAILED:
            case DeployEventTypes.EXPLORE_FAILED:
                setError(event.message);
        }
    };

    const deployContractState = useDeployContract({
        phloLimit,
        phloPrice,
        onEvent: handleDeployEvent,
    });

    const handleDeployClick = (): void => {
        if (!code.trim()) {
            return;
        }

        deployContractState.requestDeploy(code);
    };

    const handleExploreClick = (): void => {
        if (!code.trim()) {
            return;
        }

        deployContractState.requestExplore(code);
    };

    const value: IDeployLiteModeContextValue = {
        ...deployContractState,
        code,
        setCode,
        error,
        exploreResult,
        deployId,
        deployStatus,
        phloLimit,
        phloPrice,
        loadExample: () => setCode(exampleContract),
        clearCode: () => setCode(""),
        handleDeployClick,
        handleExploreClick,
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

const CopyDeployIdButton: React.FC<{ deployId: string }> = ({ deployId }) => (
    <Button
        variant="secondary"
        size="small"
        style={{
            flexShrink: 0,
            whiteSpace: "nowrap",
        }}
        onClick={async () => {
            try {
                await navigator.clipboard.writeText(deployId);
            } catch {}
        }}
    >
        Copy
    </Button>
);

const DeployLiteModeBoard: React.FC = () => {
    const {
        account,
        isBalanceReady,
        code,
        setCode,
        error,
        exploreResult,
        deployId,
        deployStatus,
        phloLimit,
        phloPrice,
        pendingTerm,
        isProcessing,
        isWaitingForConfirmation,
        isDeployConfirmed,
        isDeployConfirmationOpen,
        isExploreConfirmationOpen,
        isPasswordModalOpen,
        passwordError,
        confirmDeploy,
        confirmExplore,
        submitPassword,
        cancel,
        clearCode,
        handleDeployClick,
        handleExploreClick,
    } = useDeployLiteMode();

    const { isLaptop } = useScreen();

    const clearButtonVariant = !isLaptop ? "ghost" : "icon-button";

    return (
        <>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {deployId && isWaitingForConfirmation && (
                <LoadingMessage>
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
                            <div>
                                <span className="spinner"></span>
                                Deploy sent! Waiting for confirmation...
                            </div>
                            <div className="deploy-id">
                                Deploy ID: {deployId}
                            </div>
                            {deployStatus && (
                                <div className="deploy-id">
                                    Status: {deployStatus}
                                </div>
                            )}
                        </div>
                        <CopyDeployIdButton deployId={deployId} />
                    </div>
                </LoadingMessage>
            )}
            {deployId && isDeployConfirmed && (
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
                                Deploy ID: {deployId}
                            </div>
                        </div>
                        <CopyDeployIdButton deployId={deployId} />
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
                    disabled={isProcessing}
                />
                <BoardActions>
                    <DeployButton
                        id="deploy-contract-button"
                        onClick={handleDeployClick}
                        loading={isProcessing}
                        disabled={!code.trim() || !account || !isBalanceReady}
                    >
                        <h3>Deploy</h3>
                    </DeployButton>
                    <Button
                        variant="secondary"
                        onClick={handleExploreClick}
                        loading={isProcessing}
                        disabled={!code.trim()}
                    >
                        <h3>Explore</h3>
                        {!isLaptop && <PreviewIcon />}
                    </Button>
                    <Button
                        title="Clear code editor"
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
            {exploreResult !== null && (
                <ResultContainer>
                    <ResultTitle>Explore Result</ResultTitle>
                    <ResultContent>
                        {stringifyWithBigInt(exploreResult)}
                    </ResultContent>
                </ResultContainer>
            )}

            <DeploymentConfirmationModal
                isOpen={isDeployConfirmationOpen}
                onClose={cancel}
                onConfirm={confirmDeploy}
                rholangCode={pendingTerm}
                phloLimit={phloLimit}
                phloPrice={phloPrice}
                accountName={account?.name || ""}
                accountAddress={account?.address || ""}
                loading={isProcessing}
            />

            <DeploymentConfirmationModal
                isOpen={isExploreConfirmationOpen}
                onClose={cancel}
                onConfirm={confirmExplore}
                rholangCode={pendingTerm}
                phloLimit={phloLimit}
                phloPrice={phloPrice}
                accountName={account?.name || ""}
                accountAddress={account?.address || ""}
                isExplore
                loading={isProcessing}
            />

            <PasswordModal
                isOpen={isPasswordModalOpen}
                onClose={cancel}
                onConfirm={submitPassword}
                title="Enter password to deploy"
                description="Your wallet session has expired. Enter your password to sign and deploy this contract."
                loading={isProcessing}
                error={passwordError}
            />
        </>
    );
};

export const DeployLiteModeWidget = Object.assign(DeployLiteModeWidgetRoot, {
    Actions: DeployLiteModeActions,
    Board: DeployLiteModeBoard,
});
