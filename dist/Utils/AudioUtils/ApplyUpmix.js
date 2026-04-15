"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyUpmix = applyUpmix;
const ModifiedDataView_1 = require("../../ModifiedDataView/ModifiedDataView");
function applyUpmix(audioData, params, upmixState) {
    const bytesPerSample = params.bitDepth / 8;
    const inputSamples = audioData.byteLength / (bytesPerSample * params.channels);
    const expectedOutputBytes = inputSamples * upmixState.outputChannels * bytesPerSample;
    const input = Buffer.from(audioData.buffer, audioData.byteOffset, audioData.byteLength);
    const output = upmixState.upmix.process(input);
    if (output.length > 0) {
        const combined = new Uint8Array(upmixState.outputBuffer.length + output.length);
        combined.set(upmixState.outputBuffer);
        combined.set(new Uint8Array(output.buffer, output.byteOffset, output.byteLength), upmixState.outputBuffer.length);
        upmixState.outputBuffer = combined;
    }
    if (upmixState.outputBuffer.length >= expectedOutputBytes) {
        const released = upmixState.outputBuffer.slice(0, expectedOutputBytes);
        upmixState.outputBuffer = upmixState.outputBuffer.slice(expectedOutputBytes);
        return {
            data: new ModifiedDataView_1.ModifiedDataView(released.buffer, released.byteOffset, released.byteLength),
            channels: upmixState.outputChannels,
        };
    }
    return undefined; // Not enough output accumulated — caller falls through to zero-pad
}
