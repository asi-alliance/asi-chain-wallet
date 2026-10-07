import styled from "styled-components";
import { type ReactElement, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CustomNetworkCard } from "components/CustomNetworkCard";
import { AppDispatch } from "store";
import { selectCustomNetworks, selectNetworks } from "store/WalletsStore";
import { addCustomNetwork } from "store/WalletsStore/thunks";
import { Network } from "types/wallet";
import { getErrorMessage } from "@asichain/asi-wallet-sdk";
import {
    createEmptyNetworkFormValues,
    getNetworkFormFieldErrors,
    INetworkFormValues,
    NetworkFormError,
    NetworkFormFields,
    normalizeNetworkFormValues,
    TNetworkFormFieldErrors,
} from "components/NetworkForm";
import { Card, CardHeader, CardTitle, CardContent, Button } from "components";
import { FileIcon } from "components/Icons";

const InfoBox = styled.div`
    background: ${({ theme }) => `${theme.info}20`};
    border: 1px solid ${({ theme }) => theme.info};
    border-radius: ${({ theme }) => theme.radii.md};
    padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing["3xl"]};
    margin-bottom: ${({ theme }) => theme.spacing["3xl"]};

    p {
        margin: 0;
        font-family: ${({ theme }) => theme.typography.fontFamily};
        font-size: ${({ theme }) => theme.typography.size.sm};
        line-height: ${({ theme }) => theme.typography.lineHeight.md};
        color: ${({ theme }) => theme.text.primary};
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
    }
`;

const ActionButtons = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: ${({ theme }) => theme.spacing.lg};
    margin-top: ${({ theme }) => theme.spacing["3xl"]};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column;
    }
`;

const InlineButton = styled(Button)`
    height: ${({ theme }) => theme.sizes.control.field};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        width: 100%;
    }
`;

const EmptyState = styled.div`
    padding: ${({ theme }) => theme.spacing["3xl"]};
    text-align: center;
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
    color: ${({ theme }) => theme.text.secondary};
`;

const NetworkList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.md};
`;

const SettingsStack = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing["4xl"]};
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
`;

export const Settings = (): ReactElement => {
    const dispatch = useDispatch<AppDispatch>();

    const networks = useSelector(selectNetworks);
    const customNetworks = useSelector(selectCustomNetworks);

    const [values, setValues] = useState<INetworkFormValues>(
        createEmptyNetworkFormValues(),
    );
    const [fieldErrors, setFieldErrors] = useState<TNetworkFormFieldErrors>({});
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const resetForm = (): void => {
        setValues(createEmptyNetworkFormValues());
        setFieldErrors({});
        setConnectionError(null);
    };

    const handleValuesChange = (nextValues: INetworkFormValues): void => {
        setValues(nextValues);
        setFieldErrors((currentErrors) =>
            Object.keys(currentErrors).length
                ? getNetworkFormFieldErrors(
                      nextValues,
                      networks.map((network: Network) => network.name),
                  )
                : currentErrors,
        );

        if (connectionError) {
            setConnectionError(null);
        }
    };

    const handleCreate = async (): Promise<void> => {
        if (isCreating) {
            return;
        }

        const nextFieldErrors = getNetworkFormFieldErrors(
            values,
            networks.map((network: Network) => network.name),
        );

        if (Object.keys(nextFieldErrors).length) {
            setFieldErrors(nextFieldErrors);
            setConnectionError(null);

            return;
        }

        setFieldErrors({});
        setConnectionError(null);
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
            setConnectionError(
                getErrorMessage(createError, "Failed to create custom network"),
            );
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <SettingsStack>
            <Card>
                <CardHeader>
                    <CardTitle>Custom Network Configuration</CardTitle>
                </CardHeader>

                <CardContent>
                    <InfoBox>
                        <p>
                            Configure your custom network validator and read-only
                            nodes for local development or private networks.
                            Note: Predefined networks from the configuration file
                            cannot be edited here.
                        </p>
                    </InfoBox>

                    <NetworkFormFields
                        idPrefix="network"
                        values={values}
                        onChange={handleValuesChange}
                        disabled={isCreating}
                        fieldErrors={fieldErrors}
                    />

                    {connectionError && (
                        <NetworkFormError role="alert">
                            {connectionError}
                        </NetworkFormError>
                    )}

                    <ActionButtons>
                        <InlineButton
                            id="add-network-button"
                            variant="primary"
                            onClick={handleCreate}
                            loading={isCreating}
                        >
                            <span aria-hidden="true" style={{ display: "inline-flex" }}>
                                <FileIcon size={16} />
                            </span>
                            Save Custom Network
                        </InlineButton>

                        <InlineButton
                            id="reset-network-form-button"
                            variant="secondary"
                            onClick={resetForm}
                            disabled={isCreating}
                        >
                            Restore to default
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
                            No custom networks configured yet.
                        </EmptyState>
                    )}

                    {!!customNetworks.length && (
                        <NetworkList>
                            {customNetworks.map((network: Network) => (
                                <CustomNetworkCard
                                    key={network.id}
                                    network={network}
                                />
                            ))}
                        </NetworkList>
                    )}
                </CardContent>
            </Card>
        </SettingsStack>
    );
};

export default Settings;
