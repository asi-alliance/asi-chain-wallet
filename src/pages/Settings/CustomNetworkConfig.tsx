import React, { useState, useEffect, Fragment } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store";
import { updateNetwork, addNetwork } from "store/walletSlice";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
} from "components";
import { Network } from "types/wallet";
import { FileIcon } from "components/Icons";
import { CustomNetworkCard } from "components/CustomNetworkCard";

const ConfigSection = styled.div`
    margin-bottom: 36px;
`;

const ConfigTitle = styled.h3`
    // font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: ${({ theme }) => theme.text.primary};
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 16px;

    @media (max-width: 768px) {
        display: block;
        gap: 12px;
    }
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;

    @media (max-width: 768px) {
        &:first-child {
            grid-column: 1 / -1;
        }

        &:nth-child(2),
        &:nth-child(3) {
            display: inline-block;
            width: calc(50% - 6px);
        }

        &:nth-child(2) {
            margin-right: 6px;
        }

        &:nth-child(3) {
            margin-left: 6px;
        }
    }
`;

const Label = styled.label`
    // font-size: 14px;
    font-weight: 500;
    color: ${({ theme }) => theme.text.secondary};
    margin-bottom: 8px;
`;

const DirectLinks = styled.div`
    padding: 16px 23px;
    background: ${({ theme }) => theme.surface};
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.border};
`;

const LinkTitle = styled.div`
    color: ${({ theme }) => theme.text.primary};
    margin-bottom: 10px;
    line-height: 100%;
`;

const Link = styled.div`
    // font-size: 13px;
    color: ${({ theme }) => theme.primary};
    margin-bottom: 10px;
    cursor: pointer;
    line-height: 100%;

    &:hover {
        text-decoration: underline;
    }
`;

const LastLink = styled(Link)`
    margin-bottom: 0;
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 24px;

    @media (max-width: 768px) {
        flex-direction: column;
        padding: 0 30px;
    }
`;

const InfoBox = styled.div`
    background: ${({ theme }) => theme.info}20;
    border: 1px solid ${({ theme }) => theme.info};
    border-radius: 8px;
    padding: 16px 23px;
    margin-bottom: 24px;

    h3 {
        margin: 0 0 8px 0;
        color: ${({ theme }) => theme.info};
    }

    p {
        margin: 0;
        // font-size: 14px;
        color: ${({ theme }) => theme.text.primary};
    }
`;

