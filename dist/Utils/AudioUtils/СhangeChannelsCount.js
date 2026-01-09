"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeChannelsCount = changeChannelsCount;
const ModifiedDataView_1 = require("../../ModifiedDataView/ModifiedDataView");
const IsLittleEndian_1 = require("../General/IsLittleEndian");
const GetMethodName_1 = require("../General/GetMethodName");
function changeChannelsCount(audioData, inputParams, mixerParams) {
    const bytesPerElement = mixerParams.bitDepth / 8;
    const isLe = (0, IsLittleEndian_1.isLittleEndian)(inputParams.endianness);
    const dataSize = Math.round(audioData.byteLength * mixerParams.channels / inputParams.channels);
    const allocData = new Uint8Array(dataSize);
    const allocDataView = new ModifiedDataView_1.ModifiedDataView(allocData.buffer);
    const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(inputParams.bitDepth, inputParams.unsigned)}`;
    const setSampleMethod = `set${(0, GetMethodName_1.getMethodName)(mixerParams.bitDepth, mixerParams.unsigned)}`;
    for (let oldPosition = 0, newPosition = 0; oldPosition < audioData.byteLength; oldPosition += bytesPerElement) {
        const sample = audioData[getSampleMethod](oldPosition, isLe);
        const nextPosition = newPosition + (bytesPerElement * mixerParams.channels);
        for (newPosition; newPosition < nextPosition; newPosition += bytesPerElement) {
            allocDataView[setSampleMethod](newPosition, sample, isLe);
        }
    }
    inputParams.channels = mixerParams.channels;
    return allocDataView;
}
