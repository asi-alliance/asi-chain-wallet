import styled from "styled-components";
import { type ReactElement, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CustomNetworkCard } from "components/CustomNetworkCard";
import { AppDispatch } from "store";
import { selectCustomNetworks, selectNetworks } from "store/WalletsStore";
import { addCustomNetwork } from "store/WalletsStore/thunks";
import { Network } from "types/wallet";
import { getErrorMessage } from "utils/helpers";
import {
    createEmptyNetworkFormValues,
    INetworkFormValues,
    NetworkFormError,
    NetworkFormFields,
    normalizeNetworkFormValues,
    validateNetworkFormValues,
} from "components/NetworkForm";
import { Card, CardHeader, CardTitle, CardContent, Button } from "components";

const InfoBox = styled.div`
    background: ${({ theme }) => theme.info}20;
    border: 1px solid ${({ theme }) => theme.info};
    border-radius: 8px;
    padding: 16px 23px;
    margin-bottom: 24px;

    p {
        margin: 0;
        color: ${({ theme }) => theme.text.primary};
    }

    @media (max-width: 400px) {
        padding: 12px;
    }
`;

const ActionButtons = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;

    @media (max-width: 400px) {
        flex-direction: column;
    }
`;

const InlineButton = styled(Button)`
    height: 44px;

    @media (max-width: 400px) {
        width: 100%;
    }
`;

const EmptyState = styled.div`
    padding: 24px;
    text-align: center;
    color: ${({ theme }) => theme.text.secondary};
`;

export const Settings = (): ReactElement => {
    const dispatch = useDispatch<AppDispatch>();

    const networks = useSelector(selectNetworks);
    const customNetworks = useSelector(selectCustomNetworks);

    const [values, setValues] = useState<INetworkFormValues>(
        createEmptyNetworkFormValues(),
    );
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const resetForm = (): void => {
        setValues(createEmptyNetworkFormValues());
        setError(null);
    };

    const handleCreate = async (): Promise<void> => {
        const validationError = validateNetworkFormValues(
            values,
            networks.map((network: Network) => network.name),
        );

        if (validationError) {
            setError(validationError);

            return;
        }

        setError(null);
        setIsCreating(true);

        const { name, config } = normalizeNetworkFormValues(values);

        try {
            await dispatch(
                addCustomNetwork({
                    name,
                    config,
                }),
            ).unwrap();

            resetForm();
        } catch (createError) {
            setError(
                getErrorMessage(createError, "Failed to create custom network"),
            );
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            <Card style={{ marginBottom: "43px" }}>
                <CardHeader>
                    <CardTitle>Add Custom Network</CardTitle>
                </CardHeader>

                <CardContent>
                    <InfoBox>
                        <p className="text-2">
                            Configure a custom network for local development or
                            private networks.
                        </p>
                    </InfoBox>

                    <NetworkFormFields
                        idPrefix="network"
                        values={values}
                        onChange={setValues}
                        disabled={isCreating}
                    />

                    {error && <NetworkFormError>{error}</NetworkFormError>}

                    <ActionButtons>
                        <InlineButton
                            id="add-network-button"
                            variant="primary"
                            onClick={handleCreate}
                            loading={isCreating}
                        >
                            <h3>Add Custom Network</h3>
                        </InlineButton>

                        <InlineButton
                            id="reset-network-form-button"
                            variant="secondary"
                            onClick={resetForm}
                            disabled={isCreating}
                        >
                            <h3>Clear form</h3>
                        </InlineButton>
                    </ActionButtons>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Custom Networks</CardTitle>
                </CardHeader>

                <CardContent>
                    {!customNetworks.length && (
                        <EmptyState>
                            <span className="text-2">
                                No custom networks configured yet.
                            </span>
                        </EmptyState>
                    )}

                    {customNetworks.map((network: Network) => (
                        <CustomNetworkCard key={network.id} network={network} />
                    ))}
                </CardContent>
            </Card>
        </>
    );
};

export default Settings;
