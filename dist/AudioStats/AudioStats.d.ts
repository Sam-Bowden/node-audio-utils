import { Writable } from 'stream';
import { type SampleRate, type BitDepth } from '../Types/AudioTypes';
import { type Channel, type PCMStats } from '../../pcm-monitor';
export declare class AudioStats extends Writable {
    readonly params: LoudnessMonitorParams;
    /** Generic audio monitors from EBUR128 crate (LUFS, LRA, true peak) */
    private readonly monitor;
    private readonly rmsMonitors;
    constructor(params: LoudnessMonitorParams);
    _write(chunk: Uint8Array, _: BufferEncoding, callback: (error?: Error) => void): void;
    getStats(): PCMStats & {
        rms: number[];
    };
    /** Resets the peak and rms measurements.
     * Intended to be called at the stats update frequency of the PCMMonitor module.
     */
    resetPeaks(): void;
    close(): void;
}
export type LoudnessMonitorParams = {
    sampleRate: SampleRate;
    channels: Channel[];
    bitDepth: BitDepth;
};
