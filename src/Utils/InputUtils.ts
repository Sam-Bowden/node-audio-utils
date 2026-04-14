import {type AudioUtils} from '../Types/AudioUtils';
import {type InputParams, type MixerParams} from '../Types/ParamTypes';
import type {Upmix as UpmixInstance} from 'node-libavfilter-upmix';
import {type DownwardCompressorState, type GateState} from './State';

import {ModifiedDataView} from '../ModifiedDataView/ModifiedDataView';

import {assertChannelsCount} from '../Asserts/AssertChannelsCount';

import {changeVolume} from './AudioUtils/СhangeVolume';
import {changeIntType} from './AudioUtils/ChangeIntType';
import {changeBitDepth} from './AudioUtils/ChangeBitDepth';
import {changeSampleRate} from './AudioUtils/СhangeSampleRate';
import {changeChannelsCount} from './AudioUtils/СhangeChannelsCount';
import {changeEndianness} from './AudioUtils/ChangeEndianness';
import {applyGate} from './AudioUtils/ApplyGate';
import {applyDownwardCompressor} from './AudioUtils/ApplyDownwardCompressor';
import {applyDownmix} from './AudioUtils/ApplyDownmix';
import {stripChannels} from './AudioUtils/StripChannels';
import {ProcessingStats} from './Stats/ProcessingStats';
import {updateStats} from './AudioUtils/UpdateStats';

export class InputUtils implements AudioUtils {
	public readonly processingStats: ProcessingStats;

	private readonly audioInputParams: InputParams;
	private readonly audioMixerParams: MixerParams;

	private changedParams: InputParams;

	private readonly emptyData = new Uint8Array(0);
	private audioData: ModifiedDataView;

	private readonly gateState: GateState;
	private readonly downwardCompressorState: DownwardCompressorState;

	private readonly upmix: UpmixInstance | undefined;
	private readonly upmixOutputChannels: number | undefined;
	private upmixOutputBuffer: Uint8Array = new Uint8Array(0);

	constructor(inputParams: InputParams, mixerParams: MixerParams) {
		this.audioInputParams = inputParams;
		this.audioMixerParams = mixerParams;

		this.changedParams = {...this.audioInputParams};

		this.audioData = new ModifiedDataView(this.emptyData.buffer);

		this.gateState = {holdSamplesRemaining: inputParams.gateHoldSamples, attenuation: 1};

		this.downwardCompressorState = {ratio: 1};

		this.processingStats = new ProcessingStats(mixerParams.bitDepth, mixerParams.channels);

		if (inputParams.upmixOptions !== undefined) {
			type UpmixCtor = new (options: {sampleRate: number; bitDepth: 16 | 32; inputLayout: string; outputLayout: string; winSize?: number}) => UpmixInstance;
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const upmixModule = require('node-libavfilter-upmix') as {Upmix: UpmixCtor};
			this.upmix = new upmixModule.Upmix({
				sampleRate: inputParams.sampleRate,
				bitDepth: inputParams.bitDepth as 16 | 32,
				inputLayout: channelCountToLayout(inputParams.channels),
				outputLayout: inputParams.upmixOptions.outputLayout,
				winSize: inputParams.upmixOptions.winSize,
			});
			this.upmixOutputChannels = layoutToChannelCount(inputParams.upmixOptions.outputLayout);
		}
	}

	public setAudioData(audioData: Uint8Array): this {
		this.audioData = new ModifiedDataView(audioData.buffer, audioData.byteOffset, audioData.length);
		this.changedParams = {...this.audioInputParams};

		return this;
	}

	public checkIntType(): this {
		if (Boolean(this.changedParams.unsigned) !== Boolean(this.audioMixerParams.unsigned)) {
			changeIntType(this.audioData, this.changedParams, this.audioMixerParams.unsigned);
		}

		return this;
	}

	public checkBitDepth(): this {
		if (this.changedParams.bitDepth !== this.audioMixerParams.bitDepth) {
			this.audioData = changeBitDepth(this.audioData, this.changedParams, this.audioMixerParams);
		}

		return this;
	}

	public checkSampleRate(): this {
		if (this.changedParams.sampleRate !== this.audioMixerParams.sampleRate) {
			this.audioData = changeSampleRate(this.audioData, this.changedParams, this.audioMixerParams);
		}

		return this;
	}

	public applyDownmix(): this {
		if (this.changedParams.downmixMatrix !== undefined) {
			this.audioData = applyDownmix(this.audioData, this.changedParams);
			this.changedParams.channels = this.changedParams.downmixMatrix.length;
		}

		return this;
	}

