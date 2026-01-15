"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyGate = applyGate;
const IsLittleEndian_1 = require("../General/IsLittleEndian");
const GetMethodName_1 = require("../General/GetMethodName");
const ConvertThreshold_1 = require("../General/ConvertThreshold");
function applyGate(audioData, params, gateState) {
    const bytesPerElement = params.bitDepth / 8;
    const isLe = (0, IsLittleEndian_1.isLittleEndian)(params.endianness);
    const { upperThreshold, lowerThreshold, equilibrium } = (0, ConvertThreshold_1.convertThreshold)(params.bitDepth, params.unsigned, params.gateThreshold);
    const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    const setSampleMethod = `set${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
        const sample = audioData[getSampleMethod](index, isLe);
        let gatedSample;
        if (sample <= lowerThreshold || sample >= upperThreshold) {
            gateState.holdSamplesRemaining = params.gateHoldSamples;
            gatedSample = sample;
        }
        else if (gateState.holdSamplesRemaining !== undefined && gateState.holdSamplesRemaining > 0) {
            gateState.holdSamplesRemaining -= 1;
            gatedSample = sample;
        }
        else {
            gatedSample = equilibrium;
        }
        audioData[setSampleMethod](index, gatedSample, isLe);
    }
}
