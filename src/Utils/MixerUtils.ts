import {type AudioUtils} from '../Types/AudioUtils';
import {type ProcessorParams} from '../Types/ParamTypes';
import {type DownwardCompressorState} from './State/DownwardCompressorState';
import {type GateState} from './State/GateState';

import {changeVolume} from './AudioUtils/СhangeVolume';
import {applyGate} from './AudioUtils/ApplyGate';
import {applyDownwardCompressor} from './AudioUtils/ApplyDownwardCompressor';

import {ModifiedDataView} from '../ModifiedDataView/ModifiedDataView';
import {mixAudioData} from './General/MixAudioData';
import {ProcessingStats} from './Stats/ProcessingStats';
import {updateStats} from './AudioUtils/UpdateStats';

export class MixerUtils implements AudioUtils {
	public readonly processingStats: ProcessingStats;

	private readonly audioProcessorParams: ProcessorParams;
	private changedParams: ProcessorParams;

	private dataCollection: ModifiedDataView[] = [];

	private readonly emptyData = new Uint8Array(0);
	private mixedData: ModifiedDataView;

	private readonly gateState: GateState;
	private readonly downwardCompressorState: DownwardCompressorState;

	constructor(mixerParams: ProcessorParams) {
		this.audioProcessorParams = mixerParams;

		this.changedParams = {...this.audioProcessorParams};

		this.mixedData = new ModifiedDataView(this.emptyData.buffer);

		this.gateState = {holdSamplesRemaining: mixerParams.gateHoldSamples, attenuation: 1};

		this.downwardCompressorState = {ratio: 1};

		this.processingStats = new ProcessingStats(mixerParams.bitDepth, mixerParams.channels);
	}

	public setAudioData(audioData: Uint8Array[]): this {
		this.dataCollection = audioData.map((audioData: Uint8Array) => new ModifiedDataView(audioData.buffer));

		this.changedParams = {...this.audioProcessorParams};

		return this;
	}

	public mix(): this {
		if (this.dataCollection.length > 1) {
			this.mixedData = mixAudioData(this.dataCollection, this.changedParams);
		} else {
			this.mixedData = new ModifiedDataView(this.dataCollection[0].buffer);
		}

		return this;
	}

	public checkPreProcessVolume(): this {
		const preProcessVolume = this.audioProcessorParams.preProcessVolume ?? 100;

		if (preProcessVolume !== 100) {
			changeVolume(this.mixedData, this.changedParams, preProcessVolume);
		}

		return this;
	}

	public checkPostProcessVolume(): this {
		const postProcessVolume = this.audioProcessorParams.postProcessVolume ?? 100;

		if (postProcessVolume !== 100) {
			changeVolume(this.mixedData, this.changedParams, postProcessVolume);
		}

		return this;
	}

	public updatePreProcessStats(): this {
		updateStats(this.mixedData, this.changedParams, this.processingStats.preProcess);

		return this;
	}

	public applyGate(): this {
		if (this.audioProcessorParams.gateThreshold !== undefined) {
			applyGate(
				this.mixedData,
				this.changedParams,
				this.gateState,
				this.processingStats.postGate,
			);
		}

		return this;
	}

	public applyDownwardCompressor(): this {
		if (this.audioProcessorParams.downwardCompressorThreshold !== undefined) {
			applyDownwardCompressor(
				this.mixedData,
				this.changedParams,
				this.downwardCompressorState,
				this.processingStats.postDownwardCompressor,
			);
		}

		return this;
	}

	public getAudioData(): Uint8Array {
		return new Uint8Array(this.mixedData.buffer);
	}
}
