import { type InputParams, type MixerParams } from '../../Types/ParamTypes';
import { type ModifiedDataView } from '../../ModifiedDataView/ModifiedDataView';
import { type DownwardCompressorState } from '../State/DownwardCompressorState';
import { type Stats } from '../Stats/Stats';
export declare function applyDownwardCompressor(audioData: ModifiedDataView, params: InputParams | MixerParams, downwardCompressorState: DownwardCompressorState, postDownwardCompressor: Stats): void;
