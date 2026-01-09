import { type BitDepth } from '../../Types/AudioTypes';
type RangeValue = {
    min: number;
    max: number;
};
export declare function getValueRange(bitDepth: BitDepth, isUnsigned?: boolean): RangeValue;
export {};