	public applyUpmix(): this {
		if (this.upmix === undefined) {
			return this;
		}

		const bytesPerSample = this.changedParams.bitDepth / 8;
		const inputSamples = this.audioData.byteLength / (bytesPerSample * this.changedParams.channels);
		const expectedOutputBytes = inputSamples * this.upmixOutputChannels! * bytesPerSample;

		const input = Buffer.from(this.audioData.buffer, this.audioData.byteOffset, this.audioData.byteLength);
		const output = this.upmix.process(input);

		if (output.length > 0) {
			const combined = new Uint8Array(this.upmixOutputBuffer.length + output.length);
			combined.set(this.upmixOutputBuffer);
			combined.set(new Uint8Array(output.buffer, output.byteOffset, output.byteLength), this.upmixOutputBuffer.length);
			this.upmixOutputBuffer = combined;
		}

		if (this.upmixOutputBuffer.length >= expectedOutputBytes) {
			const released = this.upmixOutputBuffer.slice(0, expectedOutputBytes);
			this.upmixOutputBuffer = this.upmixOutputBuffer.slice(expectedOutputBytes);
			this.audioData = new ModifiedDataView(released.buffer, released.byteOffset, released.byteLength);
			this.changedParams.channels = this.upmixOutputChannels!;
		}

		// If not enough output accumulated, fall through — checkChannelsCount() zero-pads as fallback

		return this;
	}

	public destroy(): void {
		this.upmix?.close();
	}

	public resetUpmix(): void {
		this.upmix?.reset();
		this.upmixOutputBuffer = new Uint8Array(0);
	}

	public checkActiveChannelsCount(): this {
		const {activeChannels} = this.changedParams;

		if (activeChannels !== undefined && activeChannels < this.changedParams.channels) {
			this.audioData = stripChannels(this.audioData, this.changedParams);
			this.changedParams.channels = activeChannels;
		}

		return this;
	}

	public checkChannelsCount(): this {
		if (this.changedParams.channels !== this.audioMixerParams.channels) {
			assertChannelsCount(this.changedParams.channels);

			this.audioData = changeChannelsCount(this.audioData, this.changedParams, this.audioMixerParams);
		}

		return this;
	}

	public checkPreProcessVolume(): this {
		const preProcessVolume = this.changedParams.preProcessVolume ?? 100;

		if (preProcessVolume !== 100) {
			changeVolume(this.audioData, this.changedParams, preProcessVolume);
		}

		return this;
	}

	public checkPostProcessVolume(): this {
		const postProcessVolume = this.changedParams.postProcessVolume ?? 100;

		if (postProcessVolume !== 100) {
			changeVolume(this.audioData, this.changedParams, postProcessVolume);
		}

		return this;
	}

	public updatePreProcessStats(): this {
		updateStats(this.audioData, this.changedParams, this.processingStats.preProcess);

		return this;
	}

	public applyGate(): this {
		if (this.changedParams.gateThreshold !== undefined) {
			applyGate(
				this.audioData,
				this.changedParams,
				this.gateState,
				this.processingStats.postGate,
			);
		}

		return this;
	}

	public applyDownwardCompressor(): this {
		if (this.changedParams.downwardCompressorThreshold !== undefined) {
			applyDownwardCompressor(
				this.audioData,
				this.changedParams,
				this.downwardCompressorState,
				this.processingStats.postDownwardCompressor,
			);
		}

		return this;
	}

	public checkEndianness(): this {
		if (this.changedParams.endianness !== this.audioMixerParams.endianness) {
			changeEndianness(this.audioData, this.changedParams, this.audioMixerParams);
		}

		return this;
	}

	public getAudioData(): Uint8Array {
		return new Uint8Array(this.audioData.buffer, this.audioData.byteOffset, this.audioData.byteLength);
	}
}

function channelCountToLayout(channels: number): string {
	switch (channels) {
		case 1: return 'mono';
		case 2: return 'stereo';
		case 4: return 'quad';
		case 5: return '5.0';
		case 6: return '5.1';
		case 7: return '6.1';
		case 8: return '7.1';
		default: return `${channels}c`;
	}
}

function layoutToChannelCount(layout: string): number {
	switch (layout) {
		case 'mono': return 1;
		case 'stereo': return 2;
		case '2.1':
		case '3.0': return 3;
		case 'quad':
		case '4.0': return 4;
		case '5.0': return 5;
		case '5.1': return 6;
		case '6.1': return 7;
		case '7.1': return 8;
		default: throw new Error(`Unknown channel layout: '${layout}'`);
	}
}
