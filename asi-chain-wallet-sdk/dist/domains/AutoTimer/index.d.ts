export interface IAutoTimerOptions {
    delayMs: number;
    onElapsed: () => void;
}
export default class AutoTimer {
    private readonly delayMs;
    private readonly onElapsed;
    private timer;
    constructor({ delayMs, onElapsed }: IAutoTimerOptions);
    isActive(): boolean;
    start(): void;
    clear(): void;
}
