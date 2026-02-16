"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifiedDataView = void 0;
/* eslint-disable no-bitwise */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
class ModifiedDataView extends DataView {
    getInt24(byteOffset, littleEndian) {
        const byte = this.getByte(byteOffset, littleEndian);
        return (byte << 8) >> 8;
    }
    getUint24(byteOffset, littleEndian) {
        return this.getByte(byteOffset, littleEndian);
    }
    setInt24(byteOffset, value, littleEndian) {
        this.setByte(byteOffset, value, littleEndian);
    }
    setUint24(byteOffset, value, littleEndian) {
        this.setByte(byteOffset, value, littleEndian, true);
    }
    getByte(byteOffset, littleEndian) {
        const bytes = [
            this.getUint8(byteOffset),
            this.getUint8(byteOffset + 1),
            this.getUint8(byteOffset + 2),
        ];
        if (littleEndian) {
            bytes.reverse();
        }
        return (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
    }
    setByte(byteOffset, value, littleEndian, isUnsigned) {
        const bytes = [
            (value >> 16),
            (value >> 8),
            value,
        ];
        if (littleEndian) {
            bytes.reverse();
        }
        const methodName = isUnsigned ? 'setUint8' : 'setInt8';
        this[methodName](byteOffset, bytes[0]);
        this[methodName](byteOffset + 1, bytes[1]);
        this[methodName](byteOffset + 2, bytes[2]);
    }
}
exports.ModifiedDataView = ModifiedDataView;
