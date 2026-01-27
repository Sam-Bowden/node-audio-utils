import 'mocha';
import {expect} from 'chai';
import {AudioStats} from './AudioStats';
import {Channel} from '../../pcm-monitor';

/** Generic so I can verify the rust implementation against the existing tests */
abstract class LoudnessStatsGeneric {
	abstract _write(chunk: Uint8Array, _: BufferEncoding, callback: (error?: Error) => void): void;
	abstract getStats(): {mLufs: number; sLufs: number; iLufs: number};
}

type WaveParams = {
	durationMs: number;
	numChannels?: number;
	frequency?: number;
	sampleRate?: number;
	dBFS?: number | number[];
};

function sendWave(stats: LoudnessStatsGeneric, params: WaveParams) {
	const sampleRate = params.sampleRate ?? 48_000;
	const numChannels = params.numChannels ?? 2;
	const frequency = params.frequency ?? 1_000;
	const numSamples = Math.floor(sampleRate * params.durationMs / 1000);

	let levelPerChannel: number[] = new Array<number>(numChannels);
	if (Array.isArray(params.dBFS)) {
		levelPerChannel = params.dBFS;
	} else {
		levelPerChannel.fill(params.dBFS ?? 0);
	}

	const amplitudePerChannel = levelPerChannel.map(dBFSToAmplitude);

	// Send all samples as one buffer (unrealistic, but speeds up the tests)
	// Signed, little-endian
	const totalSamples = numSamples * numChannels;
	const buffer = new ArrayBuffer(totalSamples * 2); // 16 bit
	const view = new DataView(buffer);

	let offset = 0;
	for (let i = 0; i < numSamples; i++) {
		const theta = 2 * Math.PI * i * frequency / sampleRate; // Samples * (waves / second) % (samples / second) = waves
		for (let ch = 0; ch < numChannels; ch++) {
			const sample = Math.sin(theta) * amplitudePerChannel[ch];
			const uint16Value = 0.5 * ((((2 ** 16) - 1) * sample) - 1);
			view.setUint16(offset, uint16Value, true);
			offset += 2;
		}
	}

	stats._write(new Uint8Array(buffer), 'binary', () => undefined);
}

function sendSilence(stats: LoudnessStatsGeneric, params: Omit<WaveParams, 'frequency' | 'dBFS'>) {
	const sampleRate = params.sampleRate ?? 48_000;
	const numChannels = params.numChannels ?? 2;
	const numSamples = Math.floor(sampleRate * params.durationMs / 1000);

	const totalSamples = numSamples * numChannels;
	const buffer = new ArrayBuffer(totalSamples * 2);
	const view = new DataView(buffer);

	let offset = 0;
	const uint16Value = ((2 ** 16) - 1) / 2;
	for (let i = 0; i < numSamples; i++) {
		for (let ch = 0; ch < numChannels; ch++) {
			view.setUint16(offset, uint16Value, true);
			offset += 2;
		}
	}

	stats._write(new Uint8Array(buffer), 'binary', () => undefined);
}

function dBFSToAmplitude(dBFS: number): number {
	return 10 ** (dBFS / 20);
}

function createLoudnessStats(channels: Channel[]): LoudnessStatsGeneric {
	const stats = new AudioStats({
		sampleRate: 48000,
		channels,
		bitDepth: 16,
	});

	return stats;
}

