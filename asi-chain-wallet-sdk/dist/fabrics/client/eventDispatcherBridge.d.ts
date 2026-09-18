import { IClientEventDispatcher } from "@domains/Client";
import { IClientEventSource, TUnsubscribe } from "@services/ClientEventBus";
export declare const registerEventDispatcher: (eventBus: IClientEventSource, eventDispatcher: IClientEventDispatcher) => TUnsubscribe;
