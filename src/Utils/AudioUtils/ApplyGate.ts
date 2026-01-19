import {type InputParams, type MixerParams} from '../../Types/ParamTypes';
import {type ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import {type IntType, type BitDepth} from '../../Types/AudioTypes';
import {type GateState} from '../GateState';

import {isLittleEndian} from '../General/IsLittleEndian';
import {getMethodName} from '../General/GetMethodName';
import {convertThreshold} from '../General/ConvertThreshold';

export function applyGate(audioData: ModifiedDataView, params: InputParams | MixerParams, gateState: GateState): void {
	const bytesPerElement = params.bitDepth / 8;
	const isLe = isLittleEndian(params.endianness);

	const {upperThreshold, lowerThreshold, equilibrium} = convertThreshold(params.bitDepth, params.unsigned, params.gateThreshold!);

	const getSampleMethod: `get${IntType}${BitDepth}` = `get${getMethodName(params.bitDepth, params.unsigned)}`;
	const setSampleMethod: `set${IntType}${BitDepth}` = `set${getMethodName(params.bitDepth, params.unsigned)}`;

	for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
		const sample = audioData[getSampleMethod](index, isLe);

		if (sample <= lowerThreshold || sample >= upperThreshold) {
			gateState.holdSamplesRemaining = params.gateHoldSamples;
			if (params.gateAttackSamples === undefined) {
				gateState.attenuation = 1;
			} else {
				gateState.attenuation = Math.min(gateState.attenuation + (1 / params.gateAttackSamples), 1);
			}
		} else if (gateState.holdSamplesRemaining !== undefined && gateState.holdSamplesRemaining > 0) {
			gateState.holdSamplesRemaining -= 1;
		} else if (params.gateReleaseSamples === undefined) {
			gateState.attenuation = 0;
		} else {
			gateState.attenuation = Math.max(gateState.attenuation - (1 / params.gateReleaseSamples), 0);
		}

		audioData[setSampleMethod](index, ((sample - equilibrium) * gateState.attenuation) + equilibrium, isLe);
	}
}
