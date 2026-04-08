"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripChannels = stripChannels;
const ModifiedDataView_1 = require("../../ModifiedDataView/ModifiedDataView");
const IsLittleEndian_1 = require("../General/IsLittleEndian");
const GetMethodName_1 = require("../General/GetMethodName");
function stripChannels(audioData, params) {
    const { activeChannels } = params;
    if (activeChannels === undefined || activeChannels >= params.channels) {
        return audioData;
    }
    const bytesPerElement = params.bitDepth / 8;
    const isLe = (0, IsLittleEndian_1.isLittleEndian)(params.endianness);
    const frameCount = audioData.byteLength / (params.channels * bytesPerElement);
    const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    const setSampleMethod = `set${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    const outputData = new Uint8Array(frameCount * activeChannels * bytesPerElement);
    const outputDataView = new ModifiedDataView_1.ModifiedDataView(outputData.buffer);
    for (let frame = 0; frame < frameCount; frame++) {
        const inBase = frame * params.channels * bytesPerElement;
        const outBase = frame * activeChannels * bytesPerElement;
        for (let ch = 0; ch < activeChannels; ch++) {
            const sample = audioData[getSampleMethod](inBase + (ch * bytesPerElement), isLe);
            outputDataView[setSampleMethod](outBase + (ch * bytesPerElement), sample, isLe);
        }
    }
    return outputDataView;
}
