import {Writable} from 'stream';
import {ModifiedDataView} from '../ModifiedDataView/ModifiedDataView';
import {type SampleRate, type BitDepth} from '../Types/AudioTypes';

import {
	type Channel, Monitor, type Stats,
} from 'node-ebur128';
import {RmsMonitor} from './RMSMonitor';

export class AudioStats extends Writable {
	private readonly monitor: Monitor;
	private readonly rmsMonitors: RmsMonitor[];

	constructor(readonly params: LoudnessMonitorParams) {
		super();
		this.monitor = Monitor.new(params.channels, params.sampleRate);
		this.rmsMonitors = params.channels.map(() => new RmsMonitor());
	}

	public _write(chunk: Uint8Array, _: BufferEncoding, callback: (error?: Error) => void): void {
		const samples = normaliseChunk(chunk, this.params.bitDepth);
		this.monitor.addSamples(samples);
		for (const sample of samples) {
			this.rmsMonitors.forEach(m => {
				m.onSample(sample);
			});
		}

		callback();
	}

	public getStats(): Stats & {rms: number[]} {
		return {...this.monitor.getStats(), rms: this.rmsMonitors.map(m => m.getRms())};
	}

	public resetPeaks() {
		this.monitor.resetPeaks();
		this.rmsMonitors.forEach(m => {
			m.reset();
		});
	}
}

export type LoudnessMonitorParams = {
	sampleRate: SampleRate;
	channels: Channel[];
	bitDepth: BitDepth;
};

/** Converts a raw buffer of little-endian signed integer samples to an array of floats normalised to [-1, 1] */
function normaliseChunk(chunk: Uint8Array, bitDepth: BitDepth): Float64Array {
	const bytesPerSample = bitDepth / 8;
	const audioData = new ModifiedDataView(chunk.buffer, chunk.byteOffset, chunk.length);

	// Normalisation coefficients
	const n = 2 ** bitDepth;
	const a = 2 / (n - 1);
	const b = 1 - ((n - 2) / (n - 1));

	// Normalize from signed bitDepth to [-1, 1]
	const normaliseSample = (sample: number) => (a * sample) + b;

	const numSamples = Math.floor(audioData.byteLength / bytesPerSample);

	const samples = new Float64Array(numSamples);
	for (let i = 0; i < numSamples; i++) {
		const rawSample = audioData[`getInt${bitDepth}`](i * bytesPerSample, true);
		samples[i] = normaliseSample(rawSample);
	}

	return samples;
}
