"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBitDepth = exports.isSampleRate = void 0;
const isSampleRate = (v) => v === 4000
    || v === 8000
    || v === 11025
    || v === 16000
    || v === 22050
    || v === 24000
    || v === 32000
    || v === 44100
    || v === 48000
    || v === 88200
    || v === 96000
    || v === 176400
    || v === 192000;
exports.isSampleRate = isSampleRate;
const isBitDepth = (v) => v === 8 || v === 16 || v === 24 || v === 32;
exports.isBitDepth = isBitDepth;
