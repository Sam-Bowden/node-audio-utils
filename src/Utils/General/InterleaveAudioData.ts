import {type IntType, type BitDepth} from '../../Types/AudioTypes';
import {type ProcessorParams} from '../../Types/ParamTypes';

import {ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import {isLittleEndian} from './IsLittleEndian';
import {getMethodName} from './GetMethodName';

export function interleaveAudioData(audioData: ModifiedDataView[], params: ProcessorParams): ModifiedDataView {
	const bytesPerElement = params.bitDepth / 8;

	const bytesPerChannel = params.highWaterMark ?? bytesPerElement;

	const isLe = isLittleEndian(params.endianness);

	const getSampleMethod: `get${IntType}${BitDepth}` = `get${getMethodName(params.bitDepth, params.unsigned)}`;
	const setSampleMethod: `set${IntType}${BitDepth}` = `set${getMethodName(params.bitDepth, params.unsigned)}`;

	const channelCounts = audioData.map(data => data.byteLength / bytesPerChannel);
	const totalChannels = channelCounts.reduce((sum, n) => sum + n, 0);
	const samplesPerChannel = bytesPerChannel / bytesPerElement;

	const newData = new Uint8Array(samplesPerChannel * totalChannels * bytesPerElement);
	const interleavedData = new ModifiedDataView(newData.buffer);

	for (let sample = 0; sample < samplesPerChannel; sample++) {
		let outputChannelOffset = 0;

		for (let inputIndex = 0; inputIndex < audioData.length; inputIndex++) {
			const channels = channelCounts[inputIndex];

			for (let channel = 0; channel < channels; channel++) {
				const inputOffset = ((sample * channels) + channel) * bytesPerElement;
				const outputOffset = ((sample * totalChannels) + outputChannelOffset + channel) * bytesPerElement;
				const sampleValue = audioData[inputIndex][getSampleMethod](inputOffset, isLe);
				interleavedData[setSampleMethod](outputOffset, sampleValue, isLe);
			}

			outputChannelOffset += channels;
		}
	}

	return interleavedData;
}
