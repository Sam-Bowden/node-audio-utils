import { type AudioUtils } from '../Types/AudioUtils';
import { type InterleaverParams } from '../Types/ParamTypes';
export declare class InterleaverUtils implements AudioUtils {
    private readonly audioInterleaverParams;
    private changedParams;
    private dataCollection;
    private readonly emptyData;
    private interleavedData;
    constructor(interleaverParams: InterleaverParams);
    setAudioData(audioData: Uint8Array[]): this;
    interleave(): this;
    checkVolume(): this;
    getAudioData(): Uint8Array;
}
