import { type SampleRate, type BitDepth, type Endianness } from './AudioTypes';
type DelayTimeType = number | (() => number);
type PreProcessFunction = (data: Uint8Array) => Uint8Array;
type BasedParams = {
    sampleRate: SampleRate;
    channels: number;
    bitDepth: BitDepth;
    endianness?: Endianness;
    unsigned?: boolean;
    volume?: number;
    gateThreshold?: number;
    gateReleaseSamples?: number;
    preProcessData?: PreProcessFunction;
};
export type MixerParams = {
    autoClose?: boolean;
    highWaterMark?: number;
    generateSilence?: boolean;
    silentDuration?: number;
    delayTime?: DelayTimeType;
    maxBufferLength?: number;
} & BasedParams;
export type InterleaverParams = {
    autoClose?: boolean;
    highWaterMark?: number;
    generateSilence?: boolean;
    silentDuration?: number;
    delayTime?: DelayTimeType;
    maxBufferLength?: number;
} & BasedParams;
export type InputParams = {
    forceClose?: boolean;
    correctByteSize?: boolean;
} & BasedParams;
export type StatsParams = Omit<BasedParams, 'volume' | 'preProcessData'>;
export type OmitSomeParams<T> = Omit<T, 'sampleRate' | 'channels' | 'bitDepth'>;
export {};
