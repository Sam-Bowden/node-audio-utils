"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interleaveAudioData = interleaveAudioData;
const ModifiedDataView_1 = require("../../ModifiedDataView/ModifiedDataView");
const IsLittleEndian_1 = require("./IsLittleEndian");
const GetMethodName_1 = require("./GetMethodName");
function interleaveAudioData(audioData, params) {
    const bytesPerElement = params.bitDepth / 8;
    const isLe = (0, IsLittleEndian_1.isLittleEndian)(params.endianness);
    const newData = new Uint8Array(audioData[0].byteLength * audioData.length);
    const interleavedData = new ModifiedDataView_1.ModifiedDataView(newData.buffer);
    const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    const setSampleMethod = `set${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    for (let index = 0; index < audioData[0].byteLength; index += bytesPerElement * params.channels) {
        for (let channel = 0; channel < params.channels; channel++) {
            for (let audioDataIndex = 0; audioDataIndex < audioData.length; audioDataIndex++) {
                const sampleValue = audioData[audioDataIndex][getSampleMethod](index + (bytesPerElement * channel), isLe);
                interleavedData[setSampleMethod]((index * audioData.length) + (bytesPerElement * (channel + (audioDataIndex * params.channels))), sampleValue, isLe);
            }
        }
    }
    return interleavedData;
}
