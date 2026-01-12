import { type AudioUtils } from '../Types/AudioUtils';
import { type InputParams, type MixerParams } from '../Types/ParamTypes';
export declare class InputUtils implements AudioUtils {
    private readonly audioInputParams;
    private readonly audioMixerParams;
    private changedParams;
    private readonly emptyData;
    private audioData;
    constructor(inputParams: InputParams, mixerParams: MixerParams);
    setAudioData(audioData: Uint8Array): this;
    checkIntType(): this;
    checkBitDepth(): this;
    checkSampleRate(): this;
    checkChannelsCount(): this;
    checkVolume(): this;
    applyGateThreshold(): this;
    checkEndianness(): this;
    getAudioData(): Uint8Array;
}
