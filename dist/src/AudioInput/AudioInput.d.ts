import { type OmitSomeParams, type InputParams, type MixerParams } from '../Types/ParamTypes';
import { Writable } from 'stream';
type SelfRemoveFunction = (audioInput: AudioInput) => void;
export declare class AudioInput extends Writable {
    private readonly inputParams;
    private readonly mixerParams;
    private readonly selfRemoveFunction;
    private readonly audioUtils;
    private audioData;
    private correctionBuffer;
    constructor(inputParams: InputParams, mixerParams: MixerParams, selfRemoveFunction?: SelfRemoveFunction);
    get params(): Readonly<InputParams>;
    set params(params: OmitSomeParams<InputParams>);
    get dataSize(): number;
    _write(chunk: Uint8Array, _: BufferEncoding, callback: (error?: Error) => void): void;
    _destroy(error: Error, callback: (error?: Error) => void): void;
    getData(size: number): Uint8Array;
    private correctByteSize;
    private processData;
    private removeInputSelf;
}
export {};
