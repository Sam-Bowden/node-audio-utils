"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertThreshold = convertThreshold;
function convertThreshold(bitDepth, isUnsigned, thresholdPercentage) {
    const halfRange = (2 ** bitDepth) / 2;
    const threshold = halfRange * thresholdPercentage;
    const equilibrium = isUnsigned ? halfRange : 0;
    return {
        upperThreshold: equilibrium + threshold - 1,
        lowerThreshold: equilibrium - threshold,
        equilibrium,
    };
}
