import {type SampleRate, type BitDepth, type Endianness} from './AudioTypes';

type BasedParams = {
	sampleRate: SampleRate;
	channels: number;
	bitDepth: BitDepth;
	endianness?: Endianness;
	unsigned?: boolean;
	preProcessVolume?: number;
	postProcessVolume?: number;
	gateThreshold?: number;
	gateHoldSamples?: number;
	gateAttackSamples?: number;
	gateReleaseSamples?: number;
	downwardCompressorThreshold?: number;
	downwardCompressorRatio?: number;
	downwardCompressorAttackSamples?: number;
	downwardCompressorReleaseSamples?: number;
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
