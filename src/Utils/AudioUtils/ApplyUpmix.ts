import {type InputParams} from '../../Types/ParamTypes';
import {ModifiedDataView} from '../../ModifiedDataView/ModifiedDataView';
import type {UpmixState} from '../State/UpmixState';

export function applyUpmix(
	audioData: ModifiedDataView,
	params: InputParams,
	upmixState: UpmixState,
): {data: ModifiedDataView; channels: number} | undefined {
	const bytesPerSample = params.bitDepth / 8;
	const inputSamples = audioData.byteLength / (bytesPerSample * params.channels);
	const expectedOutputBytes = inputSamples * upmixState.outputChannels * bytesPerSample;

	const input = Buffer.from(audioData.buffer, audioData.byteOffset, audioData.byteLength);
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
		return {
			data: new ModifiedDataView(released.buffer, released.byteOffset, released.byteLength),
			channels: upmixState.outputChannels,
		};
	}

	return undefined; // Not enough output accumulated — caller falls through to zero-pad
}
