"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertHighWaterMark = assertHighWaterMark;
function assertHighWaterMark(bitDepth, highWaterMark) {
    const bytesPerElement = bitDepth / 8;
    if (typeof highWaterMark === 'number') {
        if (highWaterMark % bytesPerElement !== 0) {
            throw new TypeError('highWaterMark must be a multiple of the byte size derived from bitDepth');
        }
    }
}
