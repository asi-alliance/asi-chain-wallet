export default class LifecycleGuard {
    private generation;
    private readonly pendingOperations;
    constructor();
    private isCurrentGeneration;
    invalidate(): void;
    drain(timeoutMs?: number): Promise<void>;
    track<T>(operation: () => Promise<T>): Promise<T>;
    run<T>(operation: () => Promise<T>, onInvalidated: (result: T) => Error): Promise<T>;
}
