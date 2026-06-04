import { useState } from "react";
import { useSelector } from "react-redux";
import { selectAccounts } from "store/walletSlice";
import { Account } from "types/wallet";

interface IUseValidAccountUpdatingResponse {
    isNameUpdateValid: boolean;
    nameErrorMessage: string | undefined;
    updateAccountField: <TKey extends keyof Account>(
        key: TKey,
        value: Account[TKey],
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
    targetAccount?: Partial<Account>,
    config?: IValidAccountUpdatingConfig,
): IUseValidAccountUpdatingResponse => {
    const existingAccountNames: Account[] = useSelector(selectAccounts);

    const [currentAccountData, setCurrentAccountData] = useState<
        Partial<Account>
    >(targetAccount ?? {});

    const updateAccountField = <TKey extends keyof Account>(
        key: TKey,
        value: Account[TKey],
    ) => {
        setCurrentAccountData((previousValue) => ({
            ...previousValue,
            [key]: value,
        }));
    };

    const reset = (): void => {
        setCurrentAccountData(targetAccount ?? {});
    };

    const otherExistingAccounts: Account[] = existingAccountNames.filter(
        (account: Account) => account.id !== currentAccountData?.id,
    );

    const isNameDuplicate: boolean =
        otherExistingAccounts.some(
            (account: Account) =>
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
