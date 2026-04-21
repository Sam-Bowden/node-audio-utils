import {type ProcessorParams, type InputParams, type OmitSomeParams} from '../Types/ParamTypes';

import {Readable} from 'stream';

import {assertHighWaterMark} from '../Asserts/AssertHighWaterMark';

import {MixerUtils} from '../Utils/MixerUtils';
import {AudioInput} from '../AudioInput/AudioInput';
import {type ProcessingStats} from '../Utils/Stats/ProcessingStats';

export class AudioMixer extends Readable {
	private readonly processorParams: ProcessorParams;
	private readonly audioUtils: MixerUtils;

	private readonly inputs: AudioInput[] = [];

	constructor(params: ProcessorParams) {
		super();

		this.processorParams = params;
		this.audioUtils = new MixerUtils(params);
	}

	get params(): Readonly<ProcessorParams> {
		return this.processorParams;
	}

	set params(params: OmitSomeParams<ProcessorParams>) {
		Object.assign(this.processorParams, params);
	}

	get processingStats(): ProcessingStats {
		return this.audioUtils.processingStats;
	}

	_read(): void {
		assertHighWaterMark(this.params.bitDepth, this.params.highWaterMark);

		const allInputsSize: number[] = this.inputs.map((input: AudioInput) => input.dataSize)
			.filter(size => size >= (this.params.highWaterMark ?? (this.params.bitDepth / 8)));

		if (allInputsSize.length > 0) {
			const minDataSize: number = this.processorParams.highWaterMark ?? Math.min(...allInputsSize);

			const availableInputs = this.inputs.filter((input: AudioInput) => input.dataSize >= minDataSize);
			const dataCollection: Uint8Array[] = availableInputs.map((input: AudioInput) => input.getData(minDataSize));

			const mixedData = this.audioUtils.setAudioData(dataCollection)
				.mix()
				.checkPreProcessVolume()
				.updatePreProcessStats()
				.applyDownwardCompressor()
				.applyGate()
				.checkPostProcessVolume()
				.getAudioData();

			this.unshift(mixedData);
		}
	}

	_destroy(error: Error, callback: (error?: Error) => void): void {
		if (!this.closed) {
			this.inputs.forEach((input: AudioInput) => {
				input.destroy();
			});
		}

		callback(error);
	}

	public createAudioInput(inputParams: InputParams): AudioInput {
		const audioInput = new AudioInput(inputParams, this.processorParams, this.removeAudioinput.bind(this));

		this.inputs.push(audioInput);

		return audioInput;
	}

	public removeAudioinput(audioInput: AudioInput): boolean {
		const findAudioInput = this.inputs.indexOf(audioInput);

		if (findAudioInput !== -1) {
			this.inputs.splice(findAudioInput, 1);

			return true;
		}

		return false;
	}
}
