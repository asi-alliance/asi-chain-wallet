import React from "react";
import { Alert, Button, FormActions } from "components";
import { ModalWindow } from "components/ModalWindow";
import { WarningIcon } from "components/Icons";

export interface IOperationPromptContent {
    title: string;
    message: string;
    confirmLabel: string;
}

export const LOGOUT_OPERATION_PROMPT: IOperationPromptContent = {
    title: "Operation in progress",
    message:
        "An operation is still in progress. Logging out stops tracking it in the wallet and may interrupt a transaction that is still being submitted.",
    confirmLabel: "Log out anyway",
};

export const SWITCH_ACCOUNT_OPERATION_PROMPT: IOperationPromptContent = {
    title: "Operation in progress",
    message:
        "An operation is still in progress for the current account. It continues after you switch, but its status is shown only for the account that started it.",
    confirmLabel: "Switch account",
};

export const DELETE_DURING_OPERATION_WARNING: string =
    "An operation is still in progress. Deleting waits for it to finish submitting, but its status will no longer be tracked.";

interface IOperationInProgressModalProps extends IOperationPromptContent {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const OperationInProgressModal: React.FC<
    IOperationInProgressModalProps
> = ({ isOpen, title, message, confirmLabel, onConfirm, onCancel }) => (
    <ModalWindow
        isOpen={isOpen}
        onClose={onCancel}
        title={title}
        maxWidth="480px"
    >
        <Alert tone="warning" icon={<WarningIcon size={20} />}>
            {message}
        </Alert>
        <FormActions>
            <Button variant="secondary" onClick={onCancel}>
                Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm}>
                {confirmLabel}
            </Button>
        </FormActions>
    </ModalWindow>
);
