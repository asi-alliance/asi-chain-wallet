import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { getErrorMessage, MnemonicStrength } from "@asichain/asi-wallet-sdk";
import { Alert, Input } from "components";
import { PasswordSetup } from "components/PasswordSetup";
import { MnemonicDisplay } from "components/MnemonicDisplay";
import { WordCountToggle, WordCount } from "components/WordCountToggle";
import { createHdWallet } from "store/Auth/thunks";
import { useAppDispatch } from "store/hooks";
import { useValidAccountUpdating } from "hooks";
import { SdkWalletService } from "sdk";

const FormContainer = styled.div`
    width: 100%;
    max-width: ${({ theme }) => theme.layout.contentNarrow};
    margin: 0 auto;
`;

interface CreateHdWalletFormProps {
    onSuccess?: (accountName: string) => void;
    onCancel?: () => void;
    hideCancelButton?: boolean;
    customAccountName?: string;
    firstAccount?: boolean;
}

type Step = "form" | "password";

const strengthFromWordCount = (wordCount: WordCount): MnemonicStrength =>
    wordCount === 24
        ? MnemonicStrength.TWENTY_FOUR_WORDS
        : MnemonicStrength.TWELVE_WORDS;

const clearSecretString = (value: string): string => " ".repeat(value.length);

export const CreateHdWalletForm: React.FC<CreateHdWalletFormProps> = ({
    onSuccess,
    onCancel,
    hideCancelButton = false,
    customAccountName,
    firstAccount = false,
}) => {
    const dispatch = useAppDispatch();
    const submissionRef = useRef(false);

    const { isNameUpdateValid, nameErrorMessage, updateAccountField } =
        useValidAccountUpdating(undefined, { firstAccount });

    const [step, setStep] = useState<Step>("form");
    const [accountName, setAccountName] = useState(customAccountName ?? "");
    const [accountNameError, setAccountNameError] = useState("");
    const [wordCount, setWordCount] = useState<WordCount>(12);
    const [pendingAccountName, setPendingAccountName] = useState(
        customAccountName ?? "",
    );
    const [mnemonic, setMnemonic] = useState("");
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        try {
            setMnemonic(
                SdkWalletService.generateMnemonic(
                    strengthFromWordCount(wordCount),
                ),
            );
            setFormError("");
        } catch {
            setMnemonic("");
            setFormError("Failed to generate recovery phrase");
        }
    }, [wordCount]);

    const updateAccountName = (newName: string): void => {
        setAccountName(newName);
        updateAccountField("name", newName);
    };

    const clearVisibleSecrets = (): void => {
        setMnemonic((current) => clearSecretString(current));
        setMnemonic("");
        setPendingAccountName("");
    };

    const handleProceedFromDisplay = () => {
        const trimmedName = (customAccountName ?? accountName).trim();

        if (!trimmedName) {
            setAccountNameError("Account name is required");
            return;
        }

        if (trimmedName.length > 30) {
            setAccountNameError("Account name must be 30 characters or less");
            return;
        }

        if (!mnemonic.trim()) {
            setFormError("Failed to generate recovery phrase");
            return;
        }

        if (!customAccountName && !isNameUpdateValid) {
            return;
        }

        setAccountNameError("");
        setFormError("");
        setPendingAccountName(trimmedName);
        setStep("password");
    };

    const handlePasswordSet = async (password: string) => {
        if (loading || submissionRef.current) {
            return;
        }

        submissionRef.current = true;
        setLoading(true);
        setFormError("");

        try {
            await dispatch(
                createHdWallet({
                    name: pendingAccountName,
                    mnemonic,
                    password,
                }),
            ).unwrap();

            clearVisibleSecrets();
            onSuccess?.(pendingAccountName);
        } catch (error) {
            setFormError(
                getErrorMessage(error, "Failed to create wallet"),
            );
            // Keep the same mnemonic for retry — do not return to form
            // where word-count changes would regenerate the phrase.
            setStep("password");
        } finally {
            setLoading(false);
            submissionRef.current = false;
        }
    };

    const handleCancel = () => {
        clearVisibleSecrets();
        setStep("form");
        updateAccountName("");
        setAccountNameError("");
        setFormError("");
        onCancel?.();
    };

    if (step === "password") {
        return (
            <PasswordSetup
                title="Set Password for New Wallet"
                loading={loading}
                error={formError}
                onPasswordSet={handlePasswordSet}
                onCancel={() => {
                    setFormError("");
                    setStep("form");
                }}
            />
        );
    }

    return (
        <FormContainer>
            {formError && (
                <Alert
                    tone="danger"
                    icon="⚠️"
                    style={{ marginBottom: "16px" }}
                >
                    {formError}
                </Alert>
            )}

            {!customAccountName && (
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
                    autoComplete="off"
                    wrapperStyle={{ marginBottom: "24px" }}
                />
            )}

            <WordCountToggle
                value={wordCount}
                onChange={setWordCount}
                disabled={loading}
            />

            <MnemonicDisplay
                mnemonic={mnemonic}
                accountName={customAccountName ?? accountName}
                onContinue={handleProceedFromDisplay}
                onBack={handleCancel}
                showBackButton={!hideCancelButton}
            />
        </FormContainer>
    );
};
