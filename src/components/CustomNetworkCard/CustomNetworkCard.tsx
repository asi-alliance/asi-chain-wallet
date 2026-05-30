import React, { Fragment, useState } from "react";
import styled from "styled-components";
import { Button } from "components";
import { Network } from "types/wallet";
import { DeleteIcon, EditIcon } from "components/Icons";
import { useDispatch } from "react-redux";
import { removeNetwork, updateNetwork } from "store/walletSlice";
import { EditCustomNetworkModal } from "components/EditCustomNetworkModal";

const NetworkItem = styled.div`
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 16px 24px;
    margin-bottom: 8px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const NetworkHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
`;

const NetworkName = styled.div`
    font-weight: 500;
`;

const NetworkNameLabel = styled.span`
    margin-right: 10px;

    @media (max-width: 768px) {
        display: block;
    }
`;

const NetworkId = styled.span`
    color: #999;
    font-weight: 400;

    @media (max-width: 768px) {
        display: block;
        font-size: 0.75rem;
    }
`;

const NetworkUrls = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    font-family: monospace;
    font-size: 12px;

    @media (max-width: 768px) {
        display: block;
    }
`;

const UrlLabel = styled.div`
    color: #666;
`;

const UrlValue = styled.div`
    line-height: 27px;
`;

const CustomNetworkActionsButtons = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
`;

interface CustomNetworkCardProps {
    network: Network;
    onEdit?: (network: Network) => void;
    onDelete?: (id: string) => void;
}

export const CustomNetworkCard: React.FC<CustomNetworkCardProps> = ({
    network,
    onEdit,
    onDelete,
}) => {
    const dispatch = useDispatch();

    const [isEditing, setIsEditing] = useState<boolean>(false);

    const handleDelete = () => {
        if (!network.id.startsWith("custom")) return;
        dispatch(removeNetwork(network.id));

        if (!onDelete) {
            return;
        }

        onDelete(network.id);
    };

    const handleEdit = (network: Network) => {
        dispatch(updateNetwork(network));

        if (!onEdit) {
            setIsEditing(false);

            return;
        }

        onEdit(network);

        setIsEditing(false);
    };

    return (
        <Fragment>
            <NetworkItem>
                <NetworkHeader>
                    <NetworkName className="text-2">
                        <NetworkNameLabel className="text-2">
                            {network.name}
                        </NetworkNameLabel>
                        <NetworkId>({network.id})</NetworkId>
                    </NetworkName>
                    <CustomNetworkActionsButtons>
                        <Button
                            size="small"
                            variant="icon-button"
                            onClick={() =>
                                setIsEditing((previousValue) => !previousValue)
                            }
                        >
                            <EditIcon />
                        </Button>
                        <Button
                            size="small"
                            variant="icon-button"
                            onClick={handleDelete}
                        >
                            <DeleteIcon />
                        </Button>
                    </CustomNetworkActionsButtons>
                </NetworkHeader>
                <NetworkUrls>
                    <div>
                        <UrlLabel className="text-5">Validator URL</UrlLabel>
                        <UrlValue className="text-4">{network.url}</UrlValue>
                    </div>
                    <div>
                        <UrlLabel className="text-5">Read-only URL</UrlLabel>
                        <UrlValue className="text-4">
                            {network.readOnlyUrl || "-"}
                        </UrlValue>
                    </div>
                </NetworkUrls>
            </NetworkItem>
            <EditCustomNetworkModal
                isOpen={isEditing}
                network={network}
                isActive={true}
                onClose={() => {
                    setIsEditing(false);
                }}
                onSave={handleEdit}
            />
        </Fragment>
    );
};
