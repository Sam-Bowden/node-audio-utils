import {type InputParams, type MixerParams} from '../../Types/ParamTypes';
import {type ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import {type IntType, type BitDepth} from '../../Types/AudioTypes';

import {isLittleEndian} from '../General/IsLittleEndian';
import {getMethodName} from '../General/GetMethodName';
import {convertThreshold} from '../General/ConvertThreshold';

export function applyDownwardCompressor(audioData: ModifiedDataView, params: InputParams | MixerParams): void {
	const bytesPerElement = params.bitDepth / 8;
	const isLe = isLittleEndian(params.endianness);

	const {upperThreshold, lowerThreshold} = convertThreshold(params.bitDepth, params.unsigned, params.downwardCompressorThreshold!);

	const ratio = params.downwardCompressorRatio;

	const getSampleMethod: `get${IntType}${BitDepth}` = `get${getMethodName(params.bitDepth, params.unsigned)}`;
	const setSampleMethod: `set${IntType}${BitDepth}` = `set${getMethodName(params.bitDepth, params.unsigned)}`;

	for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
		const sample = audioData[getSampleMethod](index, isLe);

		let compressedSample;

		if (sample > upperThreshold) {
			if (ratio === undefined) {
				compressedSample = upperThreshold;
			} else {
				compressedSample = ((sample - upperThreshold) / ratio) + upperThreshold;
			}
		} else if (sample < lowerThreshold) {
			if (ratio === undefined) {
				compressedSample = lowerThreshold;
			} else {
				compressedSample = ((sample - lowerThreshold) / ratio) + lowerThreshold;
			}
		} else {
			compressedSample = sample;
		}

		audioData[setSampleMethod](index, compressedSample, isLe);
	}
}
