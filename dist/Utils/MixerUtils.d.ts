import { type AudioUtils } from '../Types/AudioUtils';
import { type MixerParams } from '../Types/ParamTypes';
export declare class MixerUtils implements AudioUtils {
    private readonly audioMixerParams;
    private changedParams;
    private dataCollection;
    private readonly emptyData;
    private mixedData;
    private readonly gateState;
    constructor(mixerParams: MixerParams);
    setAudioData(audioData: Uint8Array[]): this;
    mix(): this;
    checkVolume(): this;
    applyGateThreshold(): this;
    getAudioData(): Uint8Array;
}
