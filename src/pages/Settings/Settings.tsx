import { type ReactElement, useEffect, useState } from "react";
import { INetworkConfig } from "@asichain/asi-wallet-sdk";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
} from "components";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "store";
import {
    removeCustomNetwork,
    updateCustomNetwork,
} from "store/WalletsStore/thunks";
import { useSdkClient } from "sdk/SdkClientProvider";

const ConfigSection = styled.div`
    margin-bottom: 36px;
`;

const ConfigTitle = styled.h2`
    margin-bottom: 16px;
    color: ${({ theme }) => theme.text.primary};
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
`;

const Label = styled.label`
    font-weight: 500;
    color: ${({ theme }) => theme.text.secondary};
    margin-bottom: 8px;
`;

const DirectLinks = styled.div`
    padding: 16px 23px;
    background: ${({ theme }) => theme.surface};
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.border};
    max-width: 100%;
    box-sizing: border-box;

    @media (max-width: 768px) {
        padding: 14px 16px;
    }

    @media (max-width: 400px) {
        padding: 12px;
    }
`;

const LinkTitle = styled.div`
    color: ${({ theme }) => theme.text.primary};
    margin-bottom: 10px;
    line-height: 100%;
`;

const Link = styled.div`
    color: ${({ theme }) => theme.primary};
    margin-bottom: 10px;
    cursor: pointer;
    line-height: 1.4;

    /*
     * URLs can be much longer than the available container width.
     * Allow them to wrap instead of overflowing the page.
     */
    overflow-wrap: anywhere;
    word-break: break-word;

    &:hover {
        text-decoration: underline;
    }

    @media (max-width: 400px) {
        font-size: 14px;
    }
`;

const LastLink = styled(Link)`
    margin-bottom: 0;
`;

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
`;

const InlineInput = styled(Input)`
    height: 44px;
`;

const ActionButtons = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
`;

const InlineButton = styled(Button)`
    height: 44px;
`;

const StatusBadge = styled.span<{ $type: "default" | "custom" | "busy" }>`
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    margin-left: 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;

    color: ${({ theme }) => theme.text.primary};
    background: ${({ theme, $type }) => {
        if ($type === "busy") {
            return `${theme.warning}20`;
        }

        if ($type === "custom") {
            return `${theme.primary}20`;
        }

        return `${theme.info}20`;
    }};
`;

const UPDATE_DEBOUNCE_MS = 500;

