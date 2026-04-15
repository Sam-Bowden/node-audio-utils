"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyUpmix = applyUpmix;
const ModifiedDataView_1 = require("../../ModifiedDataView/ModifiedDataView");
const ChangeBitDepth_1 = require("./ChangeBitDepth");
function applyUpmix(audioData, params, upmixState) {
    const upmixBitDepth = upmixState.bitDepth;
    const originalBitDepth = params.bitDepth;
    const needsConversion = originalBitDepth !== upmixBitDepth;
    let upmixInput = audioData;
    if (needsConversion) {
        upmixInput = (0, ChangeBitDepth_1.changeBitDepth)(audioData, { ...params }, {
            sampleRate: params.sampleRate,
            channels: params.channels,
            bitDepth: upmixBitDepth,
            unsigned: false,
            endianness: params.endianness,
        });
    }
    const bytesPerSample = upmixBitDepth / 8;
    const inputSamples = upmixInput.byteLength / (bytesPerSample * params.channels);
    const expectedOutputBytes = inputSamples * upmixState.outputChannels * bytesPerSample;
    const input = Buffer.from(upmixInput.buffer, upmixInput.byteOffset, upmixInput.byteLength);
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
        let resultData = new ModifiedDataView_1.ModifiedDataView(released.buffer, released.byteOffset, released.byteLength);
        if (needsConversion) {
            resultData = (0, ChangeBitDepth_1.changeBitDepth)(resultData, {
                sampleRate: params.sampleRate,
                channels: upmixState.outputChannels,
                bitDepth: upmixBitDepth,
                unsigned: false,
                endianness: params.endianness,
            }, {
                sampleRate: params.sampleRate,
                channels: upmixState.outputChannels,
                bitDepth: originalBitDepth,
                unsigned: params.unsigned,
                endianness: params.endianness,
            });
        }
        params.channels = upmixState.outputChannels;
        return resultData;
    }
    return undefined;
}
