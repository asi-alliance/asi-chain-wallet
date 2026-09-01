import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { MnemonicStrength } from "@asichain/asi-wallet-sdk";
import { Input } from "components";
import { PasswordSetup } from "components/PasswordSetup";
import { MnemonicDisplay } from "components/MnemonicDisplay";
import { WordCountToggle, WordCount } from "components/WordCountToggle";
import { createHdWallet } from "store/Auth/thunks";
import { useAppDispatch } from "store/hooks";
import { useValidAccountUpdating } from "hooks";
import { SdkWalletService } from "sdk";

const FormContainer = styled.div`
    width: 100%;
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

export const CreateHdWalletForm: React.FC<CreateHdWalletFormProps> = ({
    onSuccess,
    onCancel,
    hideCancelButton = false,
    customAccountName,
    firstAccount = false,
}) => {
    const dispatch = useAppDispatch();

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
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setMnemonic(
            SdkWalletService.generateMnemonic(strengthFromWordCount(wordCount)),
        );
    }, [wordCount]);

    const updateAccountName = (newName: string): void => {
        setAccountName(newName);
        updateAccountField("name", newName);
    };

    const handleProceed = () => {
        const trimmedName = (customAccountName ?? accountName).trim();

        if (!trimmedName) {
            setAccountNameError("Account name is required");
            return;
        }

        if (trimmedName.length > 30) {
            setAccountNameError("Account name must be 30 characters or less");
            return;
        }

        if (!customAccountName && !isNameUpdateValid) {
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
                createHdWallet({
                    name: pendingAccountName,
                    mnemonic,
                    password,
                }),
            ).unwrap();

            onSuccess?.(pendingAccountName);
        } catch (error) {
            setAccountNameError(
                (error as Error)?.message || "Failed to create wallet",
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
                title="Set Password for New Wallet"
                onPasswordSet={handlePasswordSet}
                onCancel={() => setStep("form")}
            />
        );
    }

    return (
        <FormContainer>
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
                onContinue={handleProceed}
                onBack={handleCancel}
                showBackButton={!hideCancelButton}
            />
        </FormContainer>
    );
};
