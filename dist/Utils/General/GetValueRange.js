"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValueRange = getValueRange;
function getValueRange(bitDepth, isUnsigned) {
    const maxValue = (2 ** (isUnsigned ? bitDepth : bitDepth - 1)) - 1;
    const minValue = isUnsigned ? 0 : -(maxValue + 1);
    return { min: minValue, max: maxValue };
}
