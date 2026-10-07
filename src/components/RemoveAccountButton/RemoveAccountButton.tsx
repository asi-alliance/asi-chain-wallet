import styled from "styled-components";
import { selectAccountById, selectWalletByAccountId } from "store/WalletsStore";
import { useSelector } from "react-redux";
import { DeleteIcon } from "components/Icons";
import { Button } from "components/Button";
import { IAccountMeta, IWalletMeta } from "types/wallet";
import { MouseEvent, ReactElement } from "react";
import { RootState } from "store";
import { IAccountDeleteTarget } from "hooks";
import { WalletTypes } from "@asichain/asi-wallet-sdk";

export type TRemoveAccountRequest =
    | { type: "account"; target: IAccountDeleteTarget }
    | { type: "wallet"; message: string };

interface IRemoveAccountButtonProps {
    accountId: string;
    onRequestDelete: (request: TRemoveAccountRequest) => void;
}

const RemoveButton = styled(Button)`
    background: ${({ theme }) => theme.colors.background.secondary};
`;

const getWalletDeleteMessage = (
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
    onRequestDelete,
}: IRemoveAccountButtonProps): ReactElement => {
    const wallet: IWalletMeta | null = useSelector((state: RootState) =>
        selectWalletByAccountId(state, accountId),
    );
    const account: IAccountMeta | null = useSelector((state: RootState) =>
        selectAccountById(state, accountId),
    );

    const deletesWallet: boolean =
        wallet?.type === WalletTypes.PRIVATE_KEY ||
        (wallet?.accounts.length ?? 0) <= 1;
    const accountName = account?.name ?? "";
    const actionLabel = deletesWallet
        ? `Delete wallet, ${accountName}`
        : `Remove account, ${accountName}`;

    const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();

        if (!wallet?.id) {
            return;
        }

        if (deletesWallet) {
            onRequestDelete({
                type: "wallet",
                message: getWalletDeleteMessage(wallet, accountName),
            });

            return;
        }

        onRequestDelete({
            type: "account",
            target: { walletId: wallet.id, accountId, accountName },
        });
    };

    return (
        <RemoveButton
            title={actionLabel}
            aria-label={actionLabel}
            id={`remove-account-${accountId}`}
            variant="icon-button"
            disabled={!wallet?.id}
            onClick={handleClick}
            dangerHover
        >
            <DeleteIcon />
        </RemoveButton>
    );
};
