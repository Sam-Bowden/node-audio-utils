export declare class RMSMonitor {
    numSamples: number;
    sumOfSquares: number;
    /** Sample normalised to [-1,1] */
    onSample(sample: number): void;
    getRMS(): number;
    reset(): void;
}
