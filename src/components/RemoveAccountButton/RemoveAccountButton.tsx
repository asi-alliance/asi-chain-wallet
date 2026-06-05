import styled from "styled-components";
import { removeAccount, selectAccounts } from "store/walletSlice";
import { logout, setHasAccounts } from "store/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { DeleteIcon } from "components/Icons";
import { Button } from "components/Button";
import { Account } from "types/wallet";
import { ReactElement } from "react";
import { ButtonProps } from "components/Button/Button";

interface IRemoveAccountButtonProps extends ButtonProps {
    account: Account;
}

const RemoveButton = styled(Button)`
    background: ${({ theme }) => theme.colors.background.secondary};
`;

export const RemoveAccountButton = ({
    account,
}: IRemoveAccountButtonProps): ReactElement => {
    const dispatch = useDispatch();

    const accounts: Account[] = useSelector(selectAccounts);

    const handleRemoveAccount = (accountId: string) => {
        if (window.confirm("Are you sure you want to remove this account?")) {
            dispatch(removeAccount(accountId));
        }

        if (accounts.length === 1) {
            dispatch(setHasAccounts(false));
            dispatch(logout());
        }
    };

    return (
        <RemoveButton
            id={`remove-account-${account.id}`}
            variant="icon-button"
            onClick={(e) => {
                e.stopPropagation();
                handleRemoveAccount(account.id);
            }}
            dangerHover
        >
            <DeleteIcon />
        </RemoveButton>
    );
};
