import {type InputParams, type ProcessorParams} from '../../Types/ParamTypes';
import {type ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import {type IntType, type BitDepth} from '../../Types/AudioTypes';
import {type DownwardCompressorState} from '../State/DownwardCompressorState';

import {isLittleEndian} from '../General/IsLittleEndian';
import {getMethodName} from '../General/GetMethodName';
import {convertThreshold} from '../General/ConvertThreshold';
import {type Stats} from '../Stats/Stats';

export function applyDownwardCompressor(
	audioData: ModifiedDataView,
	params: InputParams | ProcessorParams,
	downwardCompressorState: DownwardCompressorState,
	postDownwardCompressor: Stats,
): void {
	const bytesPerElement = params.bitDepth / 8;
	const isLe = isLittleEndian(params.endianness);

	const {upperThreshold, lowerThreshold, equilibrium} = convertThreshold(params.bitDepth, params.unsigned, params.downwardCompressorThreshold!);

	const getSampleMethod: `get${IntType}${BitDepth}` = `get${getMethodName(params.bitDepth, params.unsigned)}`;
	const setSampleMethod: `set${IntType}${BitDepth}` = `set${getMethodName(params.bitDepth, params.unsigned)}`;

	const ratio = params.downwardCompressorRatio ?? Number.MAX_SAFE_INTEGER;

	for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
		const sample = audioData[getSampleMethod](index, isLe);

		const threshold = sample >= equilibrium ? upperThreshold : lowerThreshold;

		if (sample > upperThreshold || sample < lowerThreshold) {
			if (params.downwardCompressorAttackSamples === undefined) {
				downwardCompressorState.ratio = ratio;
			} else {
				downwardCompressorState.ratio = Math.min(downwardCompressorState.ratio + (ratio / params.downwardCompressorAttackSamples), ratio);
			}
		} else if (params.downwardCompressorReleaseSamples === undefined) {
			downwardCompressorState.ratio = 1;
		} else {
			downwardCompressorState.ratio = Math.max(downwardCompressorState.ratio - (ratio / params.downwardCompressorReleaseSamples), 1);
		}

		const compressedSample = ((sample - threshold) / downwardCompressorState.ratio) + threshold;

		postDownwardCompressor.update(compressedSample);

		audioData[setSampleMethod](index, compressedSample, isLe);
	}
}
