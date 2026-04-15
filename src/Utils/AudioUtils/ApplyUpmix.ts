import {type InputParams} from '../../Types/ParamTypes';
import {ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import type {UpmixState} from '../State/UpmixState';
import {changeBitDepth} from './ChangeBitDepth';

export function applyUpmix(
	audioData: ModifiedDataView,
	params: InputParams,
	upmixState: UpmixState,
): ModifiedDataView | undefined {
	const upmixBitDepth = upmixState.bitDepth;
	const originalBitDepth = params.bitDepth;
	const needsConversion = originalBitDepth !== upmixBitDepth;

	let upmixInput = audioData;
	if (needsConversion) {
		upmixInput = changeBitDepth(
			audioData,
			{...params},
			{
				sampleRate: params.sampleRate,
				channels: params.channels,
				bitDepth: upmixBitDepth,
				unsigned: false,
				endianness: params.endianness,
			},
		);
	}

	const bytesPerSample = upmixBitDepth / 8;
	const inputSamples = upmixInput.byteLength / (bytesPerSample * params.channels);
	const expectedOutputBytes = inputSamples * upmixState.outputChannels * bytesPerSample;

	const input = Buffer.from(upmixInput.buffer, upmixInput.byteOffset, upmixInput.byteLength);
	const output = upmixState.upmix.process(input);

	if (output.length > 0) {
		const combined = new Uint8Array(upmixState.outputBuffer.length + output.length);
		combined.set(upmixState.outputBuffer);
		combined.set(
			new Uint8Array(output.buffer, output.byteOffset, output.byteLength),
			upmixState.outputBuffer.length,
		);
		upmixState.outputBuffer = combined;
	}

	if (upmixState.outputBuffer.length >= expectedOutputBytes) {
		const released = upmixState.outputBuffer.slice(0, expectedOutputBytes);
		upmixState.outputBuffer = upmixState.outputBuffer.slice(expectedOutputBytes);

		let resultData = new ModifiedDataView(released.buffer, released.byteOffset, released.byteLength);

		if (needsConversion) {
			resultData = changeBitDepth(
				resultData,
				{
					sampleRate: params.sampleRate,
					channels: upmixState.outputChannels,
					bitDepth: upmixBitDepth,
					unsigned: false,
					endianness: params.endianness,
				},
				{
					sampleRate: params.sampleRate,
					channels: upmixState.outputChannels,
					bitDepth: originalBitDepth,
					unsigned: params.unsigned,
					endianness: params.endianness,
				},
			);
		}

		params.channels = upmixState.outputChannels;
		return resultData;
	}

	return undefined;
}
