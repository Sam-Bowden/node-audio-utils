"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeEndianness = changeEndianness;
const IsLittleEndian_1 = require("../General/IsLittleEndian");
const GetMethodName_1 = require("../General/GetMethodName");
function changeEndianness(audioData, inputParams, mixerParams) {
    const bytesPerElement = inputParams.bitDepth / 8;
    const isInputLe = (0, IsLittleEndian_1.isLittleEndian)(inputParams.endianness);
    const isMixerLe = (0, IsLittleEndian_1.isLittleEndian)(mixerParams.endianness);
    const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(inputParams.bitDepth, inputParams.unsigned)}`;
    const setSampleMethod = `set${(0, GetMethodName_1.getMethodName)(inputParams.bitDepth, inputParams.unsigned)}`;
    for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
        const sample = audioData[getSampleMethod](index, isInputLe);
        audioData[setSampleMethod](index, sample, isMixerLe);
    }
    inputParams.endianness = mixerParams.endianness;
}
