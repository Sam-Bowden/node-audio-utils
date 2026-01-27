import {type AudioUtils} from '../Types/AudioUtils';
import {type MixerParams} from '../Types/ParamTypes';
import {type DownwardCompressorState, type GateState} from './State';

import {changeVolume} from './AudioUtils/СhangeVolume';
import {applyGate} from './AudioUtils/ApplyGate';
import {applyDownwardCompressor} from './AudioUtils/ApplyDownwardCompressor';

import {ModifiedDataView} from '../ModifiedDataView/ModifiedDataView';
import {mixAudioData} from './General/MixAudioData';

export class MixerUtils implements AudioUtils {
	private readonly audioMixerParams: MixerParams;
	private changedParams: MixerParams;

	private dataCollection: ModifiedDataView[] = [];

	private readonly emptyData = new Uint8Array(0);
	private mixedData: ModifiedDataView;

	private readonly gateState: GateState;
	private readonly downwardCompressorState: DownwardCompressorState;

	constructor(mixerParams: MixerParams) {
		this.audioMixerParams = mixerParams;

		this.changedParams = {...this.audioMixerParams};

		this.mixedData = new ModifiedDataView(this.emptyData.buffer);

		this.gateState = {holdSamplesRemaining: mixerParams.gateHoldSamples, attenuation: 1};

		this.downwardCompressorState = {ratio: 1};
	}

	public setAudioData(audioData: Uint8Array[]): this {
		this.dataCollection = audioData.map((audioData: Uint8Array) => new ModifiedDataView(audioData.buffer));

		this.changedParams = {...this.audioMixerParams};

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
		const preProcessVolume = this.audioMixerParams.preProcessVolume ?? 100;

		if (preProcessVolume !== 100) {
			changeVolume(this.mixedData, this.changedParams, preProcessVolume);
		}

		return this;
	}

	public checkPostProcessVolume(): this {
		const postProcessVolume = this.audioMixerParams.postProcessVolume ?? 100;

		if (postProcessVolume !== 100) {
			changeVolume(this.mixedData, this.changedParams, postProcessVolume);
		}

		return this;
	}

	public applyGate(): this {
		if (this.audioMixerParams.gateThreshold !== undefined) {
			applyGate(this.mixedData, this.changedParams, this.gateState);
		}

		return this;
	}

	public applyDownwardCompressor(): this {
		if (this.audioMixerParams.downwardCompressorThreshold !== undefined) {
			applyDownwardCompressor(this.mixedData, this.changedParams, this.downwardCompressorState);
		}

		return this;
	}

	public getAudioData(): Uint8Array {
		return new Uint8Array(this.mixedData.buffer);
	}
}
