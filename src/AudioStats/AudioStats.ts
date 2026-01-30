import {Writable} from 'stream';
import {ModifiedDataView} from '../ModifiedDataView/ModifiedDataView';
import {type SampleRate, type BitDepth} from '../Types/AudioTypes';

import {
	type Channel, type PCMMonitor, PcmMonitor, type PCMStats,
} from '../../pcm-monitor';
import {RMSMonitor} from './RMSMonitor';

export class AudioStats extends Writable {
	/** Generic audio monitors from EBUR128 crate (LUFS, LRA, true peak) */
	private readonly monitor: PCMMonitor;
	private readonly rmsMonitors: RMSMonitor[];

	constructor(readonly params: LoudnessMonitorParams) {
		super();
		this.monitor = PcmMonitor.new(params.channels, params.sampleRate);
		this.rmsMonitors = params.channels.map(() => new RMSMonitor());
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

	public getStats(): PCMStats & {rms: number[]} {
		const stats = this.monitor.getStats() as PCMStats & {rms: number[]};
		stats.rms = this.rmsMonitors.map(m => m.getRMS());
		return stats;
	}

	/** Resets the peak and rms measurements.
	 * Intended to be called at the stats update frequency of the PCMMonitor module.
	 */
	public resetPeaks() {
		this.monitor.resetPeaks();
		this.rmsMonitors.forEach(m => {
			m.reset();
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public close() { }
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
	const N = 2 ** bitDepth;
	const a = 2 / (N - 1);
	const b = 1 - ((N - 2) / (N - 1));

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
