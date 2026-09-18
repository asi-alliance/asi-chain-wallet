import React, { type CSSProperties, useEffect, useState } from "react";
import styled from "styled-components";
import { Button } from "components";
import { FileIcon } from "components/Icons";
import { useScreen } from "hooks";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "store";
import { selectNetworks } from "store/WalletsStore";
import { updateCustomNetwork } from "store/WalletsStore/thunks";
import { Network } from "types/wallet";
import { useIsNetworkBusy } from "sdk";
import { getErrorMessage } from "utils/helpers";
import {
    INetworkFormValues,
    NetworkFormError,
    NetworkFormFields,
    normalizeNetworkFormValues,
    validateNetworkFormValues,
} from "components/NetworkForm";

const InlineButton = styled(Button)`
    height: 44px;
`;

const CustomNetworkActionsButtons = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 60px;
    gap: 25px;

    @media (max-width: 768px) {
        flex-direction: column;
        padding: 0 30px;
    }

    @media (max-width: 400px) {
        padding: 0 10px;
    }
`;

const toFormValues = (network: Network): INetworkFormValues => ({
    name: network.name,
    config: {
        ValidatorURL: network.validatorUrl,
        ReadOnlyURL: network.observerUrl,
        IndexerURL: network.indexerUrl,
        nodeApiProfile: network.nodeApiProfile,
    },
});

interface EditCustomNetworkFormProps {
    network: Network;
    onSuccess: () => void;
    onCancel: () => void;
}

export const EditCustomNetworkForm: React.FC<EditCustomNetworkFormProps> = ({
    network,
    onSuccess,
    onCancel,
}) => {
    const { isLaptop } = useScreen();
    const dispatch = useDispatch<AppDispatch>();

    const networks = useSelector(selectNetworks);
    const isNetworkBusy = useIsNetworkBusy(network.id);

    const [values, setValues] = useState<INetworkFormValues>(
        toFormValues(network),
    );
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setValues(toFormValues(network));
        setError(null);
    }, [network]);

    const handleSave = async (): Promise<void> => {
        const reservedNames = networks
            .filter((networkMeta: Network) => networkMeta.id !== network.id)
            .map((networkMeta: Network) => networkMeta.name);

        const validationError = validateNetworkFormValues(
            values,
            reservedNames,
        );

        if (validationError) {
            setError(validationError);

            return;
        }

        setError(null);
        setIsSaving(true);

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
            setError(
                getErrorMessage(updateError, "Failed to update custom network"),
            );
        } finally {
            setIsSaving(false);
        }
    };

    const isDisabled = isSaving || isNetworkBusy;

    const saveButtonStyle: CSSProperties = !isLaptop
        ? {
              minWidth: "252px",
              flex: "1",
          }
        : {
              flex: "1",
          };

    return (
        <>
            <NetworkFormFields
                idPrefix="edit-network"
                values={values}
                onChange={setValues}
                disabled={isDisabled}
            />

            {error && <NetworkFormError>{error}</NetworkFormError>}

            {isNetworkBusy && !error && (
                <NetworkFormError>
                    This network is busy with a running operation. Wait until it
                    finishes before saving changes.
                </NetworkFormError>
            )}

            <CustomNetworkActionsButtons>
                <InlineButton
                    id="edit-network-save-button"
                    variant="primary"
                    onClick={handleSave}
                    loading={isSaving}
                    disabled={isDisabled}
                    style={saveButtonStyle}
                >
                    Save Custom Network
                    <FileIcon />
                </InlineButton>

                <InlineButton
                    id="edit-network-cancel-button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isSaving}
                    style={{ flex: "1" }}
                >
                    Cancel
                </InlineButton>
            </CustomNetworkActionsButtons>
        </>
    );
};
