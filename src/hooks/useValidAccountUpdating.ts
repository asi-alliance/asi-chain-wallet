import { useState } from "react";
import { useSelector } from "react-redux";
import { selectAccounts } from "store/WalletsStore";
import { IAccountMeta } from "types/wallet";

interface IUseValidAccountUpdatingResponse {
    isNameUpdateValid: boolean;
    nameErrorMessage: string | undefined;
    updateAccountField: <TKey extends keyof IAccountMeta>(
        key: TKey,
        value: IAccountMeta[TKey],
    ) => void;
    reset: () => void;
}

interface IValidAccountUpdatingConfig {
    firstAccount?: boolean;
}

enum AccountFieldsEditingErrorMessages {
    NAME = "Account with this name already exist",
}

export const useValidAccountUpdating = (
    targetAccount?: Partial<IAccountMeta> | null,
    config?: IValidAccountUpdatingConfig,
): IUseValidAccountUpdatingResponse => {
    const existingAccounts: IAccountMeta[] = useSelector(selectAccounts);

    const [currentAccountData, setCurrentAccountData] = useState<
        Partial<IAccountMeta>
    >(targetAccount ?? {});

    const updateAccountField = <TKey extends keyof IAccountMeta>(
        key: TKey,
        value: IAccountMeta[TKey],
    ) => {
        setCurrentAccountData((previousValue) => ({
            ...previousValue,
            [key]: value,
        }));
    };

    const reset = (): void => {
        setCurrentAccountData(targetAccount ?? {});
    };

    const otherExistingAccounts: IAccountMeta[] = existingAccounts.filter(
        (account: IAccountMeta) => account.id !== currentAccountData?.id,
    );

    const isNameDuplicate: boolean =
        otherExistingAccounts.some(
            (account: IAccountMeta) =>
                account.name === currentAccountData?.name?.trim(),
        ) || !!config?.firstAccount;

    const isNameUpdateValid: boolean =
        !!currentAccountData?.name && !isNameDuplicate;
    const nameErrorMessage: string | undefined = !isNameDuplicate
        ? undefined
        : AccountFieldsEditingErrorMessages.NAME;

    return {
        isNameUpdateValid,
        nameErrorMessage,
        updateAccountField,
        reset,
    };
};
