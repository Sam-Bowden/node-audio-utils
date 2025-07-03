import { Writable } from 'stream';
import { type InputParams } from '../Types/ParamTypes';
export declare class AudioStats extends Writable {
    channels: ChannelStats[];
    currentChannel: number;
    private readonly inputParams;
    constructor(inputParams: InputParams);
    reset(): void;
    _write(chunk: Uint8Array, _: BufferEncoding, callback: (error?: Error) => void): void;
}
export declare class ChannelStats {
    sumOfSquares: number;
    count: number;
    peakValue: number;
    maxRange: number;
    constructor(maxRange: number);
    update(sample: number): void;
    get rootMeanSquare(): number;
    get peak(): number;
    reset(): void;
}
