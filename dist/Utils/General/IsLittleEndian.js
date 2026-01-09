"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLittleEndian = isLittleEndian;
const os_1 = require("os");
function isLittleEndian(type = (0, os_1.endianness)()) {
    return type === 'LE';
}
