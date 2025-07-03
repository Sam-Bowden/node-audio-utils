import { Writable } from 'stream';
import { type StatsParams } from '../Types/ParamTypes';
export declare class AudioStats extends Writable {
    channels: ChannelStats[];
    private currentChannel;
    private readonly statsParams;
    constructor(statsParams: StatsParams);
    reset(): void;
    _write(chunk: Uint8Array, _: BufferEncoding, callback: (error?: Error) => void): void;
}
export declare class ChannelStats {
    private sumOfSquares;
    private count;
    private peakValue;
    private readonly maxRange;
    constructor(maxRange: number);
    update(sample: number): void;
    get rootMeanSquare(): number;
    get peak(): number;
    reset(): void;
}
