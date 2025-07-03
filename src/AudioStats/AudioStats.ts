import {Writable} from 'stream';
import {getValueRange} from '../Utils/General/GetValueRange';
import {type StatsParams} from '../Types/ParamTypes';
import {ModifiedDataView} from '../ModifiedDataView/ModifiedDataView';
import {isLittleEndian} from '../Utils/General/IsLittleEndian';
import {type BitDepth, type IntType} from '../Types/AudioTypes';
import {getMethodName} from '../Utils/General/GetMethodName';

export class AudioStats extends Writable {
	channels: ChannelStats[];
	private currentChannel = 0;
	private readonly statsParams: StatsParams;

	constructor(statsParams: StatsParams) {
		super();
		this.statsParams = statsParams;

		this.channels = Array.from(
			{length: this.statsParams.channels},
			() => new ChannelStats(getValueRange(this.statsParams.bitDepth).max),
		);
	}

	reset() {
		this.channels.forEach(c => {
			c.reset();
		});
	}

	public _write(chunk: Uint8Array, _: BufferEncoding, callback: (error?: Error) => void): void {
		const audioData = new ModifiedDataView(chunk.buffer, chunk.byteOffset, chunk.length);

		const bytesPerElement = this.statsParams.bitDepth / 8;

		const isLe = isLittleEndian(this.statsParams.endianness);

		const getSampleMethod: `get${IntType}${BitDepth}` = `get${getMethodName(this.statsParams.bitDepth, this.statsParams.unsigned)}`;

		for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
			const sample = audioData[getSampleMethod](index, isLe);

			this.channels[this.currentChannel].update(sample);
			this.currentChannel += 1;
			this.currentChannel %= this.statsParams.channels;
		}

		callback();
	}
}

export class ChannelStats {
	private sumOfSquares: number;
	private count: number;
	private peakValue: number;
	private readonly maxRange: number;

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
