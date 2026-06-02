import React, { useState } from "react";
import styled from "styled-components";
import { Card, CardHeader, CardTitle, CardContent } from "components";
import { CreateAccountForm } from "components/CreateAccountForm";
import { ImportAccountForm } from "components/ImportAccountForm";

const WidgetContainer = styled.div`
    width: 100%;
    max-width: 705px;
    margin: 0 auto;
`;

const TabContainer = styled.div`
    display: flex;
    gap: 0;
    margin-bottom: 24px;
    border-bottom: 2px solid ${({ theme }) => theme.border};
`;

const TabButton = styled.button<{ active: boolean }>`
    padding: 12px 24px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    font-weight: ${({ active }) => (active ? "600" : "400")};
    color: ${({ active, theme }) =>
        active ? theme.primary : theme.text.secondary};
    position: relative;
    transition: all 0.2s ease;

    &:hover {
        color: ${({ theme }) => theme.primary};
    }

    ${({ active, theme }) =>
        active &&
        `
        &::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            right: 0;
            height: 2px;
            background: ${theme.primary};
        }
    `}
`;

const FormContainer = styled.div`
    padding: 0;
`;

interface FirstAccountCreatingWidgetProps {
    onSuccess?: () => void;
}

type FormMode = "create" | "import";

export const FirstAccountCreatingWidget: React.FC<
    FirstAccountCreatingWidgetProps
> = ({ onSuccess }) => {
    const [activeMode, setActiveMode] = useState<FormMode>("create");

    const handleCreateSuccess = () => {
        onSuccess?.();
    };

    const handleImportSuccess = () => {
        onSuccess?.();
    };

    return (
        <WidgetContainer>
            <Card>
                <CardHeader>
                    <CardTitle>
                        <h1>Welcome!</h1>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <TabContainer>
                        <TabButton
                            active={activeMode === "create"}
                            onClick={() => setActiveMode("create")}
                        >
                            Create Account
                        </TabButton>
                        <TabButton
                            active={activeMode === "import"}
                            onClick={() => setActiveMode("import")}
                        >
                            Import Account
                        </TabButton>
                    </TabContainer>

                    <FormContainer>
                        {activeMode === "create" ? (
                            <CreateAccountForm
                                onSuccess={handleCreateSuccess}
                                hideCancelButton
                            />
                        ) : (
                            <ImportAccountForm
                                onSuccess={handleImportSuccess}
                                hideCancelButton
                            />
                        )}
                    </FormContainer>
                </CardContent>
            </Card>
        </WidgetContainer>
    );
};
