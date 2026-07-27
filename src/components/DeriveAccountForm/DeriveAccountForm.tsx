import React, { useState } from "react";
import styled from "styled-components";
import { Input, Button } from "components";
import { PasswordSetup } from "components/PasswordSetup";
import { deriveHdAccount } from "store/Auth/thunks";
import { useAppDispatch } from "store/hooks";
import { useScreen, useValidAccountUpdating } from "hooks";

const ActionButtons = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;

    @media (max-width: 768px) {
        display: block;
        padding: 0 2rem;
    }
`;

const AdaptiveButton = styled(Button)`
    min-width: 242px;

    @media (max-width: 768px) {
        min-width: auto;
    }
`;

const FormContainer = styled.div`
    width: 100%;
`;

interface DeriveAccountFormProps {
    onSuccess?: (accountName: string) => void;
    onCancel?: () => void;
    hideCancelButton?: boolean;
}

type Step = "form" | "password";

export const DeriveAccountForm: React.FC<DeriveAccountFormProps> = ({
    onSuccess,
    onCancel,
    hideCancelButton = false,
}) => {
    const dispatch = useAppDispatch();

    const { isLaptop } = useScreen();

    const { isNameUpdateValid, nameErrorMessage, updateAccountField } =
        useValidAccountUpdating();

    const [step, setStep] = useState<Step>("form");
    const [accountName, setAccountName] = useState("");
    const [accountNameError, setAccountNameError] = useState("");
    const [pendingAccountName, setPendingAccountName] = useState("");
    const [loading, setLoading] = useState(false);

    const updateAccountName = (newName: string): void => {
        setAccountName(newName);
        updateAccountField("name", newName);
    };

    const handleFormSubmit = () => {
        const trimmedName = accountName.trim();

        if (!trimmedName) {
            setAccountNameError("Account name is required");
            return;
        }

        if (trimmedName.length > 30) {
            setAccountNameError("Account name must be 30 characters or less");
            return;
        }

        setAccountNameError("");
        setPendingAccountName(trimmedName);
        setStep("password");
    };

    const handlePasswordSet = async (password: string) => {
        setLoading(true);

        try {
            await dispatch(
                deriveHdAccount({ name: pendingAccountName, password }),
            ).unwrap();

            onSuccess?.(pendingAccountName);
            handleCancel();
        } catch (error) {
            setAccountNameError(
                (error as Error)?.message || "Failed to create account",
            );
            setStep("form");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setStep("form");
        updateAccountName("");
        setAccountNameError("");
        setPendingAccountName("");
        onCancel?.();
    };

    if (step === "password") {
        return (
            <PasswordSetup
                title="Enter password to add account"
                onPasswordSet={handlePasswordSet}
                onCancel={() => setStep("form")}
            />
        );
    }

    return (
        <FormContainer>
            <Input
                id="create-account-name-input"
                label="Account Name"
                value={accountName}
                onChange={(event) => {
                    updateAccountName(event.target.value);

                    if (accountNameError) {
                        setAccountNameError("");
                    }
                }}
                placeholder="Enter account name (max 30 characters)"
                error={accountNameError || nameErrorMessage}
                maxLength={30}
                disabled={loading}
            />

            <ActionButtons>
                <AdaptiveButton
                    id="create-account-button"
                    onClick={handleFormSubmit}
                    disabled={
                        !accountName.trim() || loading || !isNameUpdateValid
                    }
                    fullWidth={isLaptop}
                    loading={loading}
                    style={{
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
                </AdaptiveButton>
                {!hideCancelButton && (
                    <Button
                        variant="secondary"
                        onClick={handleCancel}
                        disabled={loading}
                        fullWidth={isLaptop}
                    >
                        Cancel
                    </Button>
                )}
            </ActionButtons>
        </FormContainer>
    );
};
