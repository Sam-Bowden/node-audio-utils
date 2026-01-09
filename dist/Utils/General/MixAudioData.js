"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mixAudioData = mixAudioData;
const ModifiedDataView_1 = require("../../ModifiedDataView/ModifiedDataView");
const IsLittleEndian_1 = require("./IsLittleEndian");
const GetValueRange_1 = require("./GetValueRange");
const GetMethodName_1 = require("./GetMethodName");
const GetZeroSample_1 = require("./GetZeroSample");
function mixAudioData(audioData, params) {
    const bytesPerElement = params.bitDepth / 8;
    const valueRange = (0, GetValueRange_1.getValueRange)(params.bitDepth, params.unsigned);
    const zeroSample = (0, GetZeroSample_1.getZeroSample)(params.bitDepth, params.unsigned);
    const isLe = (0, IsLittleEndian_1.isLittleEndian)(params.endianness);
    const newData = new Uint8Array(audioData[0].byteLength);
    const mixedData = new ModifiedDataView_1.ModifiedDataView(newData.buffer);
    const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    const setSampleMethod = `set${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    for (let index = 0; index < newData.length; index += bytesPerElement) {
        const samples = audioData.map(data => data[getSampleMethod](index, isLe));
        const mixSample = samples.reduce((sample, nextSample) => sample + nextSample, zeroSample);
        const clipSample = Math.min(Math.max(mixSample, valueRange.min), valueRange.max);
        mixedData[setSampleMethod](index, clipSample, isLe);
    }
    return mixedData;
}
