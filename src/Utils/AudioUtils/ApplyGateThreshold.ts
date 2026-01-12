import {type InputParams, type MixerParams} from '../../Types/ParamTypes';
import {type ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import {type IntType, type BitDepth} from '../../Types/AudioTypes';

import {isLittleEndian} from '../General/IsLittleEndian';
import {getMethodName} from '../General/GetMethodName';

export function applyGateThreshold(audioData: ModifiedDataView, params: InputParams | MixerParams): void {
	const bytesPerElement = params.bitDepth / 8;
	const isLe = isLittleEndian(params.endianness);

	const halfRange = (2 ** params.bitDepth) / 2;
	const equilibrium = params.unsigned ? halfRange : 0;
	const threshold = halfRange * (params.gateThreshold!);

	const upperBound = equilibrium + threshold - 1;
	const lowerBound = equilibrium - threshold;

	const getSampleMethod: `get${IntType}${BitDepth}` = `get${getMethodName(params.bitDepth, params.unsigned)}`;
	const setSampleMethod: `set${IntType}${BitDepth}` = `set${getMethodName(params.bitDepth, params.unsigned)}`;

	for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
		const sample = audioData[getSampleMethod](index, isLe);

		const gatedSample = sample <= lowerBound || sample >= upperBound ? sample : equilibrium;

		audioData[setSampleMethod](index, gatedSample, isLe);
	}
}
