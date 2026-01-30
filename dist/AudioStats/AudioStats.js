"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioStats = void 0;
const stream_1 = require("stream");
const ModifiedDataView_1 = require("../ModifiedDataView/ModifiedDataView");
const pcm_monitor_1 = require("../../pcm-monitor");
const RMSMonitor_1 = require("./RMSMonitor");
class AudioStats extends stream_1.Writable {
    constructor(params) {
        super();
        this.params = params;
        this.monitor = pcm_monitor_1.PcmMonitor.new(params.channels, params.sampleRate);
        this.rmsMonitors = params.channels.map(() => new RMSMonitor_1.RMSMonitor());
    }
    _write(chunk, _, callback) {
        const samples = normaliseChunk(chunk, this.params.bitDepth);
        this.monitor.addSamples(samples);
        for (const sample of samples) {
            this.rmsMonitors.forEach(m => {
                m.onSample(sample);
            });
        }
        callback();
    }
    getStats() {
        const stats = this.monitor.getStats();
        stats.rms = this.rmsMonitors.map(m => m.getRMS());
        return stats;
    }
    /** Resets the peak and rms measurements.
     * Intended to be called at the stats update frequency of the PCMMonitor module.
     */
    resetPeaks() {
        this.monitor.resetPeaks();
        this.rmsMonitors.forEach(m => {
            m.reset();
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    close() { }
}
exports.AudioStats = AudioStats;
/** Converts a raw buffer of little-endian signed integer samples to an array of floats normalised to [-1, 1] */
function normaliseChunk(chunk, bitDepth) {
    const bytesPerSample = bitDepth / 8;
    const audioData = new ModifiedDataView_1.ModifiedDataView(chunk.buffer, chunk.byteOffset, chunk.length);
    // Normalisation coefficients
    const N = 2 ** bitDepth;
    const a = 2 / (N - 1);
    const b = 1 - ((N - 2) / (N - 1));
    // Normalize from signed bitDepth to [-1, 1]
    const normaliseSample = (sample) => (a * sample) + b;
    const numSamples = Math.floor(audioData.byteLength / bytesPerSample);
    const samples = new Float64Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
        const rawSample = audioData[`getInt${bitDepth}`](i * bytesPerSample, true);
        samples[i] = normaliseSample(rawSample);
    }
    return samples;
}
