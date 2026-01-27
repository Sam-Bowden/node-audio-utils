"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeVolume = changeVolume;
const IsLittleEndian_1 = require("../General/IsLittleEndian");
const GetMethodName_1 = require("../General/GetMethodName");
const GetValueRange_1 = require("../General/GetValueRange");
function changeVolume(audioData, params, volume) {
    const bytesPerElement = params.bitDepth / 8;
    volume /= 100;
    const isLe = (0, IsLittleEndian_1.isLittleEndian)(params.endianness);
    const valueRange = (0, GetValueRange_1.getValueRange)(params.bitDepth, false);
    const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    const setSampleMethod = `set${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
        const sample = audioData[getSampleMethod](index, isLe);
        const volumedSample = params.unsigned
            ? ((sample - valueRange.max) * volume) + valueRange.max
            : sample * volume;
        audioData[setSampleMethod](index, volumedSample, isLe);
    }
}
