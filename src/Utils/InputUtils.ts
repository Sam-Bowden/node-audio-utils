import {type AudioUtils} from '../Types/AudioUtils';
import {type InputParams, type ProcessorParams} from '../Types/ParamTypes';
import {type DownwardCompressorState} from './State/DownwardCompressorState';
import {type GateState} from './State/GateState';
import {UpmixState} from './State/UpmixState';

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
import {applyUpmix} from './AudioUtils/ApplyUpmix';
import {stripChannels} from './AudioUtils/StripChannels';
import {ProcessingStats} from './Stats/ProcessingStats';
import {updateStats} from './AudioUtils/UpdateStats';

export class InputUtils implements AudioUtils {
	public readonly processingStats: ProcessingStats;

	private readonly audioInputParams: InputParams;
	private readonly audioProcessorParams: ProcessorParams;

	private changedParams: InputParams;

	private readonly emptyData = new Uint8Array(0);
	private audioData: ModifiedDataView;

	private readonly gateState: GateState;
	private readonly downwardCompressorState: DownwardCompressorState;
	private upmixState?: UpmixState;

	constructor(inputParams: InputParams, mixerParams: ProcessorParams) {
		this.audioInputParams = inputParams;
		this.audioProcessorParams = mixerParams;

		this.changedParams = {...this.audioInputParams};

		this.audioData = new ModifiedDataView(this.emptyData.buffer);

		this.gateState = {holdSamplesRemaining: inputParams.gateHoldSamples, attenuation: 1};

		this.downwardCompressorState = {ratio: 1};

		this.processingStats = new ProcessingStats(mixerParams.bitDepth, mixerParams.channels);
	}

	public setAudioData(audioData: Uint8Array): this {
		this.audioData = new ModifiedDataView(audioData.buffer, audioData.byteOffset, audioData.length);
		this.changedParams = {...this.audioInputParams};

		return this;
	}

	public checkIntType(): this {
		if (Boolean(this.changedParams.unsigned) !== Boolean(this.audioProcessorParams.unsigned)) {
			changeIntType(this.audioData, this.changedParams, this.audioProcessorParams.unsigned);
		}

		return this;
	}

	public checkBitDepth(): this {
		if (this.changedParams.bitDepth !== this.audioProcessorParams.bitDepth) {
			this.audioData = changeBitDepth(this.audioData, this.changedParams, this.audioProcessorParams);
		}

		return this;
	}

	public checkSampleRate(): this {
		if (this.changedParams.sampleRate !== this.audioProcessorParams.sampleRate) {
			this.audioData = changeSampleRate(this.audioData, this.changedParams, this.audioProcessorParams);
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
		if (this.changedParams.upmixOptions !== undefined) {
			if (this.upmixState === undefined) {
				this.upmixState = new UpmixState(
					this.changedParams.upmixOptions,
					this.changedParams.channels,
					this.changedParams.sampleRate,
					this.changedParams.bitDepth > 16 ? 32 : 16,
				);
			}

			const result = applyUpmix(this.audioData, this.changedParams, this.upmixState);
			if (result !== undefined) {
				this.audioData = result;
			}
		}

		return this;
	}

	public resetUpmixState(): void {
		this.upmixState?.destroy();
		this.upmixState = undefined;
	}

	public destroy(): void {
		this.upmixState?.destroy();
	}

	public clear(): void {
		this.upmixState?.clear();
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
		if (this.changedParams.channels !== this.audioProcessorParams.channels) {
			assertChannelsCount(this.changedParams.channels);

			this.audioData = changeChannelsCount(this.audioData, this.changedParams, this.audioProcessorParams);
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
			applyGate(this.audioData, this.changedParams, this.gateState, this.processingStats.postGate);
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
		if (this.changedParams.endianness !== this.audioProcessorParams.endianness) {
			changeEndianness(this.audioData, this.changedParams, this.audioProcessorParams);
		}

		return this;
	}

	public getAudioData(): Uint8Array {
		return new Uint8Array(this.audioData.buffer, this.audioData.byteOffset, this.audioData.byteLength);
	}
}
