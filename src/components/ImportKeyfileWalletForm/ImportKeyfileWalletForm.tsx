import React, { useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
    CustomErrorCode,
    IKeyfileImportAccountPreview,
    IKeyfileImportPreview,
    KeyfileImportAccountStatus,
    WalletTypes,
} from "@asichain/asi-wallet-sdk";
import {
    Alert,
    Button,
    Checkbox,
    FileSelector,
    FormActions,
    PasswordInput,
} from "components";
import { useAppDispatch } from "store/hooks";
import { SdkWalletService } from "sdk";
import { importKeyfileWallet } from "store/Auth/thunks";
import { importKeyfileAccounts } from "store/WalletsStore/thunks";

const FormContainer = styled.div`
    width: 100%;
    max-width: ${({ theme }) => theme.layout.contentNarrow};
    margin: 0 auto;
`;

const FormGroup = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const FieldLabel = styled.label`
    display: block;
    margin-bottom: ${({ theme }) => theme.control.labelGap};
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
`;

const Notice = styled(Alert)`
    margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const AccountsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.md};
    max-height: 280px;
    overflow-y: auto;
`;

const AccountRow = styled.label<{ $disabled: boolean }>`
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.lg};
    padding: ${({ theme }) => theme.spacing.lg}
        ${({ theme }) => theme.spacing.xl};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.surface};
    cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
    opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

const AccountInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.sm};
    min-width: 0;
`;

const AccountName = styled.span`
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
`;

const AccountAddress = styled.span`
    color: ${({ theme }) => theme.text.secondary};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
    word-break: break-all;
`;

const Badge = styled.span`
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.xs};
    text-transform: uppercase;
    white-space: nowrap;
`;

const WALLET_TYPE_LABEL: Record<WalletTypes, string> = {
    [WalletTypes.PRIVATE_KEY]: "Private Key",
    [WalletTypes.HD]: "Mnemonic",
};

interface ISelectedKeyfile {
    name: string;
    content: string;
    walletType: WalletTypes;
}

const readKeyfileWalletType = (content: string): WalletTypes | null => {
    let parsed: unknown;

    try {
        parsed = JSON.parse(content);
    } catch {
        return null;
    }

    if (typeof parsed !== "object" || parsed === null) {
        return null;
    }

    const { walletType } = parsed as { walletType?: WalletTypes };

    if (!walletType || !(walletType in WALLET_TYPE_LABEL)) {
        return null;
    }

    return walletType;
};

const getSelectableIndexes = (preview: IKeyfileImportPreview): number[] =>
    preview.accounts
        .filter(
            (account: IKeyfileImportAccountPreview) =>
                account.status === KeyfileImportAccountStatus.NEW,
        )
        .map((account: IKeyfileImportAccountPreview) => account.index)
        .filter((index: number | null): index is number => index !== null);

const hasImportableAccounts = (preview: IKeyfileImportPreview): boolean =>
    preview.accounts.some(
        (account: IKeyfileImportAccountPreview) =>
            account.status === KeyfileImportAccountStatus.NEW,
    );

const getErrorCode = (error: unknown): string | undefined => {
    if (typeof error !== "object" || error === null) {
        return undefined;
    }

    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        typeof (error as { message?: unknown }).message === "string"
    ) {
        return (error as { message: string }).message;
    }

    return fallback;
};

export interface IKeyfileAccountsImportOutcome {
    signerId: string;
    importedAccountsCount: number;
}

interface ImportKeyfileWalletFormProps {
    onWalletImported?: () => void;
    onAccountsImported?: (outcome: IKeyfileAccountsImportOutcome) => void;
    onCancel?: () => void;
}

export const ImportKeyfileWalletForm: React.FC<
    ImportKeyfileWalletFormProps
