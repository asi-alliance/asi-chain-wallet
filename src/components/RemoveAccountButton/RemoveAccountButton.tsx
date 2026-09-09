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

interface IRemoveAccountButtonProps extends ButtonProps {
    accountId: string;
}

const REMOVE_ACCOUNT_TITLE = "Remove account";
const LAST_ACCOUNT_TITLE =
    "The last account cannot be removed. Delete the wallet instead.";

const RemoveButton = styled(Button)`
    background: ${({ theme }) => theme.colors.background.secondary};
`;

export const RemoveAccountButton = ({
    accountId,
}: IRemoveAccountButtonProps): ReactElement => {
    const wallet: IWalletMeta | null = useSelector((state: RootState) =>
        selectWalletByAccountId(state, accountId),
    );
    const account: IAccountMeta | null = useSelector((state: RootState) =>
        selectAccountById(state, accountId),
    );

    const deleteAccount = useDeleteAccount(wallet?.id, accountId);

    const isLastAccount: boolean = wallet?.accounts.length === 1;
    const isDisabled: boolean = isLastAccount || !wallet?.id;

    const getTitle = (): string => {
        if (isLastAccount) {
            return LAST_ACCOUNT_TITLE;
        }

        return REMOVE_ACCOUNT_TITLE;
    };

    const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();

        deleteAccount.open();
    }

    return (
        <Fragment>
            <RemoveButton
                title={getTitle()}
                id={`remove-account-${accountId}`}
                variant="icon-button"
                disabled={isDisabled}
                onClick={handleClick}
                dangerHover
            >
                <DeleteIcon />
            </RemoveButton>

            <DeleteAccountModal
                isOpen={deleteAccount.isOpen}
                accountName={account?.name ?? ""}
                isDeleting={deleteAccount.isDeleting}
                error={deleteAccount.error}
                onConfirm={deleteAccount.confirm}
                onCancel={deleteAccount.close}
            />
        </Fragment>
    );
};
