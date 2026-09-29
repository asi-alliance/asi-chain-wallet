import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useValidAccountUpdating } from "hooks/";
import { importHdWallet } from "store/Auth/thunks";
import { PasswordSetup } from "components/PasswordSetup";
import { MnemonicInput } from "components/MnemonicInput";
import { WordCountToggle, WordCount } from "components/WordCountToggle";
import { Alert, Input, Button, FormActions } from "components";
import { useAppDispatch } from "store/hooks";
import { SdkWalletService } from "sdk";

const FormContainer = styled.div`
    width: 100%;
    max-width: ${({ theme }) => theme.layout.contentNarrow};
    margin: 0 auto;
`;

const FormGroup = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

interface PendingImport {
    name: string;
    mnemonic: string;
}

interface ImportHdWalletFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    hideCancelButton?: boolean;
    customAccountName?: string;
    firstAccount?: boolean;
}

type Step = "form" | "password";

const createEmptyWords = (count: number): string[] =>
    Array.from({ length: count }, () => "");

const clearSecretString = (value: string): string => " ".repeat(value.length);

export const ImportHdWalletForm: React.FC<ImportHdWalletFormProps> = ({
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
    const [importName, setImportName] = useState(customAccountName ?? "");
    const [wordCount, setWordCount] = useState<WordCount>(12);
    const [words, setWords] = useState<string[]>(() => createEmptyWords(12));
    const [importNameError, setImportNameError] = useState("");
    const [mnemonicError, setMnemonicError] = useState("");
    const [formError, setFormError] = useState("");
    const [pendingImport, setPendingImport] = useState<PendingImport | null>(
        null,
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setWords(createEmptyWords(wordCount));
        setMnemonicError("");
        setFormError("");
    }, [wordCount]);

    const updateImportName = (newName: string): void => {
        setImportName(newName);
        updateAccountField("name", newName);
    };

    useEffect(() => {
        if (!customAccountName) {
            return;
        }

        updateImportName(customAccountName);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customAccountName]);

    const handleWordsChange = (nextWords: string[]) => {
        setWords(nextWords);

        if (mnemonicError) {
            setMnemonicError("");
        }
    };

    const clearVisibleSecrets = (): void => {
        setWords((current) => {
            current.forEach(clearSecretString);
            return createEmptyWords(wordCount);
        });
        setPendingImport(null);
    };

    const handleCancel = () => {
        setStep("form");
        updateImportName("");
        clearVisibleSecrets();
        setImportNameError("");
        setMnemonicError("");
        setFormError("");
        onCancel?.();
    };

    const handleImportAccount = () => {
        if (loading || submissionRef.current) {
            return;
        }

        const trimmedName = importName.trim();

        if (!trimmedName) {
            setImportNameError("Account name is required");
            return;
        }

        if (trimmedName.length > 30) {
            setImportNameError("Account name must be 30 characters or less");
            return;
        }

        if (words.some((word) => !word.trim())) {
            setMnemonicError("Please fill in all recovery phrase words");
            return;
        }

        const mnemonic = words.map((word) => word.trim()).join(" ");

        if (!SdkWalletService.isMnemonicValid(mnemonic)) {
            setMnemonicError("Invalid recovery phrase");
            return;
        }

        setImportNameError("");
        setMnemonicError("");
        setFormError("");
        setPendingImport({ name: trimmedName, mnemonic });
        setStep("password");
    };

    const handlePasswordSet = async (password: string) => {
        if (!pendingImport || loading || submissionRef.current) {
            return;
        }

        submissionRef.current = true;
        setLoading(true);
        setFormError("");

        try {
            await dispatch(
                importHdWallet({
                    name: pendingImport.name,
                    mnemonic: pendingImport.mnemonic,
                    password,
                }),
            ).unwrap();

            onSuccess?.();
            handleCancel();
        } catch (error) {
            setFormError(
                (error as Error)?.message || "Failed to import wallet",
            );
            setStep("password");
        } finally {
            setLoading(false);
            submissionRef.current = false;
        }
    };

    if (step === "password") {
        return (
            <PasswordSetup
                title="Set Password for Imported Wallet"
                loading={loading}
                error={formError}
                onPasswordSet={handlePasswordSet}
                onCancel={() => {
                    setFormError("");
                    setPendingImport(null);
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

            <FormGroup>
                <Input
                    id="import-account-name-input"
                    label="Account Name"
                    value={importName}
                    onChange={(event) => {
                        updateImportName(event.target.value);
                        if (importNameError) {
                            setImportNameError("");
                        }
                    }}
                    placeholder="Enter account name (max 30 characters)"
                    error={importNameError || nameErrorMessage}
                    maxLength={30}
                    readOnly={!!customAccountName}
                    disabled={loading}
                    autoComplete="off"
                />
            </FormGroup>

            <FormGroup>
                <WordCountToggle
                    value={wordCount}
                    onChange={setWordCount}
                    disabled={loading}
                    label="Recovery phrase"
                />
                <MnemonicInput
                    words={words}
                    wordCount={wordCount}
                    onWordsChange={handleWordsChange}
                    error={mnemonicError}
                    disabled={loading}
                />
            </FormGroup>

            <FormActions>
                <Button
                    id="import-account-button"
                    variant="primary"
                    onClick={handleImportAccount}
                    disabled={
                        !importName.trim() ||
                        loading ||
                        !isNameUpdateValid ||
                        words.some((word) => !word.trim())
                    }
                    loading={loading}
                    fullWidth
                >
                    Import Wallet
                </Button>
                {!hideCancelButton && (
                    <Button
                        variant="secondary"
                        onClick={handleCancel}
                        disabled={loading}
                        fullWidth
                    >
                        Cancel
                    </Button>
                )}
            </FormActions>
        </FormContainer>
    );
};
