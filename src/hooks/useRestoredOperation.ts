import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store";
import { selectLatestAccountOperation } from "store/NetworkActivity";
import {
    selectSelectedAccountId,
    selectSelectedNetworkId,
} from "store/WalletsStore";
import { OperationKind, OperationStage, TOperation } from "types/operations";

export const useRestoredOperation = (
    kind: OperationKind,
    onRestore: (transactionId: string) => void,
): boolean => {
    const accountId = useSelector(selectSelectedAccountId);
    const networkId = useSelector(selectSelectedNetworkId);
    const operation = useSelector(
        (state: RootState): TOperation | null =>
            accountId
                ? selectLatestAccountOperation(state, {
                      kind,
                      networkId,
                      accountId,
                  })
                : null,
    );

    const restorableOperationIdRef = useRef(operation?.id ?? null);
    const onRestoreRef = useRef(onRestore);

    useEffect(() => {
        onRestoreRef.current = onRestore;
    });

    useEffect(() => {
        if (
            operation?.stage !== OperationStage.AWAITING_CONFIRMATION ||
            operation.id !== restorableOperationIdRef.current
        ) {
            return;
        }

        restorableOperationIdRef.current = null;
        onRestoreRef.current(operation.transactionId);
    }, [operation]);

    return (
        !!operation && operation.stage !== OperationStage.AWAITING_CONFIRMATION
    );
};
