"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getZeroSample = getZeroSample;
function getZeroSample(bitDepth, unsigned) {
    const maxSigned = 2 ** (bitDepth - 1);
    return unsigned ? -maxSigned : 0;
}
