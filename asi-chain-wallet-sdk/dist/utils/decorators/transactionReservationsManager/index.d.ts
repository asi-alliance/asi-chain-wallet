import { ITransactionReservation } from "@domains/Transaction";
export interface IExclusiveReservationContext {
    isExclusiveReservation(id: ITransactionReservation["id"]): boolean;
}
export declare function EnsureExclusiveReservation<This extends IExclusiveReservationContext, Args extends any[], Return>(target: (...args: Args) => Return, context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
