import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Button } from "components";
import { FileIcon } from "components/Icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "store";
import { selectNetworks } from "store/WalletsStore";
import { updateCustomNetwork } from "store/WalletsStore/thunks";
import { Network } from "types/wallet";
import { SdkWalletService, useIsNetworkBusy } from "sdk";
import { getErrorMessage } from "utils/helpers";
import {
    getNetworkFormFieldErrors,
    INetworkFormValues,
    NetworkFormError,
    NetworkFormFields,
    normalizeNetworkFormValues,
    TNetworkFormFieldErrors,
} from "components/NetworkForm";

const InlineButton = styled(Button)`
    height: ${({ theme }) => theme.sizes.control.field};
    flex: 1;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        width: 100%;
    }
`;

const SaveButton = styled(InlineButton)`
    min-width: 252px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        min-width: 0;
    }
`;

const NetworkBusyStatus = styled(NetworkFormError)`
    color: ${({ theme }) => theme.warningText};
    background: ${({ theme }) => `${theme.warning}15`};
    border-color: ${({ theme }) => theme.warning};
`;

const CustomNetworkActionsButtons = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: ${({ theme }) => theme.spacing.lg};
    margin-top: ${({ theme }) => theme.spacing["3xl"]};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column;
        align-items: stretch;
    }
`;

const toFormValues = (network: Network): INetworkFormValues => ({
    name: network.name,
    config: SdkWalletService.toNetworkConfig(network),
});

interface EditCustomNetworkFormProps {
    network: Network;
    isSaving: boolean;
    onSuccess: () => void;
    onSavingChange: (isSaving: boolean) => void;
}

export const EditCustomNetworkForm: React.FC<EditCustomNetworkFormProps> = ({
    network,
    isSaving,
    onSuccess,
    onSavingChange,
}) => {
    const dispatch = useDispatch<AppDispatch>();

    const networks = useSelector(selectNetworks);
    const isNetworkBusy = useIsNetworkBusy(network.id);

    const [values, setValues] = useState<INetworkFormValues>(
        toFormValues(network),
    );
    const [fieldErrors, setFieldErrors] = useState<TNetworkFormFieldErrors>({});
    const [connectionError, setConnectionError] = useState<string | null>(null);

    useEffect(() => {
        setValues(toFormValues(network));
        setFieldErrors({});
        setConnectionError(null);
    }, [network]);

    const handleValuesChange = (nextValues: INetworkFormValues): void => {
        setValues(nextValues);
        setFieldErrors((currentErrors) =>
            Object.keys(currentErrors).length
                ? getNetworkFormFieldErrors(
                      nextValues,
                      networks
                          .filter(
                              (networkMeta: Network) =>
                                  networkMeta.id !== network.id,
                          )
                          .map((networkMeta: Network) => networkMeta.name),
                  )
                : currentErrors,
        );

        if (connectionError) {
            setConnectionError(null);
        }
    };

    const handleRestore = (): void => {
        setValues(toFormValues(network));
        setFieldErrors({});
        setConnectionError(null);
    };

    const handleSave = async (): Promise<void> => {
        if (isSaving || isNetworkBusy) {
            return;
        }

        const reservedNames = networks
            .filter((networkMeta: Network) => networkMeta.id !== network.id)
            .map((networkMeta: Network) => networkMeta.name);

        const nextFieldErrors = getNetworkFormFieldErrors(
            values,
            reservedNames,
        );

        if (Object.keys(nextFieldErrors).length) {
            setFieldErrors(nextFieldErrors);
            setConnectionError(null);

            return;
        }

        setFieldErrors({});
        setConnectionError(null);
        onSavingChange(true);

        const { name, config } = normalizeNetworkFormValues(values);

        try {
            await dispatch(
                updateCustomNetwork({
                    id: network.id,
                    update: {
                        name,
                        config,
                    },
                }),
            ).unwrap();

            onSuccess();
        } catch (updateError) {
            setConnectionError(
                getErrorMessage(updateError, "Failed to update custom network"),
            );
        } finally {
            onSavingChange(false);
        }
    };

    const isDisabled = isSaving || isNetworkBusy;

    return (
        <>
            <NetworkFormFields
                idPrefix="edit-network"
                values={values}
                onChange={handleValuesChange}
                disabled={isDisabled}
                fieldErrors={fieldErrors}
            />

            {connectionError && (
                <NetworkFormError role="alert">{connectionError}</NetworkFormError>
            )}

            {isNetworkBusy && !connectionError && (
                <NetworkBusyStatus>
                    This network is busy with a running operation. Wait until it
                    finishes before saving changes.
                </NetworkBusyStatus>
            )}

            <CustomNetworkActionsButtons>
                <SaveButton
                    id="edit-network-save-button"
                    variant="primary"
                    onClick={handleSave}
                    loading={isSaving}
                    disabled={isDisabled}
                >
                    <span aria-hidden="true" style={{ display: "inline-flex" }}>
                        <FileIcon size={16} />
                    </span>
                    Save Custom Network
                </SaveButton>

                <InlineButton
                    id="edit-network-restore-button"
                    variant="secondary"
                    onClick={handleRestore}
                    disabled={isSaving}
                >
                    Restore to default
                </InlineButton>
            </CustomNetworkActionsButtons>
        </>
    );
};
