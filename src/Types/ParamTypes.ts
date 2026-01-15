import {type SampleRate, type BitDepth, type Endianness} from './AudioTypes';

type BasedParams = {
	sampleRate: SampleRate;
	channels: number;
	bitDepth: BitDepth;
	endianness?: Endianness;
	unsigned?: boolean;
	volume?: number;
	gateThreshold?: number;
	gateHoldSamples?: number;
	downwardCompressorThreshold?: number;
	downwardCompressorRatio?: number;
};

export type MixerParams = {
	highWaterMark?: number;
	maxBufferLength?: number;
} & BasedParams;

export type InterleaverParams = {
	highWaterMark?: number;
	maxBufferLength?: number;
} & BasedParams;

export type InputParams = {
	correctByteSize?: boolean;
} & BasedParams;

export type StatsParams = Omit<BasedParams, 'volume'>;

export type OmitSomeParams<T> = Omit<T, 'sampleRate' | 'channels' | 'bitDepth'>;
