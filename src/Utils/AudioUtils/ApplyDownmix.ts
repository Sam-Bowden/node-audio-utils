import {type InputParams} from '../../Types/ParamTypes';
import {type IntType, type BitDepth} from '../../Types/AudioTypes';
import {ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import {isLittleEndian} from '../General/IsLittleEndian';
import {getMethodName} from '../General/GetMethodName';
import {getValueRange} from '../General/GetValueRange';

export function applyDownmix(audioData: ModifiedDataView, params: InputParams): ModifiedDataView {
	const matrix = params.downmixMatrix;

	if (matrix === undefined) {
		return audioData;
	}

	const bytesPerElement = params.bitDepth / 8;
	const isLe = isLittleEndian(params.endianness);
	const valueRange = getValueRange(params.bitDepth, params.unsigned);

	const getSampleMethod: `get${IntType}${BitDepth}` = `get${getMethodName(params.bitDepth, params.unsigned)}`;
	const setSampleMethod: `set${IntType}${BitDepth}` = `set${getMethodName(params.bitDepth, params.unsigned)}`;

	const inputChannels = matrix[0].length;
	const outputChannels = matrix.length;
	const frameCount = audioData.byteLength / (inputChannels * bytesPerElement);

	const outputData = new Uint8Array(frameCount * outputChannels * bytesPerElement);
	const outputDataView = new ModifiedDataView(outputData.buffer);

	for (let frame = 0; frame < frameCount; frame++) {
		const inputOffset = frame * inputChannels * bytesPerElement;

		for (let outCh = 0; outCh < outputChannels; outCh++) {
			let outSample = 0;

			for (let inCh = 0; inCh < inputChannels; inCh++) {
				outSample += (matrix[outCh][inCh] ?? 0) * audioData[getSampleMethod]((inputOffset + (inCh * bytesPerElement)), isLe);
			}

			outputDataView[setSampleMethod](
				((frame * outputChannels) + outCh) * bytesPerElement,
				Math.min(Math.max(Math.round(outSample), valueRange.min), valueRange.max),
				isLe,
			);
		}
	}

	return outputDataView;
}
