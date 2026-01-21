import { Writable } from 'stream';
import { ModifiedDataView } from '../ModifiedDataView/ModifiedDataView';
import { type SampleRate, type BitDepth } from '../Types/AudioTypes';

import { type Channel, type PCMMonitor, PcmMonitor } from '../../pcm-monitor';

export class AudioStats extends Writable {
	private readonly monitor: PCMMonitor;

	constructor(readonly params: LoudnessMonitorParams) {
		super();
		this.monitor = PcmMonitor.new(params.channels, params.sampleRate);
	}

	public _write(chunk: Uint8Array, _: BufferEncoding, callback: (error?: Error) => void): void {
		this.monitor.addSamples(normaliseChunk(chunk, this.params.bitDepth));
		callback();
	}

	public getStats() {
		return this.monitor.getStats();
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
