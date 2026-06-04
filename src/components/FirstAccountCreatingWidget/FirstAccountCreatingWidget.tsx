import React, { useState } from "react";
import styled from "styled-components";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Input,
    Button,
} from "components";
import { CreateAccountForm } from "components/CreateAccountForm";
import { ImportAccountForm } from "components/ImportAccountForm";
import { DefaultTheme } from "styled-components/dist/types";
import { useScreen } from "hooks/";

const WidgetContainer = styled.div`
    width: 100%;
    max-width: 705px;
    margin: 0 auto;
`;

const FormContainer = styled.div`
    padding: 0;
`;

interface FirstAccountCreatingWidgetProps {
    onSuccess?: () => void;
}

type FormMode = "create" | "import";

const ActionsToolbar = styled.div`
    display: flex;
    padding: 0 5rem;
    justify-content: center;
    align-items: center;
    gap: 16px;

    @media (max-width: 768px) {
        display: block;
        padding: 0 2rem;
    }
`;

export const FirstAccountCreatingWidget: React.FC<
    FirstAccountCreatingWidgetProps
> = ({ onSuccess }) => {
    const { isLaptop } = useScreen();

    const [activeMode, setActiveMode] = useState<FormMode | null>(null);
    const [accountName, setAccountName] = useState("");

    const handleCreateSuccess = () => {
        onSuccess?.();
    };

    const handleImportSuccess = () => {
        onSuccess?.();
    };

    if (!activeMode) {
        return (
            <WidgetContainer>
                <Card>
                    <CardHeader style={{ marginBottom: "36px" }}>
                        <CardTitle>
                            <h1>Welcome!</h1>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormContainer>
                            <Input
                                id="create-account-name-input"
                                label="Account Name"
                                value={accountName}
                                onChange={(e) => {
                                    setAccountName(e.target.value);
                                }}
                                labelColorSelector={(theme: DefaultTheme) =>
                                    theme.textSecondary
                                }
                                labelStyle={{
                                    fontWeight: "500",
                                }}
                                wrapperStyle={{
                                    marginBottom: "36px",
                                }}
                                placeholder="Enter account name (max 30 characters)"
                                maxLength={30}
                            />
                            <ActionsToolbar>
                                <Button
                                    id="create-account-button"
                                    onClick={() => setActiveMode("create")}
                                    disabled={!accountName.trim()}
                                    fullWidth={true}
                                    style={{
                                        flexWrap: "nowrap",
                                        whiteSpace: "nowrap",
                                        ...(isLaptop && {
                                            marginBottom: "16px",
                                        }),
                                    }}
                                >
                                    <h3>Create Account</h3>
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
                                </Button>
                                <Button
                                    id="import-account-button"
                                    variant="secondary"
                                    onClick={() => setActiveMode("import")}
                                    disabled={!accountName.trim()}
                                    fullWidth={true}
                                    style={{
                                        flexWrap: "nowrap",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    <h3>Import Account</h3>
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
                                </Button>
                            </ActionsToolbar>
                        </FormContainer>
                    </CardContent>
                </Card>
            </WidgetContainer>
        );
    }

    return (
        <WidgetContainer>
            <Card>
                <CardHeader>
                    <CardTitle>
                        {activeMode === "create" && "Create account"}
                        {activeMode === "import" && "Import account"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <FormContainer>
                        {activeMode === "create" ? (
                            <CreateAccountForm
                                onSuccess={handleCreateSuccess}
                                onCancel={() => setActiveMode(null)}
                                hideCancelButton
                                customAccountName={accountName}
                            />
                        ) : (
                            <ImportAccountForm
                                onSuccess={handleImportSuccess}
                                onCancel={() => setActiveMode(null)}
                                customAccountName={accountName}
                            />
                        )}
                    </FormContainer>
                </CardContent>
            </Card>
        </WidgetContainer>
    );
};
