import React, { useState, useEffect, CSSProperties } from "react";
import styled from "styled-components";
import { Input, Button } from "components";
import { Network } from "types/wallet";
import { FileIcon } from "components/Icons";
import { useScreen } from "hooks";

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
`;

const ModalContainer = styled.div`
    background: ${({ theme }) => theme.card};
    border-radius: 12px;
    max-width: 800px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: ${({ theme }) => theme.surface};
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.border};
        border-radius: 4px;
    }
`;

const ModalContent = styled.div`
    padding: 24px;
`;

const Title = styled.h3`
    font-size: 20px;
    font-weight: 600;
    color: ${({ theme }) => theme.text.primary};
    margin-bottom: 8px;
`;

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
`;

interface EditCustomNetworkModalProps {
    isOpen: boolean;
    network: Network | null;
    isActive: boolean;
    onClose: () => void;
    onSave: (network: Network) => void;
    loading?: boolean;
}

export const EditCustomNetworkModal: React.FC<EditCustomNetworkModalProps> = ({
    isOpen,
    network,
    isActive,
    onClose,
    onSave,
    loading = false,
}) => {
    const { isLaptop } = useScreen();

    const [validatorHost, setValidatorHost] = useState("localhost");
    const [validatorHttpPort, setValidatorHttpPort] = useState("40403");
    const [validatorGrpcPort, setValidatorGrpcPort] = useState("40401");
    const [networkName, setNetworkName] = useState("Custom Network");
    const [readOnlyHost, setReadOnlyHost] = useState("localhost");
    const [readOnlyHttpPort, setReadOnlyHttpPort] = useState("40453");
    const [readOnlyGrpcPort, setReadOnlyGrpcPort] = useState("40451");

    useEffect(() => {
        if (network && isOpen) {
            setNetworkName(network.name);

            // Parse validator URL
            if (network.url) {
                try {
                    const validatorUrl = new URL(network.url);
                    setValidatorHost(validatorUrl.hostname || "localhost");
                    setValidatorHttpPort(validatorUrl.port || "40403");
                } catch {
                    // If URL parsing fails, try to extract from string
                    const parts = network.url.split(":");
                    if (parts.length >= 2) {
                        setValidatorHost(parts[1].replace("//", ""));
                        setValidatorHttpPort(parts[2] || "40403");
                    }
                }
            }

            // Parse readOnly URL
            if (network.readOnlyUrl) {
                try {
                    const readOnlyUrl = new URL(network.readOnlyUrl);
                    setReadOnlyHost(readOnlyUrl.hostname || "localhost");
                    setReadOnlyHttpPort(readOnlyUrl.port || "40453");
                } catch {
                    const parts = network.readOnlyUrl.split(":");
                    if (parts.length >= 2) {
                        setReadOnlyHost(parts[1].replace("//", ""));
                        setReadOnlyHttpPort(parts[2] || "40453");
                    }
                }
            }
        }
    }, [network, isOpen]);

    const validatorGrpcUrl = `${validatorHost}:${validatorGrpcPort}`;
    const validatorHttpUrl = `http://${validatorHost}:${validatorHttpPort}`;
    const readOnlyGrpcUrl = `${readOnlyHost}:${readOnlyGrpcPort}`;
    const readOnlyHttpUrl = `http://${readOnlyHost}:${readOnlyHttpPort}`;

    const handleSave = () => {
        if (!network) return;

        const updatedNetwork: Network = {
            ...network,
            name: networkName,
            url: `http://${validatorHost}:${validatorHttpPort}`,
            readOnlyUrl: `http://${readOnlyHost}:${readOnlyHttpPort}`,
        };

        onSave(updatedNetwork);
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen || !network) return null;

    const saveCustomNetworkButtonStyle: CSSProperties = !isLaptop
        ? {
              minWidth: "252px",
              flex: "1",
          }
        : { flex: "1" };

    return (
        <Overlay onClick={handleClose}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ModalContent>
                    <Title>
                        <h1>Edit Custom Network</h1>
                    </Title>
                    <ConfigSection>
                        <Label>Network Name</Label>
                        <AutoWidthInput
                            id="edit-network-name-input"
                            className="network-name-input text-2"
                            value={networkName}
                            onChange={(e) => setNetworkName(e.target.value)}
                            placeholder="Custom Network"
                        />
                    </ConfigSection>

                    <ConfigSection>
                        <ConfigTitle>
                            <h2>Validator Node</h2>
                        </ConfigTitle>
                        <FormRow>
                            <FormGroup>
                                <Label>IP/Domain:</Label>
                                <InlineInput
                                    id="edit-validator-host-input"
                                    className="text-2"
                                    value={validatorHost}
                                    onChange={(e) =>
                                        setValidatorHost(e.target.value)
                                    }
                                    placeholder="localhost"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>gRPC Port:</Label>
                                <InlineInput
                                    id="edit-validator-grpc-port-input"
                                    className="text-2"
                                    value={validatorGrpcPort}
                                    onChange={(e) =>
                                        setValidatorGrpcPort(e.target.value)
                                    }
                                    placeholder="40401"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>HTTP Port:</Label>
                                <InlineInput
                                    id="edit-validator-http-port-input"
                                    className="text-2"
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
                                <Label>IP/Domain:</Label>
                                <InlineInput
                                    id="edit-readonly-host-input"
                                    className="text-2"
                                    value={readOnlyHost}
                                    onChange={(e) =>
                                        setReadOnlyHost(e.target.value)
                                    }
                                    placeholder="localhost"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>gRPC Port:</Label>
                                <InlineInput
                                    id="edit-readonly-grpc-port-input"
                                    className="text-2"
                                    value={readOnlyGrpcPort}
                                    onChange={(e) =>
                                        setReadOnlyGrpcPort(e.target.value)
                                    }
                                    placeholder="40451"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>HTTP Port:</Label>
                                <InlineInput
                                    id="edit-readonly-http-port-input"
                                    className="text-2"
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

                    <CustomNetworkActionsButtons>
                        <InlineButton
                            variant="primary"
                            onClick={handleSave}
                            loading={loading}
                            style={saveCustomNetworkButtonStyle}
                        >
                            Save Custom Network
                            <FileIcon />
                        </InlineButton>
                        <InlineButton
                            variant="secondary"
                            onClick={handleClose}
                            disabled={loading}
                            style={{ flex: "1" }}
                        >
                            Cancel
                        </InlineButton>
                    </CustomNetworkActionsButtons>
                </ModalContent>
            </ModalContainer>
        </Overlay>
    );
};
