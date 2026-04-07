"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyDownmix = applyDownmix;
const ModifiedDataView_1 = require("../../ModifiedDataView/ModifiedDataView");
const IsLittleEndian_1 = require("../General/IsLittleEndian");
const GetMethodName_1 = require("../General/GetMethodName");
const GetValueRange_1 = require("../General/GetValueRange");
function applyDownmix(audioData, params) {
    const matrix = params.downmixMatrix;
    if (matrix === undefined) {
        return audioData;
    }
    const bytesPerElement = params.bitDepth / 8;
    const isLe = (0, IsLittleEndian_1.isLittleEndian)(params.endianness);
    const valueRange = (0, GetValueRange_1.getValueRange)(params.bitDepth, params.unsigned);
    const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    const setSampleMethod = `set${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    const inputChannels = matrix[0].length;
    const outputChannels = matrix.length;
    const frameCount = audioData.byteLength / (inputChannels * bytesPerElement);
    const outputData = new Uint8Array(frameCount * outputChannels * bytesPerElement);
    const outputDataView = new ModifiedDataView_1.ModifiedDataView(outputData.buffer);
    for (let frame = 0; frame < frameCount; frame++) {
        const inputOffset = frame * inputChannels * bytesPerElement;
        for (let outCh = 0; outCh < outputChannels; outCh++) {
            let outSample = 0;
            for (let inCh = 0; inCh < inputChannels; inCh++) {
                outSample += (matrix[outCh][inCh] ?? 0) * audioData[getSampleMethod]((inputOffset + (inCh * bytesPerElement)), isLe);
            }
            outputDataView[setSampleMethod](((frame * outputChannels) + outCh) * bytesPerElement, Math.min(Math.max(Math.round(outSample), valueRange.min), valueRange.max), isLe);
        }
    }
    return outputDataView;
}
