import {type Channel} from 'node-ebur128';
import {
	type SampleRate, type BitDepth, type Endianness, type UpmixOutputLayout, type UpmixLfeMode,
} from './AudioTypes';

export type {UpmixOutputLayout, UpmixLfeMode};

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

export type ProcessorParams = {
	highWaterMark?: number;
	maxBufferLength?: number;
} & BasedParams;

export type UpmixOptions = {
	outputLayout: UpmixOutputLayout;
	windowSize: number;
	smoothing: number;
	angle: number;
	focus: number;
	lfeEnabled: boolean;
	lfeLowCutoff: number;
	lfeHighCutoff: number;
	lfeMode: UpmixLfeMode;
};

export type InputParams = {
	correctByteSize?: boolean;
	downmixMatrix?: number[][];
	activeChannels?: number;
	activeChannelsOffset?: number;
	upmixOptions?: UpmixOptions;
} & BasedParams;

export type StatsParams = {
	sampleRate: SampleRate;
	channels: Channel[];
	bitDepth: BitDepth;
};

export type OmitSomeParams<T> = Omit<T, 'sampleRate' | 'channels' | 'bitDepth'>;
