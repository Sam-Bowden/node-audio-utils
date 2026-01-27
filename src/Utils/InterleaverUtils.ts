import {type AudioUtils} from '../Types/AudioUtils';
import {type InterleaverParams} from '../Types/ParamTypes';

import {changeVolume} from './AudioUtils/СhangeVolume';

import {ModifiedDataView} from '../ModifiedDataView/ModifiedDataView';
import {interleaveAudioData} from './General/InterleaveAudioData';

export class InterleaverUtils implements AudioUtils {
	private readonly audioInterleaverParams: InterleaverParams;
	private changedParams: InterleaverParams;

	private dataCollection: ModifiedDataView[] = [];

	private readonly emptyData = new Uint8Array(0);
	private interleavedData: ModifiedDataView;

	constructor(interleaverParams: InterleaverParams) {
		this.audioInterleaverParams = interleaverParams;

		this.changedParams = {...this.audioInterleaverParams};

		this.interleavedData = new ModifiedDataView(this.emptyData.buffer);
	}

	public setAudioData(audioData: Uint8Array[]): this {
		this.dataCollection = audioData.map((audioData: Uint8Array) => new ModifiedDataView(audioData.buffer));

		this.changedParams = {...this.audioInterleaverParams};

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
		const preProcessVolume = this.audioInterleaverParams.preProcessVolume ?? 100;

		if (preProcessVolume !== 100) {
			changeVolume(this.interleavedData, this.changedParams, preProcessVolume);
		}

		return this;
	}

	public checkPostProcessVolume(): this {
		const postProcessVolume = this.audioInterleaverParams.postProcessVolume ?? 100;

		if (postProcessVolume !== 100) {
			changeVolume(this.interleavedData, this.changedParams, postProcessVolume);
		}

		return this;
	}

	public getAudioData(): Uint8Array {
		return new Uint8Array(this.interleavedData.buffer);
	}
}
