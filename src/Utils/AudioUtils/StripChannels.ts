import {type InputParams} from '../../Types/ParamTypes';
import {type IntType, type BitDepth} from '../../Types/AudioTypes';
import {ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import {isLittleEndian} from '../General/IsLittleEndian';
import {getMethodName} from '../General/GetMethodName';

export function stripChannels(audioData: ModifiedDataView, params: InputParams): ModifiedDataView {
	const {activeChannels} = params;
	const channelOffset = params.activeChannelsOffset ?? 0;

	if (activeChannels === undefined || (channelOffset === 0 && activeChannels >= params.channels)) {
		return audioData;
	}

	const bytesPerElement = params.bitDepth / 8;
	const isLe = isLittleEndian(params.endianness);
	const frameCount = audioData.byteLength / (params.channels * bytesPerElement);

	const getSampleMethod: `get${IntType}${BitDepth}` = `get${getMethodName(params.bitDepth, params.unsigned)}`;
	const setSampleMethod: `set${IntType}${BitDepth}` = `set${getMethodName(params.bitDepth, params.unsigned)}`;

	const outputData = new Uint8Array(frameCount * activeChannels * bytesPerElement);
	const outputDataView = new ModifiedDataView(outputData.buffer);

	for (let frame = 0; frame < frameCount; frame++) {
		const inBase = (frame * params.channels * bytesPerElement) + (channelOffset * bytesPerElement);
		const outBase = frame * activeChannels * bytesPerElement;

		for (let ch = 0; ch < activeChannels; ch++) {
			const sample = audioData[getSampleMethod](inBase + (ch * bytesPerElement), isLe);

			outputDataView[setSampleMethod](outBase + (ch * bytesPerElement), sample, isLe);
		}
	}

	return outputDataView;
}
