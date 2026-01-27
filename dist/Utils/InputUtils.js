"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputUtils = void 0;
const ModifiedDataView_1 = require("../ModifiedDataView/ModifiedDataView");
const AssertChannelsCount_1 = require("../Asserts/AssertChannelsCount");
const _hangeVolume_1 = require("./AudioUtils/\u0421hangeVolume");
const ChangeIntType_1 = require("./AudioUtils/ChangeIntType");
const ChangeBitDepth_1 = require("./AudioUtils/ChangeBitDepth");
const _hangeSampleRate_1 = require("./AudioUtils/\u0421hangeSampleRate");
const _hangeChannelsCount_1 = require("./AudioUtils/\u0421hangeChannelsCount");
const ChangeEndianness_1 = require("./AudioUtils/ChangeEndianness");
const ApplyGate_1 = require("./AudioUtils/ApplyGate");
const ApplyDownwardCompressor_1 = require("./AudioUtils/ApplyDownwardCompressor");
class InputUtils {
    constructor(inputParams, mixerParams) {
        this.emptyData = new Uint8Array(0);
        this.audioInputParams = inputParams;
        this.audioMixerParams = mixerParams;
        this.changedParams = { ...this.audioInputParams };
        this.audioData = new ModifiedDataView_1.ModifiedDataView(this.emptyData.buffer);
        this.gateState = { holdSamplesRemaining: inputParams.gateHoldSamples, attenuation: 1 };
        this.downwardCompressorState = { ratio: 1 };
    }
    setAudioData(audioData) {
        this.audioData = new ModifiedDataView_1.ModifiedDataView(audioData.buffer, audioData.byteOffset, audioData.length);
        this.changedParams = { ...this.audioInputParams };
        return this;
    }
    checkIntType() {
        if (Boolean(this.changedParams.unsigned) !== Boolean(this.audioMixerParams.unsigned)) {
            (0, ChangeIntType_1.changeIntType)(this.audioData, this.changedParams, this.audioMixerParams.unsigned);
        }
        return this;
    }
    checkBitDepth() {
        if (this.changedParams.bitDepth !== this.audioMixerParams.bitDepth) {
            this.audioData = (0, ChangeBitDepth_1.changeBitDepth)(this.audioData, this.changedParams, this.audioMixerParams);
        }
        return this;
    }
    checkSampleRate() {
        if (this.changedParams.sampleRate !== this.audioMixerParams.sampleRate) {
            this.audioData = (0, _hangeSampleRate_1.changeSampleRate)(this.audioData, this.changedParams, this.audioMixerParams);
        }
        return this;
    }
    checkChannelsCount() {
        if (this.changedParams.channels !== this.audioMixerParams.channels) {
            (0, AssertChannelsCount_1.assertChannelsCount)(this.changedParams.channels);
            this.audioData = (0, _hangeChannelsCount_1.changeChannelsCount)(this.audioData, this.changedParams, this.audioMixerParams);
        }
        return this;
    }
    checkPreProcessVolume() {
        const preProcessVolume = this.changedParams.preProcessVolume ?? 100;
        if (preProcessVolume !== 100) {
            (0, _hangeVolume_1.changeVolume)(this.audioData, this.changedParams, preProcessVolume);
        }
        return this;
    }
    checkPostProcessVolume() {
        const postProcessVolume = this.changedParams.postProcessVolume ?? 100;
        if (postProcessVolume !== 100) {
            (0, _hangeVolume_1.changeVolume)(this.audioData, this.changedParams, postProcessVolume);
        }
        return this;
    }
    applyGate() {
        if (this.changedParams.gateThreshold !== undefined) {
            (0, ApplyGate_1.applyGate)(this.audioData, this.changedParams, this.gateState);
        }
        return this;
    }
    applyDownwardCompressor() {
        if (this.changedParams.downwardCompressorThreshold !== undefined) {
            (0, ApplyDownwardCompressor_1.applyDownwardCompressor)(this.audioData, this.changedParams, this.downwardCompressorState);
        }
        return this;
    }
    checkEndianness() {
        if (this.changedParams.endianness !== this.audioMixerParams.endianness) {
            (0, ChangeEndianness_1.changeEndianness)(this.audioData, this.changedParams, this.audioMixerParams);
        }
        return this;
    }
    getAudioData() {
        return new Uint8Array(this.audioData.buffer, this.audioData.byteOffset, this.audioData.byteLength);
    }
}
exports.InputUtils = InputUtils;
