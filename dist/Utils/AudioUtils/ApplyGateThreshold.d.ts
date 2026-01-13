import { type InputParams, type MixerParams } from '../../Types/ParamTypes';
import { type ModifiedDataView } from '../../ModifiedDataView/ModifiedDataView';
import { type GateState } from '../GateState';
export declare function applyGateThreshold(audioData: ModifiedDataView, params: InputParams | MixerParams, gateState: GateState): void;
