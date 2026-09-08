import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useScreen, useValidAccountUpdating } from "hooks/";
import { importHdWallet } from "store/Auth/thunks";
import { PasswordSetup } from "components/PasswordSetup";
import { MnemonicInput } from "components/MnemonicInput";
import { WordCountToggle, WordCount } from "components/WordCountToggle";
import { Input, Button } from "components";
import { useAppDispatch } from "store/hooks";
import { SdkWalletService } from "sdk";

const FormGroup = styled.div`
    margin-bottom: 16px;
`;

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

export const ImportHdWalletForm: React.FC<ImportHdWalletFormProps> = ({
    onSuccess,
    onCancel,
    hideCancelButton = false,
    customAccountName,
    firstAccount = false,
}) => {
    const dispatch = useAppDispatch();
    const { isLaptop } = useScreen();

    const { isNameUpdateValid, nameErrorMessage, updateAccountField } =
        useValidAccountUpdating(undefined, { firstAccount });

    const [step, setStep] = useState<Step>("form");
    const [importName, setImportName] = useState(customAccountName ?? "");
    const [wordCount, setWordCount] = useState<WordCount>(12);
    const [words, setWords] = useState<string[]>(() => createEmptyWords(12));
    const [importNameError, setImportNameError] = useState("");
    const [mnemonicError, setMnemonicError] = useState("");
    const [pendingImport, setPendingImport] = useState<PendingImport | null>(
        null,
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setWords(createEmptyWords(wordCount));
        setMnemonicError("");
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
    }, [customAccountName]);

    const handleWordsChange = (nextWords: string[]) => {
        setWords(nextWords);

        if (mnemonicError) {
            setMnemonicError("");
        }
    };

    const handleCancel = () => {
        setStep("form");
        updateImportName("");
        setWords(createEmptyWords(wordCount));
        setImportNameError("");
        setMnemonicError("");
        setPendingImport(null);
        onCancel?.();
    };

    const handleImportAccount = () => {
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

        setPendingImport({ name: trimmedName, mnemonic });
        setStep("password");
    };

    const handlePasswordSet = async (password: string) => {
        if (!pendingImport) return;

        setLoading(true);

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
            setMnemonicError(
                (error as Error)?.message || "Failed to import wallet",
            );
            setStep("form");
        } finally {
            setLoading(false);
        }
    };

    if (step === "password") {
        return (
            <PasswordSetup
                title="Set Password for Imported Wallet"
                loading={loading}
                onPasswordSet={handlePasswordSet}
                onCancel={() => {
                    setStep("form");
                    setPendingImport(null);
                }}
            />
        );
    }

    return (
        <>
            <FormGroup>
                <Input
                    id="import-account-name-input"
                    label="Account Name"
                    value={importName}
                    onChange={(e) => {
                        updateImportName(e.target.value);
                        if (importNameError) {
                            setImportNameError("");
                        }
                    }}
                    placeholder="Enter account name (max 30 characters)"
                    error={importNameError || nameErrorMessage}
                    maxLength={30}
                    readOnly={!!customAccountName}
                    disabled={loading}
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

            <ActionButtons>
                <AdaptiveButton
                    id="import-account-button"
                    variant="primary"
                    onClick={handleImportAccount}
                    disabled={
                        !importName.trim() ||
                        loading ||
                        !isNameUpdateValid ||
                        words.some((word) => !word.trim())
                    }
                    fullWidth={isLaptop}
                    loading={loading}
                    style={{
                        flexWrap: "nowrap",
                        whiteSpace: "nowrap",
                        ...(isLaptop && {
                            marginBottom: "16px",
                        }),
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
                </AdaptiveButton>
                {!hideCancelButton && (
                    <AdaptiveButton
                        variant="secondary"
                        onClick={handleCancel}
                        disabled={loading}
                        fullWidth={isLaptop}
                        style={{
                            flexWrap: "nowrap",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Cancel
                    </AdaptiveButton>
                )}
            </ActionButtons>
        </>
    );
};
