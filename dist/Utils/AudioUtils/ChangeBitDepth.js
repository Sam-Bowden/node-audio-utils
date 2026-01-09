"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeBitDepth = changeBitDepth;
const ModifiedDataView_1 = require("../../ModifiedDataView/ModifiedDataView");
const IsLittleEndian_1 = require("../General/IsLittleEndian");
const GetMethodName_1 = require("../General/GetMethodName");
function changeBitDepth(audioData, inputParams, mixerParams) {
    const oldBytesPerElement = inputParams.bitDepth / 8;
    const newBytesPerElement = mixerParams.bitDepth / 8;
    const scalingFactor = 2 ** (mixerParams.bitDepth - inputParams.bitDepth);
    const maxValue = 2 ** (mixerParams.bitDepth - 1);
    const isLe = (0, IsLittleEndian_1.isLittleEndian)(inputParams.endianness);
    const dataSize = audioData.byteLength * (mixerParams.bitDepth / inputParams.bitDepth);
    const allocData = new Uint8Array(dataSize);
    const allocDataView = new ModifiedDataView_1.ModifiedDataView(allocData.buffer);
    const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(inputParams.bitDepth, inputParams.unsigned)}`;
    const setSampleMethod = `set${(0, GetMethodName_1.getMethodName)(mixerParams.bitDepth, mixerParams.unsigned)}`;
    for (let index = 0; index < audioData.byteLength; index += oldBytesPerElement) {
        const audioSample = audioData[getSampleMethod](index, isLe);
        let scaledSample = Math.floor(audioSample * scalingFactor);
        if (inputParams.unsigned) {
            scaledSample -= maxValue;
        }
        const newSamplePosition = Math.floor(index * (newBytesPerElement / oldBytesPerElement));
        allocDataView[setSampleMethod](newSamplePosition, scaledSample, isLe);
    }
    inputParams.bitDepth = mixerParams.bitDepth;
    return allocDataView;
}
