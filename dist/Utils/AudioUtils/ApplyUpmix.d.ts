import { type InputParams } from '../../Types/ParamTypes';
import { ModifiedDataView } from '../../ModifiedDataView/ModifiedDataView';
import type { UpmixState } from '../State/UpmixState';
export declare function applyUpmix(audioData: ModifiedDataView, params: InputParams, upmixState: UpmixState): ModifiedDataView | undefined;
