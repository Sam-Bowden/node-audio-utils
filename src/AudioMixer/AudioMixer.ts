import {type MixerParams, type InputParams, type OmitSomeParams} from '../Types/ParamTypes';

import {Readable} from 'stream';

import {assertHighWaterMark} from '../Asserts/AssertHighWaterMark';

import {MixerUtils} from '../Utils/MixerUtils';
import {AudioInput} from '../AudioInput/AudioInput';

export class AudioMixer extends Readable {
	private readonly mixerParams: MixerParams;
	private readonly audioUtils: MixerUtils;

	private readonly inputs: AudioInput[] = [];

	constructor(params: MixerParams) {
		super();

		this.mixerParams = params;
		this.audioUtils = new MixerUtils(params);
	}

	get params(): Readonly<MixerParams> {
		return this.mixerParams;
	}

	set params(params: OmitSomeParams<MixerParams>) {
		Object.assign(this.mixerParams, params);
	}

	_read(): void {
		assertHighWaterMark(this.params.bitDepth, this.params.highWaterMark);

		const allInputsSize: number[] = this.inputs.map((input: AudioInput) => input.dataSize)
			.filter(size => size >= (this.params.highWaterMark ?? (this.params.bitDepth / 8)));

		if (allInputsSize.length > 0) {
			const minDataSize: number = this.mixerParams.highWaterMark ?? Math.min(...allInputsSize);

			const availableInputs = this.inputs.filter((input: AudioInput) => input.dataSize >= minDataSize);
			const dataCollection: Uint8Array[] = availableInputs.map((input: AudioInput) => input.getData(minDataSize));

			const mixedData = this.audioUtils.setAudioData(dataCollection)
				.mix()
				.checkVolume()
				.applyGate()
				.applyDownwardCompressor()
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
		const audioInput = new AudioInput(inputParams, this.mixerParams, this.removeAudioinput.bind(this));

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