const InlineInput = styled(Input)`
    height: 44px;
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

const initialNetworkSettings = {
    host: "localhost",
    validatorHost: "localhost",
    validatorHttpPort: "40403",
    validatorGrpcPort: "40401",
    networkName: "Custom Network",
    readOnlyHost: "localhost",
    readOnlyHttpPort: "40453",
    readOnlyGrpcPort: "40451",
};

export const CustomNetworkConfig: React.FC = () => {
    const dispatch = useDispatch();
    const { networks, selectedNetwork } = useSelector(
        (state: RootState) => state.wallet,
    );

    const [validatorHost, setValidatorHost] = useState(
        initialNetworkSettings.validatorHost,
    );
    const [validatorHttpPort, setValidatorHttpPort] = useState(
        initialNetworkSettings.validatorHttpPort,
    );
    const [validatorGrpcPort, setValidatorGrpcPort] = useState(
        initialNetworkSettings.validatorGrpcPort,
    );
    const [networkName, setNetworkName] = useState(
        initialNetworkSettings.networkName,
    );
    const [readOnlyHost, setReadOnlyHost] = useState(
        initialNetworkSettings.readOnlyHost,
    );
    const [readOnlyHttpPort, setReadOnlyHttpPort] = useState(
        initialNetworkSettings.readOnlyHttpPort,
    );
    const [readOnlyGrpcPort, setReadOnlyGrpcPort] = useState(
        initialNetworkSettings.readOnlyGrpcPort,
    );

    const [activeCustomId, setActiveCustomId] = useState<string>("custom");

    const customNetworks = networks.filter((n) => n.id?.startsWith("custom"));

    useEffect(() => {
        const existing = customNetworks.find((n) => n.id === activeCustomId);
        if (!existing) return;

        if (existing.url) {
            try {
                const validatorUrl = new URL(existing.url);
                setValidatorHost(validatorUrl.hostname || "localhost");
                setValidatorHttpPort(validatorUrl.port || "40403");
            } catch {}
        }
        if (existing.readOnlyUrl) {
            try {
                const readOnlyUrl = new URL(existing.readOnlyUrl);
                setReadOnlyHost(readOnlyUrl.hostname || "localhost");
                setReadOnlyHttpPort(readOnlyUrl.port || "40453");
            } catch {}
        }
    }, [activeCustomId, customNetworks]);

    const handleSave = () => {
        const data: Network = {
            name: networkName || "Custom Network",
            id: activeCustomId || "custom",
            url: `http://${validatorHost}:${validatorHttpPort}`,
            readOnlyUrl: `http://${readOnlyHost}:${readOnlyHttpPort}`,
        };

        const exists = customNetworks.some((n) => n.id === data.id);
        if (exists) {
            dispatch(updateNetwork(data));
        } else {
            const id = data.id.startsWith("custom-")
                ? data.id
                : `custom-${Date.now()}`;
            dispatch(addNetwork({ ...data, id }));
        }

        setValidatorHost("localhost");
        setValidatorHttpPort("40403");
        setValidatorGrpcPort("40401");
        setReadOnlyHost("localhost");
        setReadOnlyHttpPort("40453");
        setReadOnlyGrpcPort("40451");
        setActiveCustomId("custom");
    };

    const handleRestoreToDefault = () => {
        setValidatorHost(initialNetworkSettings.validatorHost);
        setValidatorHttpPort(initialNetworkSettings.validatorHttpPort);
        setValidatorGrpcPort(initialNetworkSettings.validatorGrpcPort);
        setNetworkName(initialNetworkSettings.networkName);
        setReadOnlyHost(initialNetworkSettings.readOnlyHost);
        setReadOnlyHttpPort(initialNetworkSettings.readOnlyHttpPort);
        setReadOnlyGrpcPort(initialNetworkSettings.readOnlyGrpcPort);
    };

    const handleAfterCustomNetworkDelete = (id: string) => {
        if (activeCustomId === id) {
            const remaining = customNetworks.filter((n) => n.id !== id);
            setActiveCustomId(remaining[0]?.id || "custom");
        }
    };

    const validatorGrpcUrl = `${validatorHost}:${validatorGrpcPort}`;
    const validatorHttpUrl = `http://${validatorHost}:${validatorHttpPort}`;
    const readOnlyGrpcUrl = `${readOnlyHost}:${readOnlyGrpcPort}`;
    const readOnlyHttpUrl = `http://${readOnlyHost}:${readOnlyHttpPort}`;

    return (
        <Fragment>
            <Card style={{ marginBottom: "43px" }}>
                <CardHeader>
                    <CardTitle>
                        <h1>Custom Network Configuration</h1>
                        {selectedNetwork.id === "custom" && (
                            <span
                                style={{
                                    fontSize: "12px",
                                    marginLeft: "8px",
                                    color: "#4caf50",
                                }}
                            >
                                (Active)
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <InfoBox>
                        <p
                            className="text-2"
                            style={{ marginBottom: "0.5rem" }}
                        >
                            Configure your custom network validator and
                            read-only nodes for local development or private
                            networks.
                        </p>
                        <p className="text-2">
                            Note: Predefined networks from the configuration
                            file cannot be edited here.
                        </p>
                    </InfoBox>

                    <ConfigSection>
                        <Label>
                            <h4>Network Name</h4>
                        </Label>
                        <AutoWidthInput
                            id="network-name-input"
                            className="network-name-input text-2"
                            value={networkName}
                            onChange={(e) => setNetworkName(e.target.value)}
                        />
                    </ConfigSection>

                    <ConfigSection>
                        <ConfigTitle>
                            <h2>Validator Node</h2>
                        </ConfigTitle>

                        <FormRow>
                            <FormGroup>
                                <Label>
                                    <h4>IP/Domain:</h4>
                                </Label>
                                <InlineInput
                                    id="network-validator-host-input"
                                    className="network-validator-host-input text-2"
                                    value={validatorHost}
                                    onChange={(e) =>
                                        setValidatorHost(e.target.value)
                                    }
                                    placeholder="localhost"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>
                                    <h4>gRPC Port:</h4>
                                </Label>
                                <InlineInput
                                    id="network-validator-grpc-port-input"
                                    className="network-validator-grpc-port-input text-2"
                                    value={validatorGrpcPort}
                                    onChange={(e) =>
                                        setValidatorGrpcPort(e.target.value)
                                    }
                                    placeholder="40401"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>
                                    <h4>HTTP Port:</h4>
                                </Label>
                                <InlineInput
                                    id="network-validator-http-port-input"
                                    className="network-validator-http-port-input text-2"
                                    value={validatorHttpPort}
                                    onChange={(e) =>
                                        setValidatorHttpPort(e.target.value)
                                    }
                                    placeholder="40403"
                                />
                            </FormGroup>
                        </FormRow>

                        <DirectLinks>
                            <LinkTitle>Direct links:</LinkTitle>
                            <Link
                                className="text-2"
                                onClick={() =>
                                    window.open(
                                        `${validatorHttpUrl}/status`,
                                        "_blank",
                                    )
                                }
                            >
                                gRPC: {validatorGrpcUrl}
                            </Link>
                            <LastLink
                                className="text-2"
                                onClick={() =>
                                    window.open(validatorHttpUrl, "_blank")
                                }
                            >
                                HTTP: {validatorHttpUrl}
                            </LastLink>
                        </DirectLinks>
                    </ConfigSection>

                    <ConfigSection>
                        <ConfigTitle>
                            <h2>Read-only Node</h2>
                        </ConfigTitle>

                        <FormRow>
                            <FormGroup>
                                <Label>
                                    <h4>IP/Domain:</h4>
                                </Label>
                                <InlineInput
                                    id="network-readonly-host-input"
                                    className="network-readonly-host-input text-2"
                                    value={readOnlyHost}
                                    onChange={(e) =>
                                        setReadOnlyHost(e.target.value)
                                    }
                                    placeholder="localhost"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>
                                    <h4>gRPC Port:</h4>
                                </Label>
                                <InlineInput
                                    id="network-readonly-grpc-port-input"
                                    className="network-readonly-grpc-port-input text-2"
                                    value={readOnlyGrpcPort}
                                    onChange={(e) =>
                                        setReadOnlyGrpcPort(e.target.value)
                                    }
                                    placeholder="40451"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>
                                    <h4>HTTP Port:</h4>
                                </Label>
                                <InlineInput
                                    id="network-readonly-http-port-input"
                                    className="network-readonly-http-port-input text-2"
                                    value={readOnlyHttpPort}
                                    onChange={(e) =>
                                        setReadOnlyHttpPort(e.target.value)
                                    }
                                    placeholder="40453"
                                />
                            </FormGroup>
                        </FormRow>

                        <DirectLinks>
                            <LinkTitle>Direct links:</LinkTitle>
                            <Link
                                className="text-2"
                                onClick={() =>
                                    window.open(
                                        `${readOnlyHttpUrl}/status`,
                                        "_blank",
                                    )
                                }
                            >
                                gRPC: {readOnlyGrpcUrl}
                            </Link>
                            <Link
                                className="text-2"
                                onClick={() =>
                                    window.open(readOnlyHttpUrl, "_blank")
                                }
                            >
                                HTTP: {readOnlyHttpUrl}
                            </Link>
                        </DirectLinks>
                    </ConfigSection>

                    <ActionButtons>
                        <InlineButton variant="primary" onClick={handleSave}>
                            <h3>Save Custom Network</h3>
                            <FileIcon />
                        </InlineButton>
                        <InlineButton
                            variant="secondary"
                            onClick={handleRestoreToDefault}
                        >
                            <h3>Restore to default</h3>
                        </InlineButton>
                    </ActionButtons>
                </CardContent>
            </Card>

            {customNetworks.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <h1>Existing Custom Networks</h1>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {customNetworks.map((net) => (
                            <CustomNetworkCard
                                key={net.id}
                                network={net}
                                onEdit={(net) => {
                                    console.log("Edit network:", net);
                                }}
                                onDelete={handleAfterCustomNetworkDelete}
                            />
                        ))}
                    </CardContent>
                </Card>
            )}
        </Fragment>
    );
};
