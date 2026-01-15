import { type BitDepth } from '../../Types/AudioTypes';
type ThresholdResult = {
    lowerThreshold: number;
    upperThreshold: number;
    equilibrium: number;
};
export declare function convertThreshold(bitDepth: BitDepth, isUnsigned: boolean | undefined, thresholdPercentage: number): ThresholdResult;
export {};
