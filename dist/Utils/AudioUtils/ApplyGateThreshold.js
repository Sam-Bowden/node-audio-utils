"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyGateThreshold = applyGateThreshold;
const IsLittleEndian_1 = require("../General/IsLittleEndian");
const GetMethodName_1 = require("../General/GetMethodName");
function applyGateThreshold(audioData, params, gateState) {
    const bytesPerElement = params.bitDepth / 8;
    const isLe = (0, IsLittleEndian_1.isLittleEndian)(params.endianness);
    const halfRange = (2 ** params.bitDepth) / 2;
    const equilibrium = params.unsigned ? halfRange : 0;
    const threshold = halfRange * (params.gateThreshold);
    const upperBound = equilibrium + threshold - 1;
    const lowerBound = equilibrium - threshold;
    const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    const setSampleMethod = `set${(0, GetMethodName_1.getMethodName)(params.bitDepth, params.unsigned)}`;
    for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
        const sample = audioData[getSampleMethod](index, isLe);
        let gatedSample;
        if (sample <= lowerBound || sample >= upperBound) {
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