describe('LoudnessStats', () => {
	// See https://www.itu.int/dms_pubrec/itu-r/rec/bs/R-REC-BS.1770-5-202311-I!!PDF-E.pdf

	it('5 minute test', () => {
		const loudnessStats = createLoudnessStats([Channel.Center]);
		sendWave(loudnessStats, {
			numChannels: 1,
			frequency: 997,
			durationMs: 5 * 60_000,
		});
		expect(loudnessStats.getStats().iLufs).to.be.approximately(-3.01, 0.001);
	}).timeout(60_000);

	it('Passes ITU-R 1770 997Hz 0dBFS tone test', () => {
		const loudnessStats = createLoudnessStats([Channel.Center]);
		sendWave(loudnessStats, {
			numChannels: 1,
			frequency: 997,
			durationMs: 20_000,
		});
		expect(loudnessStats.getStats().iLufs).to.be.approximately(-3.01, 0.001);
	});

	// See https://tech.ebu.ch/docs/tech/tech3341.pdf

	it('Passes EBU Test case #1', () => {
		const loudnessStats = createLoudnessStats([Channel.Left, Channel.Right]);
		sendWave(loudnessStats, {
			durationMs: 20_000,
			dBFS: -23.0,
		});
		expect(loudnessStats.getStats().mLufs).to.be.approximately(-23.0, 0.1);
		expect(loudnessStats.getStats().sLufs).to.be.approximately(-23.0, 0.1);
		expect(loudnessStats.getStats().iLufs).to.be.approximately(-23.0, 0.1);
	});

	it('Passes EBU Test case #2', () => {
		const loudnessStats = createLoudnessStats([Channel.Left, Channel.Right]);
		sendWave(loudnessStats, {
			durationMs: 20_000,
			dBFS: -33.0,
		});
		expect(loudnessStats.getStats().mLufs).to.be.approximately(-33.0, 0.1);
		expect(loudnessStats.getStats().sLufs).to.be.approximately(-33.0, 0.1);
		expect(loudnessStats.getStats().iLufs).to.be.approximately(-33.0, 0.1);
	});

	it('Passes EBU Test case #3', () => {
		const loudnessStats = createLoudnessStats([Channel.Left, Channel.Right]);
		sendWave(loudnessStats, {
			durationMs: 10_000,
			dBFS: -36.0,
		});
		sendWave(loudnessStats, {
			durationMs: 60_000,
			dBFS: -23.0,
		});
		sendWave(loudnessStats, {
			durationMs: 10_000,
			dBFS: -36.0,
		});
		expect(loudnessStats.getStats().iLufs).to.be.approximately(-23.0, 0.1);
	}).timeout(4_000);

	it('Passes EBU Test case #4', () => {
		const loudnessStats = createLoudnessStats([Channel.Left, Channel.Right]);
		sendWave(loudnessStats, {
			durationMs: 10_000,
			dBFS: -72.0,
		});
		sendWave(loudnessStats, {
			durationMs: 10_000,
			dBFS: -36.0,
		});
		sendWave(loudnessStats, {
			durationMs: 60_000,
			dBFS: -23.0,
		});
		sendWave(loudnessStats, {
			durationMs: 10_000,
			dBFS: -36.0,
		});
		sendWave(loudnessStats, {
			durationMs: 10_000,
			dBFS: -72.0,
		});
		expect(loudnessStats.getStats().iLufs).to.be.approximately(-23.0, 0.1);
	}).timeout(4_000);

	it('Passes EBU Test case #5', () => {
		const loudnessStats = createLoudnessStats([Channel.Left, Channel.Right]);
		sendWave(loudnessStats, {
			durationMs: 20_000,
			dBFS: -26.0,
		});
		sendWave(loudnessStats, {
			durationMs: 20_100,
			dBFS: -20.0,
		});
		sendWave(loudnessStats, {
			durationMs: 20_000,
			dBFS: -26.0,
		});
		expect(loudnessStats.getStats().iLufs).to.be.approximately(-23.0, 0.1);
	}).timeout(4_000);

	it('Passes EBU Test case #6', () => {
		const loudnessStats = createLoudnessStats([Channel.Left, Channel.Right, Channel.Center, Channel.LeftSurround, Channel.RightSurround]);
		sendWave(loudnessStats, {
			durationMs: 20_000,
			numChannels: 5,
			dBFS: [-28.0, -28.0, -24.0, -30.0, -30.0],
		});
		expect(loudnessStats.getStats().iLufs).to.be.approximately(-23.0, 0.1);
	});

	// #7 & #8 specify authentic programmes

	it('Passes EBU Test case #9', () => {
		const loudnessStats = createLoudnessStats([Channel.Left, Channel.Right]);
		for (let i = 0; i < 3; i++) {
			sendWave(loudnessStats, {durationMs: 1_340, dBFS: -20.0});
			sendWave(loudnessStats, {durationMs: 1_660, dBFS: -30.0});
		}

		// S LUFS stabilises after 3s
		expect(loudnessStats.getStats().sLufs).to.be.approximately(-23.0, 0.1);
		for (let i = 0; i < 2; i++) {
			sendWave(loudnessStats, {durationMs: 1_340, dBFS: -20.0});
			expect(loudnessStats.getStats().sLufs).to.be.approximately(-23.0, 0.1);
			sendWave(loudnessStats, {durationMs: 1_660, dBFS: -30.0});
			expect(loudnessStats.getStats().sLufs).to.be.approximately(-23.0, 0.1);
		}
	});

	// #10 is for file-based meters

	it('Passes EBU Test case #11', () => {
		const loudnessStats = createLoudnessStats([Channel.Left, Channel.Right]);
		let maxMLUFS = -Infinity;
		for (let i = 0; i < 20; i++) {
			sendSilence(loudnessStats, {durationMs: i * 150});
			sendWave(loudnessStats, {durationMs: 3_000, dBFS: i - 38.0});
			maxMLUFS = Math.max(maxMLUFS, loudnessStats.getStats().mLufs);
			sendSilence(loudnessStats, {durationMs: 3_000 - (i * 150)});
			expect(maxMLUFS).to.be.approximately(i - 38.0, 0.1);
		}
	}).timeout(4_000);

	it('Passes EBU Test case #12', () => {
		const loudnessStats = createLoudnessStats([Channel.Left, Channel.Right]);
		for (let i = 0; i < 3; i++) {
			sendWave(loudnessStats, {durationMs: 180, dBFS: -20.0});
			sendWave(loudnessStats, {durationMs: 220, dBFS: -30.0});
		}

		// M LUFS stabilises after 1s
		expect(loudnessStats.getStats().mLufs).to.be.approximately(-23.0, 0.1);
		for (let i = 0; i < 22; i++) {
			sendWave(loudnessStats, {durationMs: 180, dBFS: -20.0});
			sendWave(loudnessStats, {durationMs: 220, dBFS: -30.0});
			expect(loudnessStats.getStats().mLufs).to.be.approximately(-23.0, 0.1);
		}
	});

	// #13 is for file-based meters

	// #14 is impossible under the recommended 100ms window step size for momentary loudness
	// See: https://github.com/jiixyj/libebur128/issues/93
	// To pass this would require a 20ms step size
});
