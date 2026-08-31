import React from "react";
import { EditCustomNetworkForm } from "components/EditCustomNetworkForm";
import { ModalWindow } from "components/ModalWindow";
import { Network } from "types/wallet";

interface EditCustomNetworkModalProps {
    isOpen: boolean;
    network: Network | null;
    onClose: () => void;
    onEdit?: (network: Network) => void;
}

export const EditCustomNetworkModal: React.FC<EditCustomNetworkModalProps> = ({
    isOpen,
    network,
    onClose,
    onEdit,
}) => {
    if (!network) {
        return null;
    }

    const handleSuccess = (updatedNetwork: Network): void => {
        onEdit?.(updatedNetwork);
        onClose();
    };

    return (
        <ModalWindow
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="800px"
            title="Edit Custom Network"
        >
            <EditCustomNetworkForm
                network={network}
                onSuccess={handleSuccess}
                onCancel={onClose}
            />
        </ModalWindow>
    );
};