export const Settings = (): ReactElement => {
    const { client, isNetworkBusy } = useSdkClient();

    const dispatch = useDispatch<AppDispatch>();

    const { networks, selectedNetwork } = useSelector(
        (state: RootState) => state.walletsStore,
    );

    const [name, setName] = useState("");
    const [config, setConfig] = useState<INetworkConfig | null>(null);

    useEffect(() => {
        if (!selectedNetwork) {
            setName("");
            setConfig(null);
            return;
        }

        setName(selectedNetwork.name);
        setConfig({
            ValidatorURL: selectedNetwork.validatorUrl,
            ReadOnlyURL: selectedNetwork.observerUrl,
            IndexerURL: selectedNetwork.indexerUrl,
            nodeApiProfile: selectedNetwork.nodeApiProfile,
        });
    }, [selectedNetwork]);

    useEffect(() => {
        if (!selectedNetwork || selectedNetwork.isDefault || !config) {
            return;
        }

        const hasNameChanged = name !== selectedNetwork.name;
        const hasConfigChanged =
            JSON.stringify(config) !==
            JSON.stringify({
                ValidatorURL: selectedNetwork.validatorUrl,
                ReadOnlyURL: selectedNetwork.observerUrl,
                IndexerURL: selectedNetwork.indexerUrl,
                nodeApiProfile: selectedNetwork.nodeApiProfile,
            });

        if (!hasNameChanged && !hasConfigChanged) {
            return;
        }

        const timeout = window.setTimeout(() => {
            dispatch(
                updateCustomNetwork({
                    id: selectedNetwork.id,
                    update: {
                        name,
                        config,
                    },
                }),
            )
                .unwrap()
                .catch((error: unknown) => {
                    console.error("Failed to update network:", error);
                });
        }, UPDATE_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [name, config, selectedNetwork]);

    if (!selectedNetwork || !config) {
        return <div>No network selected</div>;
    }

    const isEditable = !selectedNetwork.isDefault && !isNetworkBusy;

    const updateConfig = (field: keyof INetworkConfig, value: string): void => {
        setConfig((previous) => {
            if (!previous) {
                return previous;
            }

            return {
                ...previous,
                [field]: value,
            };
        });
    };

    const handleRemove = async (): Promise<void> => {
        const hasReservations = client.hasNetworkReservations(
            selectedNetwork.id,
        );

        let message = `Remove network "${selectedNetwork.name}"?`;

        if (hasReservations) {
            message +=
                "\n\nThis network has pending reservations and they lose " +
                "their tracking: the locked amount returns to the available " +
                "balance and the pending rows disappear from history until " +
                "the indexer reports them as executed.";
        }

        if (!window.confirm(message)) {
            return;
        }

        try {
            await dispatch(removeCustomNetwork({ id: selectedNetwork.id }));
        } catch (error) {
            console.error("Failed to remove network:", error);

            alert((error as Error)?.message ?? "Failed to remove network");
        }
    };

    const openLink = (url?: string): void => {
        if (!url) {
            return;
        }

        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <Card style={{ marginBottom: "43px" }}>
            <CardHeader>
                <CardTitle>
                    Network Configuration
                    <StatusBadge
                        $type={selectedNetwork.isDefault ? "default" : "custom"}
                    >
                        {selectedNetwork.isDefault ? "Default" : "Custom"}
                    </StatusBadge>
                    {isNetworkBusy && (
                        <StatusBadge $type="busy">Busy</StatusBadge>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <InfoBox>
                    <p className="text-2" style={{ marginBottom: "0.5rem" }}>
                        {selectedNetwork.isDefault
                            ? "This is a predefined network. Its configuration cannot be edited."
                            : "Configure this custom network for local development or private networks."}
                    </p>

                    {isNetworkBusy && (
                        <p className="text-2">
                            An operation is currently in progress. Network
                            configuration is temporarily locked.
                        </p>
                    )}
                </InfoBox>

                <ConfigSection>
                    <Label>
                        <h4>Network Name</h4>
                    </Label>

                    <InlineInput
                        id="network-name-input"
                        className="network-name-input text-2"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        disabled={!isEditable}
                    />
                </ConfigSection>

                <ConfigSection>
                    <ConfigTitle>Network Endpoints</ConfigTitle>

                    <FormRow>
                        <FormGroup>
                            <Label>
                                <h4>Validator URL:</h4>
                            </Label>

                            <InlineInput
                                id="network-validator-url-input"
                                className="network-validator-url-input text-2"
                                value={config.ValidatorURL || ""}
                                onChange={(event) =>
                                    updateConfig(
                                        "ValidatorURL",
                                        event.target.value,
                                    )
                                }
                                disabled={!isEditable}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>
                                <h4>Read-only URL:</h4>
                            </Label>

                            <InlineInput
                                id="network-readonly-url-input"
                                className="network-readonly-url-input text-2"
                                value={config.ReadOnlyURL || ""}
                                onChange={(event) =>
                                    updateConfig(
                                        "ReadOnlyURL",
                                        event.target.value,
                                    )
                                }
                                disabled={!isEditable}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>
                                <h4>Indexer URL:</h4>
                            </Label>

                            <InlineInput
                                id="network-indexer-url-input"
                                className="network-indexer-url-input text-2"
                                value={config.IndexerURL || ""}
                                onChange={(event) =>
                                    updateConfig(
                                        "IndexerURL",
                                        event.target.value,
                                    )
                                }
                                disabled={!isEditable}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>
                                <h4>Node API:</h4>
                            </Label>

                            <InlineInput
                                id="network-node-api-input"
                                className="network-node-api-input text-2"
                                value={config.nodeApiProfile || ""}
                                onChange={(event) =>
                                    updateConfig(
                                        "nodeApiProfile",
                                        event.target.value,
                                    )
                                }
                                disabled={!isEditable}
                            />
                        </FormGroup>
                    </FormRow>
                </ConfigSection>

                <ConfigSection>
                    <ConfigTitle>Direct Links</ConfigTitle>

                    <DirectLinks>
                        <LinkTitle>Available endpoints:</LinkTitle>

                        {config.ValidatorURL && (
                            <Link
                                className="text-2"
                                onClick={() => openLink(config.ValidatorURL)}
                            >
                                Validator: {config.ValidatorURL}
                            </Link>
                        )}

                        {config.ReadOnlyURL && (
                            <Link
                                className="text-2"
                                onClick={() => openLink(config.ReadOnlyURL)}
                            >
                                Read-only: {config.ReadOnlyURL}
                            </Link>
                        )}

                        {config.IndexerURL && (
                            <LastLink
                                className="text-2"
                                onClick={() => openLink(config.IndexerURL)}
                            >
                                Indexer: {config.IndexerURL}
                            </LastLink>
                        )}
                    </DirectLinks>
                </ConfigSection>

                {!selectedNetwork.isDefault && (
                    <ActionButtons>
                        <InlineButton
                            variant="secondary"
                            onClick={handleRemove}
                            disabled={isNetworkBusy}
                        >
                            <h3>Remove Network</h3>
                        </InlineButton>
                    </ActionButtons>
                )}
            </CardContent>
        </Card>
    );
};
