"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelStats = exports.AudioStats = void 0;
const stream_1 = require("stream");
const GetValueRange_1 = require("../Utils/General/GetValueRange");
const ModifiedDataView_1 = require("../ModifiedDataView/ModifiedDataView");
const IsLittleEndian_1 = require("../Utils/General/IsLittleEndian");
const GetMethodName_1 = require("../Utils/General/GetMethodName");
class AudioStats extends stream_1.Writable {
    constructor(statsParams) {
        super();
        this.currentChannel = 0;
        this.statsParams = statsParams;
        this.channels = Array.from({ length: this.statsParams.channels }, () => new ChannelStats((0, GetValueRange_1.getValueRange)(this.statsParams.bitDepth).max));
    }
    reset() {
        this.channels.forEach(c => {
            c.reset();
        });
    }
    _write(chunk, _, callback) {
        const audioData = new ModifiedDataView_1.ModifiedDataView(chunk.buffer, chunk.byteOffset, chunk.length);
        const bytesPerElement = this.statsParams.bitDepth / 8;
        const isLe = (0, IsLittleEndian_1.isLittleEndian)(this.statsParams.endianness);
        const getSampleMethod = `get${(0, GetMethodName_1.getMethodName)(this.statsParams.bitDepth, this.statsParams.unsigned)}`;
        for (let index = 0; index < audioData.byteLength; index += bytesPerElement) {
            const sample = audioData[getSampleMethod](index, isLe);
            this.channels[this.currentChannel].update(sample);
            this.currentChannel += 1;
            this.currentChannel %= this.statsParams.channels;
        }
        callback();
    }
}
exports.AudioStats = AudioStats;
class ChannelStats {
    constructor(maxRange) {
        this.sumOfSquares = 0;
        this.count = 0;
        this.peakValue = 0;
        this.maxRange = maxRange;
    }
    update(sample) {
        this.sumOfSquares += sample ** 2;
        this.count += 1;
        this.peakValue = Math.max(this.peakValue, Math.abs(sample));
    }
    get rootMeanSquare() {
        if (this.count === 0) {
            return 0;
        }
        return Math.sqrt(this.sumOfSquares / this.count) / this.maxRange;
    }
    get peak() {
        return this.peakValue / this.maxRange;
    }
    reset() {
        this.sumOfSquares = 0;
        this.count = 0;
        this.peakValue = 0;
    }
}
exports.ChannelStats = ChannelStats;
