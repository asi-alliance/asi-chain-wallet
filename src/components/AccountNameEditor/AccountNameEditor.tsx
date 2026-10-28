import React, { useState } from "react";
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
import { getErrorMessage } from "@asichain/asi-wallet-sdk";

interface IAccountNameEditorProps extends Omit<
    EditableLabelProps,
    "label" | "onChange" | "onSave"
> {
    accountId: string;
}

const FALLBACK_RENAME_ERROR_MESSAGE = "Failed to rename account";

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
    isSelected: isSelectedProp,
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

    const [saveError, setSaveError] = useState("");

    if (!account) {
        return null;
    }

    const handleUpdateAccountName = async (newName: string): Promise<void> => {
        if (!wallet?.id) {
            setSaveError("Unlock the wallet before renaming this account");
            throw new Error("Wallet locked");
        }

        setSaveError("");

        try {
            await dispatch(
                updateAccountName({
                    walletId: wallet.id,
                    accountId: accountId,
                    name: newName,
                }),
            ).unwrap();
        } catch (renameError: unknown) {
            setSaveError(
                getErrorMessage(renameError, FALLBACK_RENAME_ERROR_MESSAGE),
            );
            throw renameError;
        }
    };

    // Wallet compact cards stay on a light surface; callers can suppress inverse text.
    const isSelected: boolean =
        isSelectedProp ?? account.id === selectedAccountId;

    return (
        <StyledEditableLabel
            className={`account-name-editor`}
            label={account.name}
            onSave={handleUpdateAccountName}
            onChange={(query: string) => {
                setSaveError("");
                updateAccountField("name", query);
            }}
            onCancel={() => {
                setSaveError("");
                reset();
            }}
            isValid={isNameUpdateValid}
            $isSelected={isSelected}
            labelStyle={{
                maxWidth: "100%",
                textWrap: "nowrap",
                textOverflow: "ellipsis",
            }}
            errorMessage={saveError || nameErrorMessage}
            style={{
                maxWidth: "100%",
            }}
            isSelected={isSelected}
            aria-label={`Account name, ${account.name}`}
            {...labelProps}
        />
    );
};
