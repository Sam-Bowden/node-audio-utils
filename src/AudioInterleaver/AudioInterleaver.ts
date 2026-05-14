import {type InputParams, type OmitSomeParams, type ProcessorParams} from '../Types/ParamTypes';

import {Readable} from 'stream';

import {assertHighWaterMark} from '../Asserts/AssertHighWaterMark';

import {AudioInput} from '../AudioInput/AudioInput';
import {InterleaverUtils} from '../Utils/InterleaverUtils';

export class AudioInterleaver extends Readable {
	private readonly processorParams: ProcessorParams;
	private readonly audioUtils: InterleaverUtils;

	private readonly inputs: AudioInput[] = [];

	constructor(params: ProcessorParams) {
		super();

		this.processorParams = params;
		this.audioUtils = new InterleaverUtils(params);
	}

	public get inputLength(): number {
		return this.inputs.length;
	}

	get params(): Readonly<ProcessorParams> {
		return this.processorParams;
	}

	set params(params: OmitSomeParams<ProcessorParams>) {
		Object.assign(this.processorParams, params);
	}

	_read(): void {
		assertHighWaterMark(this.params.bitDepth, this.params.highWaterMark);

		if (this.inputs.length === 0) {
			return;
		}

		const bytesPerChannel = this.processorParams.highWaterMark ?? (this.processorParams.bitDepth / 8);

		const dataCollection: Uint8Array[] = this.inputs.map((input: AudioInput) => input.getData(bytesPerChannel * input.params.channels));

		const interleavedData = this.audioUtils.setAudioData(dataCollection)
			.interleave()
			.getAudioData();

		this.unshift(interleavedData);
	}

	_destroy(error: Error, callback: (error?: Error) => void): void {
		if (!this.closed) {
			this.inputs.forEach((input: AudioInput) => {
				input.destroy();
			});
		}

		callback(error);
	}

	public createAudioInput(inputParams: InputParams, index: number): AudioInput {
		const processorParams = Object.create(this.processorParams) as ProcessorParams;
		processorParams.channels = inputParams.channels;

		const audioInput = new AudioInput(inputParams, processorParams, this.removeAudioinput.bind(this));

		if (index >= this.inputs.length) {
			this.inputs.push(audioInput);
		} else {
			this.inputs.splice(index, 0, audioInput);
		}

		this.processorParams.channels = this.inputs.reduce((sum, input) => sum + input.params.channels, 0);

		return audioInput;
	}

	public changeAudioInputIndex(audioInput: AudioInput, index: number): boolean {
		const findAudioInput = this.inputs.indexOf(audioInput);

		if (findAudioInput !== -1) {
			const [temp] = this.inputs.splice(findAudioInput, 1);
			this.inputs.splice(index, 0, temp);

			return true;
		}

		return false;
	}

	public removeAudioinput(audioInput: AudioInput): boolean {
		const findAudioInput = this.inputs.indexOf(audioInput);

		if (findAudioInput !== -1) {
			this.inputs.splice(findAudioInput, 1);
			this.processorParams.channels = this.inputs.reduce((sum, input) => sum + input.params.channels, 0);

			return true;
		}

		return false;
	}
}
