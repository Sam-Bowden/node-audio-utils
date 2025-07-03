import {Writable} from 'stream';
import {getValueRange} from '../Utils/General/GetValueRange';
import {type InputParams} from '../Types/ParamTypes';
import {ModifiedDataView} from '../ModifiedDataView/ModifiedDataView';
import {isLittleEndian} from '../Utils/General/IsLittleEndian';
import {type BitDepth, type IntType} from '../Types/AudioTypes';
import {getMethodName} from '../Utils/General/GetMethodName';

export class AudioStats extends Writable {
	channels: ChannelStats[];
	currentChannel = 0;
	private readonly inputParams: InputParams;

	constructor(inputParams: InputParams) {
		super();
		this.inputParams = inputParams;

		this.channels = Array.from(
			{length: this.inputParams.channels},
			() => new ChannelStats(getValueRange(this.inputParams.bitDepth).max),
		);
	}

	reset() {
		this.channels.forEach(c => {
			c.reset();
		});
	}

	public _write(chunk: Uint8Array, _: BufferEncoding, callback: (error?: Error) => void): void {
		const audioData = new ModifiedDataView(chunk.buffer, chunk.byteOffset, chunk.length);

		const bytesPerElement = this.inputParams.bitDepth / 8;

		const isLe = isLittleEndian(this.inputParams.endianness);

		const getSampleMethod: `get${IntType}${BitDepth}` = `get${getMethodName(this.inputParams.bitDepth, this.inputParams.unsigned)}`;

		for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
			const sample = audioData[getSampleMethod](index, isLe);

			this.channels[this.currentChannel].update(sample);
			this.currentChannel += 1;
			this.currentChannel %= this.inputParams.channels;
		}

		callback();
	}
}

export class ChannelStats {
	sumOfSquares: number;
	count: number;
	peakValue: number;
	maxRange: number;

	constructor(maxRange: number) {
		this.sumOfSquares = 0;
		this.count = 0;
		this.peakValue = 0;
		this.maxRange = maxRange;
	}

	update(sample: number) {
		this.sumOfSquares += sample ** 2;
		this.count += 1;
		this.peakValue = Math.max(this.peakValue, Math.abs(sample));
	}

	get rootMeanSquare(): number {
		if (this.count === 0) {
			return 0;
		}

		return Math.sqrt(this.sumOfSquares / this.count) / this.maxRange;
	}

	get peak(): number {
		return this.peakValue / this.maxRange;
	}

	reset() {
		this.sumOfSquares = 0;
		this.count = 0;
		this.peakValue = 0;
	}
}
