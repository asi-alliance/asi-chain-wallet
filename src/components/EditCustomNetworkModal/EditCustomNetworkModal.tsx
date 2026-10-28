import React, { useState } from "react";
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
}) => {
    const [isSaving, setIsSaving] = useState(false);

    return (
        <ModalWindow
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="800px"
            title="Edit Custom Network"
            dismissible={!isSaving}
        >
            <EditCustomNetworkForm
                network={network}
                isSaving={isSaving}
                onSuccess={onClose}
                onCancel={onClose}
                onSavingChange={setIsSaving}
            />
        </ModalWindow>
    );
};
