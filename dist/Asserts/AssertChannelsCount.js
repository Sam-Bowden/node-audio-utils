"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertChannelsCount = assertChannelsCount;
function assertChannelsCount(channels) {
    if (channels <= 0) {
        throw new TypeError('The number of channels must be 1 or more');
    }
}
