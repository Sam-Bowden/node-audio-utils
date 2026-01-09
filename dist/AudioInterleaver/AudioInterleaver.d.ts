import { type InputParams, type OmitSomeParams, type InterleaverParams } from '../Types/ParamTypes';
import { Readable } from 'stream';
import { AudioInput } from '../AudioInput/AudioInput';
export declare class AudioInterleaver extends Readable {
    private readonly interleaverParams;
    private readonly audioUtils;
    private readonly delayTimeValue;
    private isWork;
    private readonly inputs;
    constructor(params: InterleaverParams);
    get inputLength(): number;
    get params(): Readonly<InterleaverParams>;
    set params(params: OmitSomeParams<InterleaverParams>);
    _read(): void;
    _destroy(error: Error, callback: (error?: Error) => void): void;
    createAudioInput(inputParams: InputParams, index: number): AudioInput;
    changeAudioInputIndex(audioInput: AudioInput, index: number): boolean;
    removeAudioinput(audioInput: AudioInput): boolean;
}
