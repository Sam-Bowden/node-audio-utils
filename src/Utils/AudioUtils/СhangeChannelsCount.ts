
import {type InputParams, type ProcessorParams} from '../../Types/ParamTypes';
import {type IntType, type BitDepth} from '../../Types/AudioTypes';

import {ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import {isLittleEndian} from '../General/IsLittleEndian';
import {getMethodName} from '../General/GetMethodName';

export function changeChannelsCount(audioData: ModifiedDataView, inputParams: InputParams, processorParams: ProcessorParams): ModifiedDataView {
	const bytesPerElement = processorParams.bitDepth / 8;

	const isLe = isLittleEndian(inputParams.endianness);

	const dataSize = Math.round(audioData.byteLength * processorParams.channels / inputParams.channels);

	const allocData = new Uint8Array(dataSize);
	const allocDataView = new ModifiedDataView(allocData.buffer);

	const getSampleMethod: `get${IntType}${BitDepth}` = `get${getMethodName(inputParams.bitDepth, inputParams.unsigned)}`;
	const setSampleMethod: `set${IntType}${BitDepth}` = `set${getMethodName(processorParams.bitDepth, processorParams.unsigned)}`;

	for (let oldPosition = 0, newPosition = 0; oldPosition < audioData.byteLength; oldPosition += bytesPerElement * inputParams.channels) {
		const sample = audioData[getSampleMethod](oldPosition, isLe);

		const nextPosition = newPosition + (bytesPerElement * processorParams.channels);

		for (newPosition; newPosition < nextPosition; newPosition += bytesPerElement) {
			allocDataView[setSampleMethod](newPosition, sample, isLe);
		}
	}

	inputParams.channels = processorParams.channels;

	return allocDataView;
}
