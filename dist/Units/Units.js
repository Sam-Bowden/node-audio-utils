"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decibelsToGain = exports.gainToDecibels = void 0;
const gainToDecibels = (gain) => Math.log10(gain) * 20;
exports.gainToDecibels = gainToDecibels;
const decibelsToGain = (db) => 10 ** (db * 0.05);
exports.decibelsToGain = decibelsToGain;
