export default abstract class ClosableDomain {
    private active;
    constructor();
    isActive(): boolean;
    close(): Promise<void>;
    protected abstract onClose(): Promise<void>;
}
