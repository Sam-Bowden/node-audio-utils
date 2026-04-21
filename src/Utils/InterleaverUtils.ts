import {type AudioUtils} from '../Types/AudioUtils';
import {type ProcessorParams} from '../Types/ParamTypes';

import {changeVolume} from './AudioUtils/СhangeVolume';

import {ModifiedDataView} from '../ModifiedDataView/ModifiedDataView';
import {interleaveAudioData} from './General/InterleaveAudioData';

export class InterleaverUtils implements AudioUtils {
	private readonly audioProcessorParams: ProcessorParams;
	private changedParams: ProcessorParams;

	private dataCollection: ModifiedDataView[] = [];

	private readonly emptyData = new Uint8Array(0);
	private interleavedData: ModifiedDataView;

	constructor(interleaverParams: ProcessorParams) {
		this.audioProcessorParams = interleaverParams;

		this.changedParams = {...this.audioProcessorParams};

		this.interleavedData = new ModifiedDataView(this.emptyData.buffer);
	}

	public setAudioData(audioData: Uint8Array[]): this {
		this.dataCollection = audioData.map((audioData: Uint8Array) => new ModifiedDataView(audioData.buffer));

		this.changedParams = {...this.audioProcessorParams};

		return this;
	}

	public interleave(): this {
		if (this.dataCollection.length > 1) {
			this.interleavedData = interleaveAudioData(this.dataCollection, this.changedParams);
		} else {
			this.interleavedData = new ModifiedDataView(this.dataCollection[0].buffer);
		}

		return this;
	}

	public checkPreProcessVolume(): this {
		const preProcessVolume = this.audioProcessorParams.preProcessVolume ?? 100;

		if (preProcessVolume !== 100) {
			changeVolume(this.interleavedData, this.changedParams, preProcessVolume);
		}

		return this;
	}

	public checkPostProcessVolume(): this {
		const postProcessVolume = this.audioProcessorParams.postProcessVolume ?? 100;

		if (postProcessVolume !== 100) {
			changeVolume(this.interleavedData, this.changedParams, postProcessVolume);
		}

		return this;
	}

	public getAudioData(): Uint8Array {
		return new Uint8Array(this.interleavedData.buffer);
	}
}
