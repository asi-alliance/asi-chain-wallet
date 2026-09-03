import React from "react";
import styled from "styled-components";
import { EditableLabel } from "components/EditableLabel";
import {
    selectAccountById,
    selectSelectedAccountId,
    selectWalletByAccountId,
} from "store/WalletsStore";
import { updateAccountName } from "store/WalletsStore/thunks";
import { useSelector } from "react-redux";
import { useAppDispatch } from "store/hooks";
import { IAccountMeta } from "types/wallet";
import { RootState } from "store";
import { EditableLabelProps } from "components/EditableLabel/EditableLabel";
import { useValidAccountUpdating } from "hooks";

interface IAccountNameEditorProps extends Omit<
    EditableLabelProps,
    "label" | "onChange" | "onSave"
> {
    accountId: string;
}

const StyledEditableLabel = styled(EditableLabel)<{ $isSelected: boolean }>`
    font-size: 1.25rem !important;
    font-weight: 400 !important;
    color: ${({ $isSelected, theme }) =>
        !$isSelected
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
    const dispatch = useAppDispatch();

    const selectedAccountId = useSelector(selectSelectedAccountId);
    const account: IAccountMeta | null = useSelector((state: RootState) =>
        selectAccountById(state, accountId),
    );
    const wallet = useSelector((state: RootState) =>
        selectWalletByAccountId(state, accountId),
    );

    const { isNameUpdateValid, nameErrorMessage, updateAccountField, reset } =
        useValidAccountUpdating(account);

    if (!account) {
        return null;
    }

    const handleUpdateAccountName = (newName: string) => {
        if (!wallet?.id) {
            console.error(
                "AccountNameEditor: wallet is locked or not found, cannot rename",
            );

            return;
        }

        dispatch(
            updateAccountName({
                walletId: wallet.id,
                accountId: accountId,
                name: newName,
            }),
        );
    };

    const isSelected: boolean = account.id === selectedAccountId;

    return (
        <StyledEditableLabel
            className={`account-name-editor`}
            label={account.name}
            onSave={handleUpdateAccountName}
            onChange={(query: string) => updateAccountField("name", query)}
            onCancel={reset}
            isValid={isNameUpdateValid}
            $isSelected={isSelected}
            labelStyle={{
                maxWidth: "100%",
                textWrap: "nowrap",
                textOverflow: "ellipsis",
            }}
            errorMessage={nameErrorMessage}
            style={{
                maxWidth: "100%",
            }}
            isSelected={isSelected}
            {...labelProps}
        />
    );
};
