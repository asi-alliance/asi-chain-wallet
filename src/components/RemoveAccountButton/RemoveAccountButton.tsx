import styled from "styled-components";
import { removeAccount, selectWallets } from "store/walletSlice";
import { logout, setHasAccounts } from "store/authSlice";
import { useDispatch, useSelector } from "react-redux";
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
    const dispatch = useDispatch();

    const wallets: IWalletMeta[] = useSelector(selectWallets);

    const handleRemoveAccount = () => {
        if (window.confirm("Are you sure you want to remove this account?")) {
            dispatch(removeAccount(accountId));
        }

        if (wallets.length === 1) {
            dispatch(setHasAccounts(false));
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
