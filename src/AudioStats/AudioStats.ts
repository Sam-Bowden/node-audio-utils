import {Writable} from 'stream';
import {ModifiedDataView} from '../ModifiedDataView/ModifiedDataView';
import {type StatsParams} from '../Types/ParamTypes';

import {Monitor, type Stats as MonitorStats} from 'node-ebur128';
import {Stats} from '../Utils/Stats/Stats';
import {gainToDecibels} from '../Units/Units';
import {getValueRange} from '../Utils/General/GetValueRange';

export class AudioStats extends Writable {
	private readonly monitor: Monitor;
	private readonly stats: Stats;
	private readonly minDb: number;

	constructor(readonly params: StatsParams) {
		super();
		this.monitor = Monitor.new(params.channels, params.sampleRate);
		this.stats = new Stats(params.bitDepth, params.channels.length);
		this.minDb = gainToDecibels(1 / getValueRange(params.bitDepth).max);
	}

	public _write(chunk: Uint8Array, _: BufferEncoding, callback: (error?: Error) => void): void {
		const {bitDepth} = this.params;
		const view = new ModifiedDataView(chunk.buffer, chunk.byteOffset, chunk.length);
		const numSamples = Math.floor(view.byteLength / (bitDepth / 8));

		if (bitDepth === 8) {
			const samples = new Int16Array(numSamples);
			this.fillSamples(samples, i => view.getInt8(i), 256);
			this.monitor.addSamplesI16(samples);
		} else if (bitDepth === 16) {
			const samples = new Int16Array(numSamples);
			this.fillSamples(samples, i => view.getInt16(i * 2, true), 1);
			this.monitor.addSamplesI16(samples);
		} else if (bitDepth === 24) {
			const samples = new Int32Array(numSamples);
			this.fillSamples(samples, i => view.getInt24(i * 3, true), 256);
			this.monitor.addSamplesI32(samples);
		} else {
			const samples = new Int32Array(numSamples);
			this.fillSamples(samples, i => view.getInt32(i * 4, true), 1);
			this.monitor.addSamplesI32(samples);
		}

		callback();
	}

	public getStats(): MonitorStats & {rms: number[]} {
		const monitorStats = this.monitor.getStats();
		const clamp = (db: number) => Math.max(db, this.minDb);
		return {
			...monitorStats,
			truePeaksDbtp: monitorStats.truePeaksDbtp.map(clamp),
			rms: this.stats.channels.map(c => clamp(gainToDecibels(c.rootMeanSquare ?? 0))),
		};
	}

	public resetPeaks() {
		this.monitor.resetPeaks();
		this.stats.reset();
	}

	private fillSamples(target: Int16Array | Int32Array, read: (i: number) => number, scale: number): void {
		for (let i = 0; i < target.length; i++) {
			const raw = read(i);
			target[i] = raw * scale;
			this.stats.update(raw);
		}
	}
}
