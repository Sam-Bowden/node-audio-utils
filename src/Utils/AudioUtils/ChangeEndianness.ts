import {type InputParams, type ProcessorParams} from '../../Types/ParamTypes';
import {type ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import {type IntType, type BitDepth} from '../../Types/AudioTypes';

import {isLittleEndian} from '../General/IsLittleEndian';
import {getMethodName} from '../General/GetMethodName';

export function changeEndianness(audioData: ModifiedDataView, inputParams: InputParams, processorParams: ProcessorParams): void {
	const bytesPerElement = inputParams.bitDepth / 8;

	const isInputLe = isLittleEndian(inputParams.endianness);
	const isMixerLe = isLittleEndian(processorParams.endianness);

	const getSampleMethod: `get${IntType}${BitDepth}` = `get${getMethodName(inputParams.bitDepth, inputParams.unsigned)}`;
	const setSampleMethod: `set${IntType}${BitDepth}` = `set${getMethodName(inputParams.bitDepth, inputParams.unsigned)}`;

	for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
		const sample = audioData[getSampleMethod](index, isInputLe);

		audioData[setSampleMethod](index, sample, isMixerLe);
	}

	inputParams.endianness = processorParams.endianness;
}
