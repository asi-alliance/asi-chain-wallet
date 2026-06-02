import { Select } from "components/Select";
import { ISelectProps } from "components/Select/Select";
import { CSSProperties, ReactElement, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store";
import { selectAccount } from "store/walletSlice";
import styled from "styled-components";
import { Account } from "types/wallet";

const FilterGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const FilterLabel = styled.label`
    // font-size: 14px;
    font-weight: 500;
    color: ${({ theme }) => theme.text.secondary};
`;

type TSelectAdditionalProps = Omit<
    ISelectProps,
    "value" | "onChange" | "options"
>;

interface IAccountSelectorProps extends TSelectAdditionalProps {
    fullWidth?: boolean;
}

export const AccountSelector = ({
    fullWidth = false,
    ...selectProps
}: IAccountSelectorProps): ReactElement => {
    const dispatch = useDispatch();
    const { selectedAccount, accounts } = useSelector(
        (state: RootState) => state.wallet,
    );

    const accountOptions = useMemo(
        () =>
            accounts.map((account: Account) => ({
                id: account.id,
                value: account.id,
                label: account.name,
            })),
        [accounts],
    );

    const fullWidthStyle: CSSProperties = !fullWidth ? {} : { width: "100%" };

    const { style, ...otherSelectProps } = selectProps;

    return (
        <FilterGroup style={fullWidthStyle}>
            <FilterLabel>
                <h4 className="light">Account</h4>
            </FilterLabel>
            <Select
                id="history-filter-account-select"
                value={selectedAccount?.id}
                onChange={(accountId) => dispatch(selectAccount(accountId))}
                placeholder="Select account"
                options={accountOptions}
                style={{
                    ...style,
                    ...fullWidthStyle,
                }}
                {...otherSelectProps}
            />
        </FilterGroup>
    );
};