> = ({ onWalletImported, onAccountsImported, onCancel }) => {
    const dispatch = useAppDispatch();
    const submissionRef = useRef(false);

    const [selectedKeyfile, setSelectedKeyfile] =
        useState<ISelectedKeyfile | null>(null);
    const [password, setPassword] = useState("");
    const [preview, setPreview] = useState<IKeyfileImportPreview | null>(null);
    const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [fileError, setFileError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [formError, setFormError] = useState("");

    const sortedAccounts = useMemo<IKeyfileImportAccountPreview[]>(() => {
        if (!preview) {
            return [];
        }

        return [...preview.accounts].sort(
            (
                left: IKeyfileImportAccountPreview,
                right: IKeyfileImportAccountPreview,
            ) =>
                (left.index ?? Number.MAX_SAFE_INTEGER) -
                (right.index ?? Number.MAX_SAFE_INTEGER),
        );
    }, [preview]);

    const clearSensitiveState = (): void => {
        setPassword((current) => " ".repeat(current.length));
        setPassword("");
        setSelectedKeyfile(null);
        setPreview(null);
        setSelectedIndexes([]);
    };

    const handleKeyfileSelect = async (file: File | null): Promise<void> => {
        setFileError("");
        setPasswordError("");
        setFormError("");
        setSelectedKeyfile(null);
        setPreview(null);
        setSelectedIndexes([]);

        if (!file) {
            return;
        }

        let content: string;

        try {
            content = await file.text();
        } catch {
            setFileError("Keyfile cannot be read.");
            return;
        }

        const walletType = readKeyfileWalletType(content);

        if (!walletType) {
            setFileError("Selected file is not an ASI wallet keyfile.");
            return;
        }

        setSelectedKeyfile({ name: file.name, content, walletType });
    };

    const handlePreview = async (): Promise<void> => {
        if (loading || submissionRef.current) {
            return;
        }

        if (!selectedKeyfile) {
            setFileError("Please select a keyfile first.");
            return;
        }

        if (!password) {
            setPasswordError("Password is required");
            return;
        }

        submissionRef.current = true;
        setLoading(true);
        setFileError("");
        setPasswordError("");
        setFormError("");

        try {
            const keyfilePreview =
                await SdkWalletService.previewWalletKeyfileImport(
                    selectedKeyfile.content,
                    password,
                );

            setPreview(keyfilePreview);
            setSelectedIndexes(getSelectableIndexes(keyfilePreview));
        } catch (previewError: unknown) {
            const code = getErrorCode(previewError);
            const message = getErrorMessage(
                previewError,
                "Keyfile cannot be read.",
            );

            if (
                code === CustomErrorCode.INVALID_KEYFILE_PASSWORD ||
                code === CustomErrorCode.INVALID_PASSWORD
            ) {
                setPasswordError(message);
            } else if (
                code === CustomErrorCode.INVALID_KEYFILE ||
                code === CustomErrorCode.CORRUPTED_DATA
            ) {
                setFileError(message);
            } else {
                setFormError(message);
            }
        } finally {
            setLoading(false);
            submissionRef.current = false;
        }
    };

    const toggleAccount = (index: number): void => {
        setFormError("");
        setSelectedIndexes((currentIndexes: number[]) =>
            currentIndexes.includes(index)
                ? currentIndexes.filter(
                      (selectedIndex: number) => selectedIndex !== index,
                  )
                : [...currentIndexes, index],
        );
    };

    const backToKeyfileStep = (): void => {
        setFormError("");
        setPreview(null);
        setSelectedIndexes([]);
    };

    const handleImport = async (): Promise<void> => {
        if (!selectedKeyfile || !preview || loading || submissionRef.current) {
            return;
        }

        const isHdWallet = preview.walletType === WalletTypes.HD;

        if (isHdWallet && !selectedIndexes.length) {
            setFormError("Please select at least one account to import.");
            return;
        }

        const accountIndexes = isHdWallet ? selectedIndexes : undefined;

        submissionRef.current = true;
        setLoading(true);
        setFormError("");

        try {
            if (preview.existingSignerId) {
                await dispatch(
                    importKeyfileAccounts({
                        keyfile: selectedKeyfile.content,
                        password,
                        accountIndexes,
                    }),
                ).unwrap();

                clearSensitiveState();
                onAccountsImported?.({
                    signerId: preview.existingSignerId,
                    importedAccountsCount: isHdWallet
                        ? selectedIndexes.length
                        : 1,
                });

                return;
            }

            await dispatch(
                importKeyfileWallet({
                    keyfile: selectedKeyfile.content,
                    password,
                    accountIndexes,
                }),
            ).unwrap();

            clearSensitiveState();
            onWalletImported?.();
        } catch (importError: unknown) {
            const code = getErrorCode(importError);
            const message = getErrorMessage(
                importError,
                "Failed to import keyfile.",
            );

            if (
                code === CustomErrorCode.INVALID_KEYFILE_PASSWORD ||
                code === CustomErrorCode.INVALID_PASSWORD
            ) {
                setPasswordError(message);
                backToKeyfileStep();
            } else if (
                code === CustomErrorCode.INVALID_KEYFILE ||
                code === CustomErrorCode.CORRUPTED_DATA
            ) {
                setFileError(message);
                backToKeyfileStep();
            } else {
                setFormError(message);
            }
        } finally {
            setLoading(false);
            submissionRef.current = false;
        }
    };

    const handleCancel = (): void => {
        clearSensitiveState();
        setFileError("");
        setPasswordError("");
        setFormError("");
        onCancel?.();
    };

    if (!preview) {
        return (
            <FormContainer>
                <FileSelector
                    id="import-keyfile-file-input"
                    label="Keyfile"
                    accept="application/json,.json"
                    disabled={loading}
                    onSelect={handleKeyfileSelect}
                    error={fileError || undefined}
                    hint={
                        selectedKeyfile
                            ? `Loaded: ${selectedKeyfile.name}, ${WALLET_TYPE_LABEL[selectedKeyfile.walletType]} wallet`
                            : "Not provided"
                    }
                />

                <FormGroup>
                    <PasswordInput
                        id="import-keyfile-password-input"
                        label={
                            selectedKeyfile
                                ? `Password of the ${WALLET_TYPE_LABEL[selectedKeyfile.walletType]} wallet`
                                : "Wallet password"
                        }
                        value={password}
                        onChange={(event) => {
                            setPassword(event.target.value);

                            if (passwordError) {
                                setPasswordError("");
                            }
                        }}
                        placeholder="Enter keyfile password"
                        autoComplete="off"
                        disabled={loading}
                        error={passwordError || undefined}
                    />
                </FormGroup>

                {formError && (
                    <Notice tone="danger" icon="⚠️">
                        {formError}
                    </Notice>
                )}

                <FormActions>
                    <Button
                        id="import-keyfile-continue-button"
                        variant="primary"
                        onClick={handlePreview}
                        disabled={!selectedKeyfile || !password || loading}
                        loading={loading}
                        fullWidth
                    >
                        Continue
                    </Button>
                    <Button
                        id="import-keyfile-cancel-button"
                        variant="secondary"
                        onClick={handleCancel}
                        disabled={loading}
                        fullWidth
                    >
                        Cancel
                    </Button>
                </FormActions>
            </FormContainer>
        );
    }

    const canImport = hasImportableAccounts(preview);

    return (
        <FormContainer>
            {preview.existingSignerId && canImport && (
                <Notice tone="info" icon="ℹ️">
                    This keyfile belongs to a wallet that is already in the
                    system. Selected accounts will be added to it.{" "}
                    {preview.isExistingWalletOpen
                        ? "The wallet is unlocked, so the accounts appear right after the import."
                        : "The wallet stays locked and its own password is not required. The accounts are saved to it and appear the next time you unlock it."}
                </Notice>
            )}

            {!canImport && (
                <Notice tone="warning" icon="⚠️">
                    Every account from this keyfile is already imported, so
                    there is nothing left to import.
                </Notice>
            )}

            <FormGroup>
                <FieldLabel>
                    {`Accounts of the ${WALLET_TYPE_LABEL[preview.walletType]} wallet`}
                </FieldLabel>
                <AccountsList>
                    {sortedAccounts.map(
                        ({
                            name,
                            index,
                            address,
                            status,
                        }: IKeyfileImportAccountPreview) => {
                            const isImported =
                                status ===
                                KeyfileImportAccountStatus.ALREADY_IMPORTED;
                            const isSelectable = !isImported && index !== null;

                            return (
                                <AccountRow
                                    key={address}
                                    $disabled={!isSelectable}
                                >
                                    <Checkbox
                                        disabled={!isSelectable || loading}
                                        checked={
                                            index !== null &&
                                            selectedIndexes.includes(index)
                                        }
                                        onChange={() => {
                                            if (index !== null) {
                                                toggleAccount(index);
                                            }
                                        }}
                                        aria-label={
                                            index === null
                                                ? name
                                                : `Account ${index} ${name}`
                                        }
                                    />
                                    <AccountInfo>
                                        <AccountName>
                                            {index === null
                                                ? name
                                                : `#${index} ${name}`}
                                        </AccountName>
                                        <AccountAddress>
                                            {address}
                                        </AccountAddress>
                                    </AccountInfo>
                                    {isImported && (
                                        <Badge>already imported</Badge>
                                    )}
                                </AccountRow>
                            );
                        },
                    )}
                </AccountsList>
            </FormGroup>

            {formError && (
                <Notice tone="danger" icon="⚠️">
                    {formError}
                </Notice>
            )}

            <FormActions>
                {canImport ? (
                    <>
                        <Button
                            id="import-keyfile-import-button"
                            variant="primary"
                            onClick={handleImport}
                            disabled={
                                loading ||
                                (preview.walletType === WalletTypes.HD &&
                                    !selectedIndexes.length)
                            }
                            loading={loading}
                            fullWidth
                        >
                            Import
                        </Button>
                        <Button
                            id="import-keyfile-back-button"
                            variant="secondary"
                            onClick={backToKeyfileStep}
                            disabled={loading}
                            fullWidth
                        >
                            Back
                        </Button>
                    </>
                ) : (
                    <Button
                        id="import-keyfile-close-button"
                        variant="primary"
                        onClick={handleCancel}
                        fullWidth
                    >
                        Close
                    </Button>
                )}
            </FormActions>
        </FormContainer>
    );
};
