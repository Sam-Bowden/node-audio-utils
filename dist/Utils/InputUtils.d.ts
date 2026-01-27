import { type AudioUtils } from '../Types/AudioUtils';
import { type InputParams, type MixerParams } from '../Types/ParamTypes';
export declare class InputUtils implements AudioUtils {
    private readonly audioInputParams;
    private readonly audioMixerParams;
    private changedParams;
    private readonly emptyData;
    private audioData;
    private readonly gateState;
    private readonly downwardCompressorState;
    constructor(inputParams: InputParams, mixerParams: MixerParams);
    setAudioData(audioData: Uint8Array): this;
    checkIntType(): this;
    checkBitDepth(): this;
    checkSampleRate(): this;
    checkChannelsCount(): this;
    checkPreProcessVolume(): this;
    checkPostProcessVolume(): this;
    applyGate(): this;
    applyDownwardCompressor(): this;
    checkEndianness(): this;
    getAudioData(): Uint8Array;
}
