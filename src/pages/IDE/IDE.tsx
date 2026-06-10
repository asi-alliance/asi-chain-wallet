import React, { useState } from "react";
import styled from "styled-components";
import { DeployProModeWidget } from "components/DeployProModeWidget";

const IDEPage = styled.div``;

const IDEToolbar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 16px;
`;

const PhloSettings = styled.div`
    display: flex;
    gap: 16px;
    align-items: center;
`;

const SettingLabel = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.text.secondary};
`;

const SettingInput = styled.input`
    width: 80px;
    padding: 4px 8px;
    background: ${({ theme }) => theme.card};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 4px;
    color: ${({ theme }) => theme.text.primary};
    font-size: 14px;
`;

export const IDE: React.FC = () => {
    const [phloLimit, setPhloLimit] = useState("100000000");
    const [phloPrice, setPhloPrice] = useState("1");

    return (
        <IDEPage>
            <DeployProModeWidget phloLimit={phloLimit} phloPrice={phloPrice}>
                <IDEToolbar>
                    <DeployProModeWidget.Actions />
                    <PhloSettings>
                        <SettingLabel>
                            <h4>Phlo Limit:</h4>
                            <SettingInput
                                id="ide-phlo-limit-input"
                                type="number"
                                value={phloLimit}
                                onChange={(e) => setPhloLimit(e.target.value)}
                            />
                        </SettingLabel>
                        <SettingLabel>
                            <h4>Phlo Price:</h4>
                            <SettingInput
                                id="ide-phlo-price-input"
                                type="number"
                                value={phloPrice}
                                onChange={(e) => setPhloPrice(e.target.value)}
                            />
                        </SettingLabel>
                    </PhloSettings>
                </IDEToolbar>
                <DeployProModeWidget.Board />
            </DeployProModeWidget>
        </IDEPage>
    );
};
