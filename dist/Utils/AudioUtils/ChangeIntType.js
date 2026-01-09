"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeIntType = changeIntType;
const GetMethodName_1 = require("../General/GetMethodName");
const IsLittleEndian_1 = require("../General/IsLittleEndian");
const GetValueRange_1 = require("../General/GetValueRange");
function changeIntType(audioData, params, unsigned) {
    const bytesPerElement = params.bitDepth / 8;
    const isLe = (0, IsLittleEndian_1.isLittleEndian)(params.endianness);
    const valueRange = (0, GetValueRange_1.getValueRange)(params.bitDepth, params.unsigned);
    const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    const setSampleMethod = `set${(0, GetMethodName_1.getMethodName)(params.bitDepth, unsigned)}`;
    for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
        let sample = audioData[getSampleMethod](index, isLe);
        if (unsigned) {
            sample += valueRange.max;
        }
        else {
            sample -= valueRange.max;
        }
        audioData[setSampleMethod](index, sample, isLe);
    }
    params.unsigned = unsigned;
}
