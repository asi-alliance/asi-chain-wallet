import { TAppThunk } from "store/appThunk";
import { operationSettled, operationStarted } from "store/NetworkActivity";
import { TOperationStart } from "types/operations";

export const runRegisteredOperation =
    <TResult>(
        operation: TOperationStart,
        run: (operationId: string) => Promise<TResult>,
    ): TAppThunk<Promise<TResult>> =>
    async (dispatch) => {
        const startAction = operationStarted(operation);
        const operationId: string = startAction.payload.id;

        dispatch(startAction);

        try {
            return await run(operationId);
        } catch (error: unknown) {
            dispatch(operationSettled(operationId));

            throw error;
        }
    };
