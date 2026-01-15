"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyDownwardCompressor = applyDownwardCompressor;
const IsLittleEndian_1 = require("../General/IsLittleEndian");
const GetMethodName_1 = require("../General/GetMethodName");
const ConvertThreshold_1 = require("../General/ConvertThreshold");
function applyDownwardCompressor(audioData, params) {
    const bytesPerElement = params.bitDepth / 8;
    const isLe = (0, IsLittleEndian_1.isLittleEndian)(params.endianness);
    const { upperThreshold, lowerThreshold } = (0, ConvertThreshold_1.convertThreshold)(params.bitDepth, params.unsigned, params.downwardCompressorThreshold);
    const ratio = params.downwardCompressorRatio;
    const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    const setSampleMethod = `set${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
        const sample = audioData[getSampleMethod](index, isLe);
        let compressedSample;
        if (sample > upperThreshold) {
            if (ratio === undefined) {
                compressedSample = upperThreshold;
            }
            else {
                compressedSample = ((sample - upperThreshold) / ratio) + upperThreshold;
            }
        }
        else if (sample < lowerThreshold) {
            if (ratio === undefined) {
                compressedSample = lowerThreshold;
            }
            else {
                compressedSample = ((sample - lowerThreshold) / ratio) + lowerThreshold;
            }
        }
        else {
            compressedSample = sample;
        }
        audioData[setSampleMethod](index, compressedSample, isLe);
    }
}
