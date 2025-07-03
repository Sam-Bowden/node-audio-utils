"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioInput = void 0;
const stream_1 = require("stream");
const os_1 = require("os");
const InputUtils_1 = require("../Utils/InputUtils");
const GetZeroSample_1 = require("../Utils/General/GetZeroSample");
class AudioInput extends stream_1.Writable {
    constructor(inputParams, mixerParams, selfRemoveFunction) {
        super();
        this.audioData = new Uint8Array(0);
        this.correctionBuffer = new Uint8Array(0);
        this.inputParams = inputParams;
        this.inputParams.endianness ??= (0, os_1.endianness)();
        this.mixerParams = mixerParams;
        this.selfRemoveFunction = selfRemoveFunction;
        this.audioUtils = new InputUtils_1.InputUtils(inputParams, mixerParams);
    }
    get params() {
        return this.inputParams;
    }
    set params(params) {
        Object.assign(this.inputParams, params);
    }
    get dataSize() {
        return this.closed ? (this.mixerParams.highWaterMark ?? this.audioData.length) : this.audioData.length;
    }
    _write(chunk, _, callback) {
        if (!this.closed) {
            if (this.inputParams.preProcessData) {
                chunk = this.inputParams.preProcessData(chunk);
            }
            const bytesPerElement = this.inputParams.bitDepth / 8;
            if (chunk.length % bytesPerElement !== 0) {
                chunk = this.correctByteSize(chunk);
            }
            if (chunk.length > 0) {
                const processedData = this.processData(chunk);
                const newSize = this.audioData.length + processedData.length;
                const tempChunk = new Uint8Array(newSize);
                tempChunk.set(this.audioData, 0);
                tempChunk.set(processedData, this.audioData.length);
                this.audioData = tempChunk;
            }
        }
        callback();
    }
    _destroy(error, callback) {
        if (!this.closed) {
            if ((this.audioData.length === 0 && this.correctionBuffer.length === 0) || this.inputParams.forceClose) {
                this.removeInputSelf();
                return;
            }
            if (this.correctionBuffer.length > 0) {
                this.audioData = this.correctByteSize(this.correctionBuffer, true);
            }
        }
        callback(error);
    }
    getData(size) {
        const zeroSample = (0, GetZeroSample_1.getZeroSample)(this.inputParams.bitDepth, this.inputParams.unsigned);
        const tempChunk = new Uint8Array(size)
            .fill(zeroSample);
        if ((this.audioData.length < size && this.closed) || this.audioData.length >= size) {
            tempChunk.set(this.audioData.slice(0, size));
            this.audioData = this.audioData.slice(size);
        }
        if (this.audioData.length === 0 && this.closed) {
            this.removeInputSelf();
        }
        return tempChunk;
    }
    correctByteSize(chunk, isProcessed) {
        if (!this.params.correctByteSize) {
            return new Uint8Array(0);
        }
        if (this.correctionBuffer.length > 0) {
            const zeroSample = (0, GetZeroSample_1.getZeroSample)(this.inputParams.bitDepth, this.inputParams.unsigned);
            const newSize = chunk.length + this.correctionBuffer.length;
            const tempChunk = new Uint8Array(newSize)
                .fill(zeroSample);
            tempChunk.set(this.correctionBuffer, 0);
            tempChunk.set(chunk, this.correctionBuffer.length);
            chunk = tempChunk;
            this.correctionBuffer = new Uint8Array(0);
        }
        const bytesPerElement = (isProcessed ? this.mixerParams : this.inputParams).bitDepth / 8;
        const chunkSize = chunk.length + this.correctionBuffer.length;
        const remainder = chunkSize % bytesPerElement;
        const correctedSize = chunkSize - remainder;
        const correctedChunk = new Uint8Array(correctedSize);
        correctedChunk.set(this.correctionBuffer, 0);
        correctedChunk.set(chunk.slice(0, correctedSize), this.correctionBuffer.length);
        this.correctionBuffer = new Uint8Array(remainder);
        this.correctionBuffer.set(chunk.slice(correctedSize));
        return correctedChunk;
    }
    processData(chunk) {
        return this.audioUtils.setAudioData(chunk)
            .checkBitDepth()
            .checkSampleRate()
            .checkChannelsCount()
            .checkIntType()
            .checkEndianness()
            .checkVolume()
            .getAudioData();
    }
    removeInputSelf() {
        if (this.audioData.length > 0) {
            this.audioData = new Uint8Array(0);
        }
        if (typeof this.selfRemoveFunction === 'function') {
            this.selfRemoveFunction(this);
        }
    }
}
exports.AudioInput = AudioInput;
