"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMethodName = getMethodName;
function getMethodName(bitDepth, isUnsigned) {
    return `${isUnsigned ? 'Uint' : 'Int'}${bitDepth}`;
}
