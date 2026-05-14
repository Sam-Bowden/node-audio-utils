
import {type InputParams, type ProcessorParams} from '../../Types/ParamTypes';
import {type IntType, type BitDepth} from '../../Types/AudioTypes';

import {ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import {isLittleEndian} from '../General/IsLittleEndian';
import {getMethodName} from '../General/GetMethodName';

export function changeBitDepth(audioData: ModifiedDataView, inputParams: InputParams, processorParams: ProcessorParams): ModifiedDataView {
	const oldBytesPerElement = inputParams.bitDepth / 8;
	const newBytesPerElement = processorParams.bitDepth / 8;

	const scalingFactor = 2 ** (processorParams.bitDepth - inputParams.bitDepth);
	const maxValue = 2 ** (processorParams.bitDepth - 1);

	const isLe = isLittleEndian(inputParams.endianness);

	const dataSize = audioData.byteLength * (processorParams.bitDepth / inputParams.bitDepth);

	const allocData = new Uint8Array(dataSize);
	const allocDataView = new ModifiedDataView(allocData.buffer);

	const getSampleMethod: `get${IntType}${BitDepth}` = `get${getMethodName(inputParams.bitDepth, inputParams.unsigned)}`;
	const setSampleMethod: `set${IntType}${BitDepth}` = `set${getMethodName(processorParams.bitDepth, processorParams.unsigned)}`;

	for (let index = 0; index < audioData.byteLength; index += oldBytesPerElement) {
		const audioSample = audioData[getSampleMethod](index, isLe);

		let scaledSample = Math.floor(audioSample * scalingFactor);

		if (inputParams.unsigned) {
			scaledSample -= maxValue;
		}

		const newSamplePosition = Math.floor(index * (newBytesPerElement / oldBytesPerElement));

		allocDataView[setSampleMethod](newSamplePosition, scaledSample, isLe);
	}

	inputParams.bitDepth = processorParams.bitDepth;

	return allocDataView;
}
