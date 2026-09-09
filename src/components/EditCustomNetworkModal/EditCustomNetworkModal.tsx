import React from "react";
import { EditCustomNetworkForm } from "components/EditCustomNetworkForm";
import { ModalWindow } from "components/ModalWindow";
import { Network } from "types/wallet";

interface EditCustomNetworkModalProps {
    isOpen: boolean;
    network: Network;
    onClose: () => void;
}

export const EditCustomNetworkModal: React.FC<EditCustomNetworkModalProps> = ({
    isOpen,
    network,
    onClose,
}) => (
    <ModalWindow
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="800px"
        title="Edit Custom Network"
    >
        <EditCustomNetworkForm
            network={network}
            onSuccess={onClose}
            onCancel={onClose}
        />
    </ModalWindow>
);
