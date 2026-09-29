import styled from "styled-components";
import { selectAccountById, selectWalletByAccountId } from "store/WalletsStore";
import { useSelector } from "react-redux";
import { DeleteIcon } from "components/Icons";
import { Button } from "components/Button";
import { DeleteAccountModal } from "components/DeleteAccountModal";
import { IAccountMeta, IWalletMeta } from "types/wallet";
import { Fragment, MouseEvent, ReactElement } from "react";
import { ButtonProps } from "components/Button/Button";
import { RootState } from "store";
import { useDeleteAccount } from "hooks";
import { WalletTypes } from "@asichain/asi-wallet-sdk";

export interface IDeleteAccountRequest {
    walletId: string;
    accountId: string;
    accountName: string;
}

interface IRemoveAccountButtonProps extends ButtonProps {
    accountId: string;
    /** Required for last-account / PK delete so the modal survives removeWallet. */
    onRequestDeleteWallet?: (message: string) => void;
    /** Preferred host for non-last account delete so the modal survives removeAccount. */
    onRequestDeleteAccount?: (request: IDeleteAccountRequest) => void;
}

const RemoveButton = styled(Button)`
    background: ${({ theme }) => theme.colors.background.secondary};
`;

export const getWalletDeleteMessage = (
    wallet: IWalletMeta,
    accountName: string,
): string => {
    if (wallet.type === WalletTypes.PRIVATE_KEY) {
        return `This private-key wallet has a single account ("${accountName}"). Removing it deletes the wallet from this device. Make sure your private key is backed up — without it this wallet cannot be restored.`;
    }

    return `"${accountName}" is the last account in this wallet. Removing it deletes the wallet and all of its data from this device. Make sure your Secret Recovery Phrase is backed up — without it this wallet cannot be restored.`;
};

export const RemoveAccountButton = ({
    accountId,
    onRequestDeleteWallet,
    onRequestDeleteAccount,
}: IRemoveAccountButtonProps): ReactElement => {
    const wallet: IWalletMeta | null = useSelector((state: RootState) =>
        selectWalletByAccountId(state, accountId),
    );
    const account: IAccountMeta | null = useSelector((state: RootState) =>
        selectAccountById(state, accountId),
    );

    const isLastAccount: boolean = (wallet?.accounts.length ?? 0) <= 1;
    const deletesWallet: boolean =
        wallet?.type === WalletTypes.PRIVATE_KEY || isLastAccount;
    const hostsWalletDeleteExternally =
        typeof onRequestDeleteWallet === "function";
    const hostsAccountDeleteExternally =
        typeof onRequestDeleteAccount === "function";

    const deleteAccount = useDeleteAccount(wallet?.id, accountId);

    const isDisabled: boolean =
        !wallet?.id || (deletesWallet && !hostsWalletDeleteExternally);
    const accountName = account?.name ?? "";
    const actionLabel = deletesWallet
        ? `Delete wallet, ${accountName}`
        : `Remove account, ${accountName}`;

    const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();

        if (deletesWallet) {
            if (!wallet || !onRequestDeleteWallet) {
                return;
            }

            onRequestDeleteWallet(getWalletDeleteMessage(wallet, accountName));

            return;
        }

        if (hostsAccountDeleteExternally && wallet?.id) {
            onRequestDeleteAccount({
                walletId: wallet.id,
                accountId,
                accountName,
            });

            return;
        }

        deleteAccount.open();
    };

    return (
        <Fragment>
            <RemoveButton
                title={actionLabel}
                aria-label={actionLabel}
                id={`remove-account-${accountId}`}
                variant="icon-button"
                disabled={isDisabled}
                onClick={handleClick}
                dangerHover
            >
                <DeleteIcon />
            </RemoveButton>

            {!hostsAccountDeleteExternally && (
                <DeleteAccountModal
                    isOpen={deleteAccount.isOpen}
                    accountName={accountName}
                    isDeleting={deleteAccount.isDeleting}
                    error={deleteAccount.error}
                    onConfirm={deleteAccount.confirm}
                    onCancel={deleteAccount.close}
                />
            )}
        </Fragment>
    );
};
