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
const ApplyDownmix_1 = require("./AudioUtils/ApplyDownmix");
const StripChannels_1 = require("./AudioUtils/StripChannels");
const ProcessingStats_1 = require("./Stats/ProcessingStats");
const UpdateStats_1 = require("./AudioUtils/UpdateStats");
class InputUtils {
    constructor(inputParams, mixerParams) {
        this.emptyData = new Uint8Array(0);
        this.upmixOutputBuffer = new Uint8Array(0);
        this.audioInputParams = inputParams;
        this.audioMixerParams = mixerParams;
        this.changedParams = { ...this.audioInputParams };
        this.audioData = new ModifiedDataView_1.ModifiedDataView(this.emptyData.buffer);
        this.gateState = { holdSamplesRemaining: inputParams.gateHoldSamples, attenuation: 1 };
        this.downwardCompressorState = { ratio: 1 };
        this.processingStats = new ProcessingStats_1.ProcessingStats(mixerParams.bitDepth, mixerParams.channels);
        if (inputParams.upmixOptions !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const upmixModule = require('node-libavfilter-upmix');
            this.upmix = new upmixModule.Upmix({
                sampleRate: inputParams.sampleRate,
                bitDepth: inputParams.bitDepth,
                inputChannels: inputParams.channels,
                inputLayout: channelCountToLayout(inputParams.channels),
                outputLayout: inputParams.upmixOptions.outputLayout,
                winSize: inputParams.upmixOptions.winSize,
            });
            this.upmixOutputChannels = layoutToChannelCount(inputParams.upmixOptions.outputLayout);
        }
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
    applyDownmix() {
        if (this.changedParams.downmixMatrix !== undefined) {
            this.audioData = (0, ApplyDownmix_1.applyDownmix)(this.audioData, this.changedParams);
            this.changedParams.channels = this.changedParams.downmixMatrix.length;
        }
        return this;
    }
    applyUpmix() {
        if (this.upmix === undefined) {
            return this;
        }
        const bytesPerSample = this.changedParams.bitDepth / 8;
        const inputSamples = this.audioData.byteLength / (bytesPerSample * this.changedParams.channels);
        const expectedOutputBytes = inputSamples * this.upmixOutputChannels * bytesPerSample;
        const input = Buffer.from(this.audioData.buffer, this.audioData.byteOffset, this.audioData.byteLength);
        const output = this.upmix.process(input);
        if (output.length > 0) {
            const combined = new Uint8Array(this.upmixOutputBuffer.length + output.length);
            combined.set(this.upmixOutputBuffer);
            combined.set(new Uint8Array(output.buffer, output.byteOffset, output.byteLength), this.upmixOutputBuffer.length);
            this.upmixOutputBuffer = combined;
        }
        if (this.upmixOutputBuffer.length >= expectedOutputBytes) {
            const released = this.upmixOutputBuffer.slice(0, expectedOutputBytes);
            this.upmixOutputBuffer = this.upmixOutputBuffer.slice(expectedOutputBytes);
            this.audioData = new ModifiedDataView_1.ModifiedDataView(released.buffer, released.byteOffset, released.byteLength);
            this.changedParams.channels = this.upmixOutputChannels;
        }
        // If not enough output accumulated, fall through — checkChannelsCount() zero-pads as fallback
        return this;
    }
    destroy() {
        this.upmix?.close();
    }
    resetUpmix() {
        this.upmix?.reset();
        this.upmixOutputBuffer = new Uint8Array(0);
    }
    checkActiveChannelsCount() {
        const { activeChannels } = this.changedParams;
        if (activeChannels !== undefined && activeChannels < this.changedParams.channels) {
            this.audioData = (0, StripChannels_1.stripChannels)(this.audioData, this.changedParams);
            this.changedParams.channels = activeChannels;
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
    updatePreProcessStats() {
        (0, UpdateStats_1.updateStats)(this.audioData, this.changedParams, this.processingStats.preProcess);
        return this;
    }
    applyGate() {
        if (this.changedParams.gateThreshold !== undefined) {
            (0, ApplyGate_1.applyGate)(this.audioData, this.changedParams, this.gateState, this.processingStats.postGate);
        }
        return this;
    }
    applyDownwardCompressor() {
        if (this.changedParams.downwardCompressorThreshold !== undefined) {
            (0, ApplyDownwardCompressor_1.applyDownwardCompressor)(this.audioData, this.changedParams, this.downwardCompressorState, this.processingStats.postDownwardCompressor);
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
function channelCountToLayout(channels) {
    switch (channels) {
        case 2: return 'stereo';
        case 6: return '5.1';
        case 8: return '7.1';
        default: throw new Error(`Unsupported input channel count for upmix: ${channels}`);
    }
}
function layoutToChannelCount(layout) {
    switch (layout) {
        case 'stereo': return 2;
        case '5.1': return 6;
        case '7.1': return 8;
        default: throw new Error(`Unknown channel layout: '${layout}'`);
    }
}
