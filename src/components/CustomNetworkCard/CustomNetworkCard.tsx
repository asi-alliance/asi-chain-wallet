import React, { Fragment, useState } from "react";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import { Button } from "components";
import { DeleteIcon, EditIcon } from "components/Icons";
import { DeleteCustomNetworkModal } from "components/DeleteCustomNetworkModal";
import { EditCustomNetworkModal } from "components/EditCustomNetworkModal";
import { AppDispatch } from "store";
import { removeCustomNetwork } from "store/WalletsStore/thunks";
import { Network } from "types/wallet";
import { useIsNetworkBusy } from "sdk";
import { getErrorMessage } from "@asichain/asi-wallet-sdk";

const NetworkItem = styled.div`
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: ${({ theme }) => theme.radii.md};
    padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing["3xl"]};
    min-width: 0;
    box-sizing: border-box;
    background: ${({ theme }) => theme.surface};
    box-shadow: ${({ theme }) => theme.shadowDrop};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
    }
`;

const NetworkHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.lg};
    margin-bottom: ${({ theme }) => theme.spacing.md};
    min-width: 0;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        align-items: flex-start;
        gap: ${({ theme }) => theme.spacing.md};
    }
`;

const NetworkTitleGroup = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.md};
    min-width: 0;
`;

const NetworkName = styled.div`
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.md};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
    color: ${({ theme }) => theme.text.primary};
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
`;

const NetworkId = styled.span`
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.xs};
    overflow-wrap: anywhere;
`;

const BusyStatus = styled.span`
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.xs};
`;

const NetworkActions = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.md};
    flex-shrink: 0;
`;

const NetworkUrls = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${({ theme }) => theme.spacing.lg};
    min-width: 0;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 1fr;
    }
`;

const NetworkUrl = styled.div`
    min-width: 0;
    overflow: hidden;
`;

const UrlLabel = styled.div`
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
    color: ${({ theme }) => theme.text.secondary};
    margin-bottom: ${({ theme }) => theme.spacing["2xs"]};
`;

const UrlValue = styled.div`
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
    color: ${({ theme }) => theme.text.primary};
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
`;

interface CustomNetworkCardProps {
    network: Network;
}

export const CustomNetworkCard: React.FC<CustomNetworkCardProps> = ({
    network,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const isNetworkBusy = useIsNetworkBusy(network.id);
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleDelete = async (): Promise<void> => {
        if (isNetworkBusy || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);

        try {
            await dispatch(removeCustomNetwork({ id: network.id })).unwrap();
            setIsConfirmingDelete(false);
        } catch (error) {
            setDeleteError(
                getErrorMessage(error, "Failed to remove custom network"),
            );
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Fragment>
            <NetworkItem>
                <NetworkHeader>
                    <NetworkTitleGroup>
                        <NetworkName>{network.name}</NetworkName>
                        <NetworkId>({network.id})</NetworkId>
                        {isNetworkBusy && <BusyStatus>(busy)</BusyStatus>}
                    </NetworkTitleGroup>
                    <NetworkActions>
                        <Button
                            title="Edit network"
                            size="small"
                            variant="icon-button"
                            onClick={() => setIsEditing(true)}
                            disabled={isDeleting || isNetworkBusy}
                        >
                            <EditIcon />
                        </Button>
                        <Button
                            title={
                                isNetworkBusy
                                    ? "Network is busy with a running operation"
                                    : "Delete network"
                            }
                            size="small"
                            variant="icon-button"
                            onClick={() => {
                                setDeleteError(null);
                                setIsConfirmingDelete(true);
                            }}
                            disabled={isDeleting || isNetworkBusy}
                            dangerHover
                        >
                            <DeleteIcon />
                        </Button>
                    </NetworkActions>
                </NetworkHeader>

                <NetworkUrls>
                    <NetworkUrl>
                        <UrlLabel>Validator URL</UrlLabel>
                        <UrlValue>{network.validatorUrl || "-"}</UrlValue>
                    </NetworkUrl>

                    <NetworkUrl>
                        <UrlLabel>Read-only URL</UrlLabel>
                        <UrlValue>{network.observerUrl || "-"}</UrlValue>
                    </NetworkUrl>
                </NetworkUrls>
            </NetworkItem>
            <EditCustomNetworkModal
                isOpen={isEditing}
                network={network}
                onClose={() => setIsEditing(false)}
            />
            <DeleteCustomNetworkModal
                isOpen={isConfirmingDelete}
                networkName={network.name}
                isDeleting={isDeleting}
                error={deleteError}
                onConfirm={handleDelete}
                onCancel={() => {
                    if (!isDeleting) {
                        setIsConfirmingDelete(false);
                    }
                }}
            />
        </Fragment>
    );
};
