"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeSampleRate = changeSampleRate;
const ModifiedDataView_1 = require("../../ModifiedDataView/ModifiedDataView");
const IsLittleEndian_1 = require("../General/IsLittleEndian");
const GetMethodName_1 = require("../General/GetMethodName");
function changeSampleRate(audioData, inputParams, mixerParams) {
    const bytesPerElement = inputParams.bitDepth / 8;
    const isLe = (0, IsLittleEndian_1.isLittleEndian)(inputParams.endianness);
    const scaleFactor = inputParams.sampleRate / mixerParams.sampleRate;
    const totalInputSamples = Math.floor(audioData.byteLength / bytesPerElement);
    const totalOutputSamples = Math.ceil(totalInputSamples / scaleFactor);
    const dataSize = totalOutputSamples * bytesPerElement;
    const allocData = new Uint8Array(dataSize);
    const allocDataView = new ModifiedDataView_1.ModifiedDataView(allocData.buffer);
    const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(inputParams.bitDepth, inputParams.unsigned)}`;
    const setSampleMethod = `set${(0, GetMethodName_1.getMethodName)(mixerParams.bitDepth, mixerParams.unsigned)}`;
    for (let index = 0; index < totalOutputSamples; index++) {
        const interpolatePosition = index * scaleFactor;
        const previousPosition = Math.floor(interpolatePosition);
        const nextPosition = previousPosition + 1;
        const previousSample = audioData[getSampleMethod](previousPosition * bytesPerElement, isLe);
        const nextSample = nextPosition < totalInputSamples
            ? audioData[getSampleMethod](nextPosition * bytesPerElement, isLe)
            : previousSample;
        const interpolatedValue = ((interpolatePosition - previousPosition) * (nextSample - previousSample)) + previousSample;
        allocDataView[setSampleMethod](index * bytesPerElement, interpolatedValue, isLe);
    }
    inputParams.sampleRate = mixerParams.sampleRate;
    return allocDataView;
}
