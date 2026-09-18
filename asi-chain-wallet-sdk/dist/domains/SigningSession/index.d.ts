import type { TDecryptedSecret } from "@domains/SecretsProvider";
export interface ISigningSessionOptions {
    autoLockMs?: number;
    onAutoLock?: () => void;
}
export interface ISigningSessionSecrets {
    secret: TDecryptedSecret;
    dataKeySecret: string;
}
export default class SigningSession {
    private readonly signerId;
    private state;
    private generation;
    constructor(signerId: string);
    isActive(): boolean;
    getSecret(): TDecryptedSecret | null;
    getDataKey(): string | null;
    getSessionGeneration(): number;
    private wipeSecret;
    release(): void;
    hold(currentGeneration: number, secrets: ISigningSessionSecrets, options?: ISigningSessionOptions): void;
}
