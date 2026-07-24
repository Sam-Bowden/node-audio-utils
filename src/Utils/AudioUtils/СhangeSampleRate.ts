import {type InputParams, type ProcessorParams} from '../../Types/ParamTypes';
import {type IntType, type BitDepth} from '../../Types/AudioTypes';
import {type SampleRateState} from '../State/SampleRateState';

import {ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import {isLittleEndian} from '../General/IsLittleEndian';
import {getReadMethodName, getWriteMethodName} from '../General/GetMethodName';

export function changeSampleRate(
	audioData: ModifiedDataView,
	inputParams: InputParams,
	processorParams: ProcessorParams,
	state: SampleRateState,
): ModifiedDataView {
	const bytesPerElement = inputParams.bitDepth / 8;
	const {channels} = inputParams;
	const bytesPerFrame = bytesPerElement * channels;

	const isLe = isLittleEndian(inputParams.endianness);

	const scaleFactor = inputParams.sampleRate / processorParams.sampleRate;

	const totalInputFrames = Math.floor(audioData.byteLength / bytesPerFrame);

	if (state.lastFrame !== undefined && state.lastFrame.length !== channels) {
		state.lastFrame = undefined;
		state.fraction = 0;
	}

	const {lastFrame} = state;

	const carryOffset = lastFrame === undefined ? 0 : 1;
	const lastFrameIndex = (totalInputFrames - 1) + carryOffset;

	const startPosition = state.fraction;
	const totalOutputFrames = Math.max(0, Math.ceil((lastFrameIndex - startPosition) / scaleFactor));

	const allocData = new Uint8Array(totalOutputFrames * bytesPerFrame);
	const allocDataView = new ModifiedDataView(allocData.buffer);

	const getSampleMethod: `get${IntType}${BitDepth}` = getReadMethodName(inputParams.bitDepth, inputParams.unsigned);
	const setSampleMethod: `set${IntType}${BitDepth}` = getWriteMethodName(processorParams.bitDepth, processorParams.unsigned);

	for (let index = 0; index < totalOutputFrames; index++) {
		const interpolatePosition = startPosition + (index * scaleFactor);

		const previousPosition = Math.floor(interpolatePosition);
		const nextPosition = Math.min(previousPosition + 1, lastFrameIndex);
		const weight = interpolatePosition - previousPosition;

		const previousByteOffset = (previousPosition - carryOffset) * bytesPerFrame;
		const nextByteOffset = (nextPosition - carryOffset) * bytesPerFrame;

		for (let channel = 0; channel < channels; channel++) {
			const channelByteOffset = channel * bytesPerElement;

			const previousSample = lastFrame !== undefined && previousPosition === 0
				? lastFrame[channel]
				: audioData[getSampleMethod](previousByteOffset + channelByteOffset, isLe);

			const nextSample = audioData[getSampleMethod](nextByteOffset + channelByteOffset, isLe);

			const interpolatedValue = (weight * (nextSample - previousSample)) + previousSample;

			allocDataView[setSampleMethod]((index * bytesPerFrame) + channelByteOffset, interpolatedValue, isLe);
		}
	}

	if (totalInputFrames > 0) {
		const finalFrame: number[] = [];

		for (let channel = 0; channel < channels; channel++) {
			finalFrame.push(audioData[getSampleMethod](((totalInputFrames - 1) * bytesPerFrame) + (channel * bytesPerElement), isLe));
		}

		state.lastFrame = finalFrame;
		state.fraction = Math.max(0, (startPosition + (totalOutputFrames * scaleFactor)) - lastFrameIndex);
	}

	inputParams.sampleRate = processorParams.sampleRate;

	return allocDataView;
}
