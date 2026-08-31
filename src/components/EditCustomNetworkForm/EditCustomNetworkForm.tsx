import React, { type CSSProperties, useEffect, useState } from "react";
import styled from "styled-components";
import { Button, Input } from "components";
import { FileIcon } from "components/Icons";
import { useScreen } from "hooks";
import {
    DEFAULT_NODE_API_PROFILE,
    INetworkConfig,
    NetworkName,
    NODE_API_PROFILE_DESCRIPTORS,
    validateUrl,
} from "@asichain/asi-wallet-sdk";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store";
import { updateCustomNetwork } from "store/WalletsStore/thunks";
import { Network } from "types/wallet";
import { AdaptiveSelect } from "components/Select";

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

const InlineInput = styled(Input)`
    height: 44px;
    width: 100%;
`;

const AutoWidthInput = styled(InlineInput)`
    width: auto;

    @media (max-width: 768px) {
        width: 100%;
    }
`;

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

const ErrorMessage = styled.div`
    margin-top: 16px;
    padding: 12px 16px;
    border-radius: 6px;
    color: ${({ theme }) => theme.error};
    background: ${({ theme }) => `${theme.error}15`};
    border: 1px solid ${({ theme }) => theme.error};
`;

const NodeApiSelectWrapper = styled.div`
    max-width: 300px;

    @media (max-width: 768px) {
        max-width: none;
    }
`;

interface EditCustomNetworkFormProps {
    network: Network;
    onSuccess?: (network: Network) => void;
    onCancel: () => void;
}

export const EditCustomNetworkForm: React.FC<EditCustomNetworkFormProps> = ({
    network,
    onSuccess,
    onCancel,
}) => {
    const { isLaptop } = useScreen();
    const dispatch = useDispatch<AppDispatch>();

    const [networkName, setNetworkName] = useState<NetworkName>(network.name);

    const [config, setConfig] = useState<INetworkConfig>({
        ValidatorURL: network.validatorUrl ?? "",
        ReadOnlyURL: network.observerUrl ?? "",
        IndexerURL: network.indexerUrl ?? "",
        nodeApiProfile: network.nodeApiProfile ?? DEFAULT_NODE_API_PROFILE,
    });

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setNetworkName(network.name);

        setConfig({
            ValidatorURL: network.validatorUrl ?? "",
            ReadOnlyURL: network.observerUrl ?? "",
            IndexerURL: network.indexerUrl ?? "",
            nodeApiProfile: network.nodeApiProfile ?? DEFAULT_NODE_API_PROFILE,
        });

        setError(null);
    }, [network]);

    const updateConfig = (field: keyof INetworkConfig, value: string): void => {
        setConfig((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleSave = async (): Promise<void> => {
        if (isLoading) {
            return;
        }

        const name = networkName.trim();

        if (!name) {
            setError("Network name is required.");
            return;
        }

        const urlFields = [
            {
                label: "Validator URL",
                value: config.ValidatorURL,
            },
            {
                label: "Read-only URL",
                value: config.ReadOnlyURL,
            },
            {
                label: "Indexer URL",
                value: config.IndexerURL,
            },
        ];

        for (const { label, value } of urlFields) {
            const { isValid, error: validationError } = validateUrl(value);

            if (!isValid) {
                setError(`${label}: ${validationError}`);
                return;
            }
        }

        setError(null);
        setIsLoading(true);

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

            const updatedNetwork: Network = {
                ...network,
                name,
                validatorUrl: config.ValidatorURL,
                observerUrl: config.ReadOnlyURL,
                indexerUrl: config.IndexerURL,
                nodeApiProfile: config.nodeApiProfile,
                isDefault: false,
            };

            onSuccess?.(updatedNetwork);
        } catch (error) {
            console.error("Failed to update custom network:", error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to update custom network",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const openLink = (url?: string): void => {
        if (!url) {
            return;
        }

        window.open(url, "_blank", "noopener,noreferrer");
    };

    const nodeApiOptions = Object.values(NODE_API_PROFILE_DESCRIPTORS).map(
        (descriptor) => ({
            id: descriptor.profile,
            value: descriptor.profile,
            label: descriptor.label,
            additionalLabel: descriptor.stability,
        }),
    );

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
            <ConfigSection>
                <Label>
                    <h4>Network Name</h4>
                </Label>

                <AutoWidthInput
                    id="edit-network-name-input"
                    className="network-name-input text-2"
                    value={networkName}
                    onChange={(event) => setNetworkName(event.target.value)}
                    disabled={isLoading}
                />
            </ConfigSection>

            <ConfigSection>
                <ConfigTitle>Node API Profile</ConfigTitle>
                <NodeApiSelectWrapper>
                    <AdaptiveSelect
                        id="edit-network-node-api-select"
                        value={config.nodeApiProfile}
                        onChange={(value) =>
                            updateConfig("nodeApiProfile", value)
                        }
                        disabled={isLoading}
                        options={nodeApiOptions}
                    />
                </NodeApiSelectWrapper>
            </ConfigSection>

            <ConfigSection>
                <ConfigTitle>Network Endpoints</ConfigTitle>

                <FormRow>
                    <FormGroup>
                        <Label>
                            <h4>Validator URL:</h4>
                        </Label>

                        <InlineInput
                            id="edit-network-validator-url-input"
                            className="text-2"
                            value={config.ValidatorURL}
                            onChange={(event) =>
                                updateConfig("ValidatorURL", event.target.value)
                            }
                            disabled={isLoading}
                            placeholder="https://validator.example.com"
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>
                            <h4>Read-only URL:</h4>
                        </Label>

                        <InlineInput
                            id="edit-network-readonly-url-input"
                            className="text-2"
                            value={config.ReadOnlyURL}
                            onChange={(event) =>
                                updateConfig("ReadOnlyURL", event.target.value)
                            }
                            disabled={isLoading}
                            placeholder="https://observer.example.com"
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>
                            <h4>Indexer URL:</h4>
                        </Label>

                        <InlineInput
                            id="edit-network-indexer-url-input"
                            className="text-2"
                            value={config.IndexerURL}
                            onChange={(event) =>
                                updateConfig("IndexerURL", event.target.value)
                            }
                            disabled={isLoading}
                            placeholder="https://indexer.example.com/v1/graphql"
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

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <CustomNetworkActionsButtons>
                <InlineButton
                    variant="primary"
                    onClick={handleSave}
                    loading={isLoading}
                    style={saveButtonStyle}
                >
                    Save Custom Network
                    <FileIcon />
                </InlineButton>

                <InlineButton
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isLoading}
                    style={{ flex: "1" }}
                >
                    Cancel
                </InlineButton>
            </CustomNetworkActionsButtons>
        </>
    );
};
