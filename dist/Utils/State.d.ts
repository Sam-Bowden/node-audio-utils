import type { Upmix as UpmixInstance } from 'node-libavfilter-upmix';
import { type UpmixOptions } from '../Types/ParamTypes';
export type GateState = {
    holdSamplesRemaining?: number;
    attenuation: number;
};
export type DownwardCompressorState = {
    ratio: number;
};
export declare class UpmixState {
    readonly upmix: UpmixInstance;
    readonly outputChannels: number;
    outputBuffer: Uint8Array;
    constructor(options: UpmixOptions, inputChannels: number, sampleRate: number, bitDepth: 16 | 32);
    destroy(): void;
    clear(): void;
}
