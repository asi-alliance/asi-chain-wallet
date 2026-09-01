import React, { Fragment, useState } from "react";
import styled from "styled-components";
import { Button } from "components";
import { Network } from "types/wallet";
import { DeleteIcon, EditIcon } from "components/Icons";
import { useDispatch } from "react-redux";
import { DeleteCustomNetworkModal } from "components/DeleteCustomNetworkModal";
import { EditCustomNetworkModal } from "components/EditCustomNetworkModal";
import { removeCustomNetwork } from "store/WalletsStore/thunks";
import { AppDispatch } from "store";
import { useIsNetworkBusy } from "sdk";
import { getErrorMessage } from "utils/helpers";

const NetworkItem = styled.div`
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 16px 24px;
    margin-bottom: 8px;
    min-width: 0;
    box-sizing: border-box;

    &:last-child {
        margin-bottom: 0;
    }

    @media (max-width: 768px) {
        padding: 14px 16px;
    }

    @media (max-width: 400px) {
        padding: 12px;
    }
`;

const NetworkHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
    min-width: 0;

    @media (max-width: 400px) {
        align-items: flex-start;
        gap: 8px;
    }
`;

const NetworkName = styled.div`
    font-weight: 500;
    min-width: 0;
    overflow: hidden;
`;

const NetworkNameLabel = styled.span`
    margin-right: 10px;

    @media (max-width: 768px) {
        display: block;
    }

    @media (max-width: 400px) {
        margin-right: 0;
        overflow-wrap: anywhere;
        word-break: break-word;
    }
`;

const NetworkBadge = styled.span`
    color: #999;
    font-weight: 400;

    @media (max-width: 768px) {
        display: block;
        font-size: 0.75rem;
    }

    @media (max-width: 400px) {
        overflow-wrap: anywhere;
        word-break: break-word;
    }
`;

const NetworkUrls = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    min-width: 0;
    font-family: monospace;
    font-size: 12px;

    @media (max-width: 768px) {
        display: block;
    }
`;

const NetworkUrl = styled.div`
    min-width: 0;
    overflow: hidden;

    & + & {
        @media (max-width: 768px) {
            margin-top: 10px;
        }
    }
`;

const UrlLabel = styled.div`
    color: ${({ theme }) => theme.text.secondary};
    margin-bottom: 2px;
`;

const UrlValue = styled.div`
    line-height: 27px;
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;

    @media (max-width: 400px) {
        line-height: 20px;
        font-size: 11px;
    }
`;

const CustomNetworkActionsButtons = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-shrink: 0;

    @media (max-width: 400px) {
        gap: 6px;
    }
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
        setIsDeleting(true);
        setDeleteError(null);

        try {
            await dispatch(
                removeCustomNetwork({
                    id: network.id,
                }),
            ).unwrap();

            setIsConfirmingDelete(false);
        } catch (error) {
            setDeleteError(
                getErrorMessage(error, "Failed to remove custom network"),
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const openDeleteConfirmation = (): void => {
        setDeleteError(null);
        setIsConfirmingDelete(true);
    };

    return (
        <Fragment>
            <NetworkItem>
                <NetworkHeader>
                    <NetworkName className="text-2">
                        <NetworkNameLabel className="text-2">
                            {network.name}
                        </NetworkNameLabel>

                        {isNetworkBusy && <NetworkBadge>(busy)</NetworkBadge>}
                    </NetworkName>

                    <CustomNetworkActionsButtons>
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
                            onClick={openDeleteConfirmation}
                            disabled={isDeleting || isNetworkBusy}
                            dangerHover
                        >
                            <DeleteIcon />
                        </Button>
                    </CustomNetworkActionsButtons>
                </NetworkHeader>

                <NetworkUrls>
                    <NetworkUrl>
                        <UrlLabel className="text-5">Validator URL</UrlLabel>

                        <UrlValue className="text-4">
                            {network.validatorUrl}
                        </UrlValue>
                    </NetworkUrl>

                    <NetworkUrl>
                        <UrlLabel className="text-5">Read-only URL</UrlLabel>

                        <UrlValue className="text-4">
                            {network.observerUrl || "-"}
                        </UrlValue>
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
