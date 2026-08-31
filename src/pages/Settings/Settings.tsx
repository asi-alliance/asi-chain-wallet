import styled from "styled-components";
import { type ReactElement, useState } from "react";
import { INetworkConfig, NodeApiProfile } from "@asichain/asi-wallet-sdk";
import { useDispatch, useSelector } from "react-redux";
import { CustomNetworkCard } from "components/CustomNetworkCard";
import { AppDispatch, RootState } from "store";
import { addCustomNetwork } from "store/WalletsStore/thunks";
import { AdaptiveSelect, ISelectOption } from "components/Select/Select";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
} from "components";

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

    @media (max-width: 400px) {
        padding: 12px;
    }
`;

const InlineInput = styled(Input)`
    height: 44px;
    max-width: 100%;
    box-sizing: border-box;
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

const DEFAULT_NETWORK_NAME = "Custom Network";

const nodeApiProfileOptions: ISelectOption[] = [
    {
        id: "rust",
        value: "rust",
        label: "Rust",
    },
    {
        id: "scala",
        value: "scala",
        label: "Scala",
    },
];

export const Settings = (): ReactElement => {
    const dispatch = useDispatch<AppDispatch>();

    const { networks } = useSelector((state: RootState) => state.walletsStore);

    const [name, setName] = useState(DEFAULT_NETWORK_NAME);
    const [config, setConfig] = useState<INetworkConfig>({
        ValidatorURL: "",
        ReadOnlyURL: "",
        IndexerURL: "",
        nodeApiProfile: NodeApiProfile.RUST,
    });

    const [isCreating, setIsCreating] = useState(false);

    const customNetworks = networks.filter((network) => !network.isDefault);

    const updateConfig = (field: keyof INetworkConfig, value: string): void => {
        setConfig((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const resetForm = (): void => {
        setName(DEFAULT_NETWORK_NAME);
        setConfig({
            ValidatorURL: "",
            ReadOnlyURL: "",
            IndexerURL: "",
            nodeApiProfile: NodeApiProfile.RUST,
        });
    };

    const handleCreate = async (): Promise<void> => {
        if (isCreating) {
            return;
        }

        if (!name.trim()) {
            alert("Network name is required");
            return;
        }

        try {
            setIsCreating(true);

            await dispatch(
                addCustomNetwork({
                    name: name.trim(),
                    config: {
                        ValidatorURL: config.ValidatorURL?.trim() ?? "",
                        ReadOnlyURL: config.ReadOnlyURL?.trim() ?? "",
                        IndexerURL: config.IndexerURL?.trim() ?? "",
                        nodeApiProfile:
                            config.nodeApiProfile ?? NodeApiProfile.RUST,
                    },
                }),
            ).unwrap();

            resetForm();
        } catch (error) {
            console.error("Failed to create custom network:", error);

            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to create custom network",
            );
        } finally {
            setIsCreating(false);
        }
    };

    const handleReset = (): void => {
        resetForm();
    };

    const openLink = (url?: string): void => {
        if (!url) {
            return;
        }

        window.open(url, "_blank", "noopener,noreferrer");
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

                    <ConfigSection>
                        <Label>
                            <h4>Network Name</h4>
                        </Label>

                        <InlineInput
                            id="network-name-input"
                            className="network-name-input text-2"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder={DEFAULT_NETWORK_NAME}
                            disabled={isCreating}
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
                                    placeholder="http://localhost:40403"
                                    disabled={isCreating}
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
                                    placeholder="http://localhost:40453"
                                    disabled={isCreating}
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
                                    placeholder="http://localhost:3000"
                                    disabled={isCreating}
                                />
                            </FormGroup>

                            <FormGroup>
                                <Label>
                                    <h4>Node API:</h4>
                                </Label>

                                <AdaptiveSelect
                                    id="network-node-api-select"
                                    value={config.nodeApiProfile || "rust"}
                                    onChange={(value) =>
                                        updateConfig("nodeApiProfile", value)
                                    }
                                    options={nodeApiProfileOptions}
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
                                    onClick={() =>
                                        openLink(config.ValidatorURL)
                                    }
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

                            {!config.ValidatorURL &&
                                !config.ReadOnlyURL &&
                                !config.IndexerURL && (
                                    <span className="text-2">
                                        No endpoints configured.
                                    </span>
                                )}
                        </DirectLinks>
                    </ConfigSection>

                    <ActionButtons>
                        <InlineButton
                            variant="primary"
                            onClick={handleCreate}
                            disabled={isCreating}
                        >
                            <h3>
                                {isCreating
                                    ? "Creating..."
                                    : "Add Custom Network"}
                            </h3>
                        </InlineButton>

                        <InlineButton
                            variant="secondary"
                            onClick={handleReset}
                            disabled={isCreating}
                        >
                            <h3>Restore to default</h3>
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
                    {!!customNetworks.length &&
                        customNetworks.map((network) => (
                            <CustomNetworkCard
                                key={network.id}
                                network={network}
                                onEdit={(network) => {
                                    console.info("Edit network:", network);
                                }}
                            />
                        ))}
                </CardContent>
            </Card>
        </>
    );
};

export default Settings;
