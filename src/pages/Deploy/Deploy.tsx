import React, { useLayoutEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { DEFAULT_PHLO_PRICE, isIntegerInRange } from "@asichain/asi-wallet-sdk";
import { RootState } from "store";
import {
    selectAccountById,
    selectSelectedAccountId,
} from "store/WalletsStore";
import { selectIsNetworkOperationPending } from "store/networkOperationSlice";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
} from "components";
import { Select } from "components/Select";
import { ISelectOption } from "components/Select/Select";
import { DeployLiteModeWidget } from "components/DeployLiteModeWidget";
import { DeployProModeWidget } from "components/DeployProModeWidget";
import { useScreen } from "hooks/";

const DeployContainer = styled.div`
    width: 100%;
`;

const ModePanel = styled.div<{ $active: boolean }>`
    display: ${({ $active }) => ($active ? "block" : "none")};
`;

const DeployHeader = styled.div`
    display: flex;
    align-items: end;
    width: 100%;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing["3xl"]};
    margin-bottom: ${({ theme }) => theme.spacing["4xl"]};

    @media (max-width: ${({ theme }) => theme.breakpoints.laptop}) {
        align-items: stretch;
    }
`;

const FormGroup = styled.div`
    min-width: 200px;

    @media (max-width: 1024px) {
        width: 100%;
    }
`;

const FormRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.xl};
    align-items: end;

    @media (max-width: ${({ theme }) => theme.breakpoints.laptop}) {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
    }
`;

const Label = styled.label`
    display: block;
    margin-bottom: ${({ theme }) => theme.control.labelGap};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: 500;
    color: ${({ theme }) => theme.text.primary};
`;

enum DeployPageMods {
    LITE = "lite",
    PRO = "pro",
}

const DEFAULT_PHLO_LIMIT = "100000000";

const deployPageModsOptions: ISelectOption[] = [
    {
        id: DeployPageMods.LITE,
        value: DeployPageMods.LITE,
        label: "Lite mode",
    },
    {
        id: DeployPageMods.PRO,
        value: DeployPageMods.PRO,
        label: "Pro mode",
    },
];

type TDeployModeWidget = React.FC<{
    phloLimit: string;
    phloPrice: string;
    isActive?: boolean;
    children: React.ReactNode;
}> & {
    Actions: React.FC;
    Board: React.FC;
};

const deployWidgetsByMode: Record<DeployPageMods, TDeployModeWidget> = {
    [DeployPageMods.LITE]: DeployLiteModeWidget,
    [DeployPageMods.PRO]: DeployProModeWidget,
};

export const Deploy: React.FC = () => {
    const navigate = useNavigate();
    const selectedAccountId = useSelector(selectSelectedAccountId);
    const selectedAccount = useSelector((state: RootState) =>
        selectedAccountId ? selectAccountById(state, selectedAccountId) : null,
    );
    const isChainOperationPending = useSelector(selectIsNetworkOperationPending);
    const { isTablet } = useScreen();

    const [selectedMode, setSelectedMode] = useState<DeployPageMods>(
        DeployPageMods.LITE,
    );
    const [hasOpenedPro, setHasOpenedPro] = useState(false);
    const [phloLimit, setPhloLimit] = useState(DEFAULT_PHLO_LIMIT);
    const modeFocusPendingRef = useRef(false);

    useLayoutEffect(() => {
        if (!modeFocusPendingRef.current) return;
        modeFocusPendingRef.current = false;
        document.getElementById(`deploy-mode-selector-${selectedMode}-button`)?.focus();
    }, [selectedMode]);

    const phloPrice = DEFAULT_PHLO_PRICE.toString();

    const numericPhloLimit = Number(phloLimit.trim());
    const phloLimitError = isIntegerInRange(
        numericPhloLimit,
        1,
        Number.MAX_SAFE_INTEGER,
    )
        ? undefined
        : "Enter a whole Phlo Limit greater than zero.";

    const changeMode = (mode: string): void => {
        if (isChainOperationPending || mode === selectedMode) return;
        modeFocusPendingRef.current = true;
        if (mode === DeployPageMods.PRO) setHasOpenedPro(true);
        setSelectedMode(mode as DeployPageMods);
    };

    if (!selectedAccount) {
        return (
            <DeployContainer>
                <Card>
                    <CardContent>
                        <p>Please select an account first.</p>
                        <Button onClick={() => navigate("/accounts")}>
                            Select Account
                        </Button>
                    </CardContent>
                </Card>
            </DeployContainer>
        );
    }

    return (
        <DeployContainer className="deploy-container">
            {Object.entries(deployWidgetsByMode)
                .filter(([mode]) => mode === DeployPageMods.LITE || hasOpenedPro)
                .map(([mode, ModeWidget]) => (
                    <ModePanel
                        key={mode}
                        $active={selectedMode === mode}
                        aria-hidden={selectedMode !== mode}
                    >
                        <ModeWidget
                            phloLimit={phloLimit}
                            phloPrice={phloPrice}
                            isActive={selectedMode === mode}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Deploy Rholang Contract</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <DeployHeader>
                                        <FormRow>
                                            <FormGroup>
                                                <Label id={`deploy-mode-selector-label-${mode}`}>
                                                    Mode
                                                </Label>
                                                <Select
                                                    id={`deploy-mode-selector-${mode}`}
                                                    aria-labelledby={`deploy-mode-selector-label-${mode}`}
                                                    value={selectedMode}
                                                    onChange={changeMode}
                                                    disabled={isChainOperationPending}
                                                    placeholder="Select mode"
                                                    options={deployPageModsOptions}
                                                />
                                            </FormGroup>
                                            <Input
                                                id={mode === DeployPageMods.LITE ? "deploy-phlo-limit-input" : "deploy-phlo-limit-input-pro"}
                                                className="deploy-phlo-limit-input text-3"
                                                wrapperStyle={{ marginBottom: 0, minWidth: "200px" }}
                                                label="Phlo Limit"
                                                value={phloLimit}
                                                error={phloLimitError}
                                                fullWidth={isTablet}
                                                onChange={(event) => setPhloLimit(event.target.value)}
                                                type="number"
                                            />
                                            <Input
                                                id={mode === DeployPageMods.LITE ? "deploy-phlo-price-input" : "deploy-phlo-price-input-pro"}
                                                className="deploy-phlo-price-input text-3"
                                                wrapperStyle={{ marginBottom: 0, minWidth: "200px" }}
                                                label="Phlo Price"
                                                title="Phlo price is fixed by the network configuration"
                                                value={phloPrice}
                                                fullWidth={isTablet}
                                                type="number"
                                                readOnly
                                            />
                                        </FormRow>
                                        <ModeWidget.Actions />
                                    </DeployHeader>
                                    <ModeWidget.Board />
                                </CardContent>
                            </Card>
                        </ModeWidget>
                    </ModePanel>
                ))}
        </DeployContainer>
    );
};
