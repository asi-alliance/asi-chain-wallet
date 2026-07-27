import styled from "styled-components";
import { selectWallets } from "store/WalletsStore";
import { removeWallet } from "store/WalletsStore/thunks";
import { getWalletAndAccountFromWalletsMeta } from "store/WalletsStore/helpers";
import { logout } from "store/Auth/thunks";
import { useSelector } from "react-redux";
import { useAppDispatch } from "store/hooks";
import { DeleteIcon } from "components/Icons";
import { Button } from "components/Button";
import { IWalletMeta } from "types/wallet";
import { ReactElement } from "react";
import { ButtonProps } from "components/Button/Button";

interface IRemoveAccountButtonProps extends ButtonProps {
    accountId: string;
}

const RemoveButton = styled(Button)`
    background: ${({ theme }) => theme.colors.background.secondary};
`;

export const RemoveAccountButton = ({
    accountId,
}: IRemoveAccountButtonProps): ReactElement => {
    const dispatch = useAppDispatch();

    const wallets: IWalletMeta[] = useSelector(selectWallets);

    const handleRemoveAccount = () => {
        if (!window.confirm("Are you sure you want to remove this account?")) {
            return;
        }

        const walletAndAccountPath = getWalletAndAccountFromWalletsMeta(
            wallets,
            accountId,
        );

        if (!walletAndAccountPath?.wallet.id) {
            console.error(
                "RemoveAccountButton: wallet is locked or not found, cannot remove",
            );

            return;
        }

        dispatch(
            removeWallet({
                walletId: walletAndAccountPath.wallet.id,
                accountId,
            }),
        );

        if (wallets.length === 1) {
            dispatch(logout());
        }
    };

    return (
        <RemoveButton
            title="Remove account"
            id={`remove-account-${accountId}`}
            variant="icon-button"
            onClick={(e) => {
                e.stopPropagation();
                handleRemoveAccount();
            }}
            dangerHover
        >
            <DeleteIcon />
        </RemoveButton>
    );
};
