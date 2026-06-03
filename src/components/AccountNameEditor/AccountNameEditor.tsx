import React from "react";
import styled from "styled-components";
import { EditableLabel } from "components/EditableLabel";
import { selectAccountById, updateAccountName } from "store/walletSlice";
import { useDispatch, useSelector } from "react-redux";
import { Account } from "types/wallet";
import { RootState } from "store";
import { EditableLabelProps } from "components/EditableLabel/EditableLabel";

interface IAccountNameEditorProps extends Omit<
    EditableLabelProps,
    "label" | "onChange"
> {
    accountId: string;
}

const StyledEditableLabel = styled(EditableLabel)<{ isSelected: boolean }>`
    font-size: 1.25rem !important;
    font-weight: 400 !important;
    color: ${({ isSelected, theme }) =>
        !isSelected
            ? theme.text.primary
            : theme.colors.background.secondary} !important;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    width: 100%;

    .editable-label-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: block;
        max-width: 100%;
    }
`;

export const AccountNameEditor: React.FC<IAccountNameEditorProps> = ({
    accountId,
    ...labelProps
}) => {
    const dispatch = useDispatch();

    const { selectedAccount } = useSelector((state: RootState) => state.wallet);

    const account: Account | undefined = useSelector((state: RootState) =>
        selectAccountById(state, accountId),
    );

    if (!account) {
        return null;
    }

    const handleUpdateAccountName = (newName: string) => {
        dispatch(
            updateAccountName({
                accountId: accountId,
                name: newName,
            }),
        );
    };

    const isSelected: boolean = account.id === selectedAccount?.id;

    return (
        <StyledEditableLabel
            className={`account-name-editor`}
            label={account.name}
            onChange={handleUpdateAccountName}
            isSelected={isSelected}
            labelStyle={{
                maxWidth: "100%",
                textWrap: "nowrap",
                textOverflow: "ellipsis",
            }}
            style={{
                maxWidth: "100%",
            }}
            {...labelProps}
        />
    );
};
