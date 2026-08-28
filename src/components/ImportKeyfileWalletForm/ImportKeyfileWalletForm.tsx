import React, { useMemo, useState } from "react";
import styled from "styled-components";
import {
    IKeyfileImportAccountPreview,
    IKeyfileImportPreview,
    KeyfileImportAccountStatus,
    WalletTypes,
} from "@asichain/asi-wallet-sdk";
import { Button, Checkbox, FileSelector, PasswordInput } from "components";
import { useScreen } from "hooks/";
import { useAppDispatch } from "store/hooks";
import { SdkWalletService } from "sdk";
import { importKeyfileWallet } from "store/Auth/thunks";
import { importKeyfileAccounts } from "store/WalletsStore/thunks";

const FormGroup = styled.div`
    margin-bottom: 16px;
`;

const FieldLabel = styled.label`
    display: block;
    margin-bottom: 8px;
    color: ${({ theme }) => theme.text.primary};
    font-size: 14px;
`;

const Notice = styled.div`
    margin-bottom: 16px;
    padding: 12px 14px;
    border-radius: 8px;
    background: ${({ theme }) => theme.surface};
    color: ${({ theme }) => theme.text.secondary};
    font-size: 13px;
    line-height: 1.5;
`;

const AccountsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 280px;
    overflow-y: auto;
`;

const AccountRow = styled.label<{ $disabled: boolean }>`
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 8px;
    cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
    opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

const AccountInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
`;

const AccountName = styled.span`
    color: ${({ theme }) => theme.text.primary};
    font-size: 14px;
`;

const AccountAddress = styled.span`
    color: ${({ theme }) => theme.text.secondary};
    font-size: 12px;
    word-break: break-all;
`;

const Badge = styled.span`
    color: ${({ theme }) => theme.text.secondary};
    font-size: 11px;
    text-transform: uppercase;
    white-space: nowrap;
`;

const ErrorMessage = styled.div`
    margin-top: 12px;
    color: ${({ theme }) => theme.danger};
    font-size: 14px;
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
        margin-bottom: 16px;
    }
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
    const { isLaptop } = useScreen();

    const [selectedKeyfile, setSelectedKeyfile] =
        useState<ISelectedKeyfile | null>(null);
    const [password, setPassword] = useState("");
    const [preview, setPreview] = useState<IKeyfileImportPreview | null>(null);
    const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    const handleKeyfileSelect = async (file: File | null): Promise<void> => {
        setError("");
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
            setError("Keyfile cannot be read.");

            return;
        }

        const walletType = readKeyfileWalletType(content);

        if (!walletType) {
            setError("Selected file is not an ASI wallet keyfile.");

            return;
        }

        setSelectedKeyfile({ name: file.name, content, walletType });
    };

    const handlePreview = async (): Promise<void> => {
        if (!selectedKeyfile) {
            setError("Please select a keyfile first.");

            return;
        }

        setLoading(true);
        setError("");

        try {
            const keyfilePreview =
                await SdkWalletService.previewWalletKeyfileImport(
                    selectedKeyfile.content,
                    password,
                );

            setPreview(keyfilePreview);
            setSelectedIndexes(getSelectableIndexes(keyfilePreview));
        } catch (previewError: unknown) {
            setError(
                (previewError as Error)?.message ?? "Keyfile cannot be read.",
            );
        } finally {
            setLoading(false);
        }
    };

    const toggleAccount = (index: number): void => {
        setError("");
        setSelectedIndexes((currentIndexes: number[]) =>
            currentIndexes.includes(index)
                ? currentIndexes.filter(
                      (selectedIndex: number) => selectedIndex !== index,
                  )
                : [...currentIndexes, index],
        );
    };

    const backToKeyfileStep = (): void => {
        setError("");
        setPreview(null);
        setSelectedIndexes([]);
    };

    const handleImport = async (): Promise<void> => {
        if (!selectedKeyfile || !preview) {
            return;
        }

        const isHdWallet = preview.walletType === WalletTypes.HD;

        if (isHdWallet && !selectedIndexes.length) {
            setError("Please select at least one account to import.");

            return;
        }

        const accountIndexes = isHdWallet ? selectedIndexes : undefined;

        setLoading(true);
        setError("");

        try {
            if (preview.existingSignerId) {
                await dispatch(
                    importKeyfileAccounts({
                        keyfile: selectedKeyfile.content,
                        password,
                        accountIndexes,
                    }),
                ).unwrap();

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

            onWalletImported?.();
        } catch (importError: unknown) {
            setError(
                (importError as Error)?.message ?? "Failed to import keyfile.",
            );
        } finally {
            setLoading(false);
        }
    };

    if (!preview) {
        return (
            <>
                <FileSelector
                    id="import-keyfile-file-input"
                    label="Keyfile"
                    accept="application/json,.json"
                    disabled={loading}
                    onSelect={handleKeyfileSelect}
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

                            if (error) {
                                setError("");
                            }
                        }}
                        placeholder="Enter keyfile password"
                        autoComplete="off"
                        disabled={loading}
                    />
                </FormGroup>

                {error && <ErrorMessage>{error}</ErrorMessage>}

                <ActionButtons>
                    <AdaptiveButton
                        id="import-keyfile-continue-button"
                        variant="primary"
                        onClick={handlePreview}
                        disabled={!selectedKeyfile || !password || loading}
                        loading={loading}
                        fullWidth={isLaptop}
                    >
                        Continue
                    </AdaptiveButton>
                    <AdaptiveButton
                        id="import-keyfile-cancel-button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={loading}
                        fullWidth={isLaptop}
                    >
                        Cancel
                    </AdaptiveButton>
                </ActionButtons>
            </>
        );
    }

    const canImport = hasImportableAccounts(preview);

    return (
        <>
            {preview.existingSignerId && canImport && (
                <Notice>
                    This keyfile belongs to a wallet that is already in the
                    system. Selected accounts will be added to it.{" "}
                    {preview.isExistingWalletOpen
                        ? "The wallet is unlocked, so the accounts appear right after the import."
                        : "The wallet stays locked and its own password is not required. The accounts are saved to it and appear the next time you unlock it."}
                </Notice>
            )}

            {!canImport && (
                <Notice>
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
                                        onChange={() =>
                                            index !== null &&
                                            toggleAccount(index)
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

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <ActionButtons>
                {canImport ? (
                    <>
                        <AdaptiveButton
                            id="import-keyfile-import-button"
                            variant="primary"
                            onClick={handleImport}
                            disabled={loading}
                            loading={loading}
                            fullWidth={isLaptop}
                        >
                            Import
                        </AdaptiveButton>
                        <AdaptiveButton
                            id="import-keyfile-back-button"
                            variant="secondary"
                            onClick={backToKeyfileStep}
                            disabled={loading}
                            fullWidth={isLaptop}
                        >
                            Back
                        </AdaptiveButton>
                    </>
                ) : (
                    <AdaptiveButton
                        id="import-keyfile-close-button"
                        variant="primary"
                        onClick={onCancel}
                        fullWidth={isLaptop}
                    >
                        Close
                    </AdaptiveButton>
                )}
            </ActionButtons>
        </>
    );
};
