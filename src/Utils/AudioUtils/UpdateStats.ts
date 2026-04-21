import {type InputParams, type ProcessorParams} from '../../Types/ParamTypes';
import {type ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import {type IntType, type BitDepth} from '../../Types/AudioTypes';

import {isLittleEndian} from '../General/IsLittleEndian';
import {getMethodName} from '../General/GetMethodName';
import {type Stats} from '../Stats/Stats';

export function updateStats(audioData: ModifiedDataView, params: InputParams | ProcessorParams, stats: Stats): void {
	const bytesPerElement = params.bitDepth / 8;

	const isLe = isLittleEndian(params.endianness);

	const getSampleMethod: `get${IntType}${BitDepth}` = `get${getMethodName(params.bitDepth, params.unsigned)}`;

	for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
		const sample = audioData[getSampleMethod](index, isLe);

		stats.update(sample);
	}
}
