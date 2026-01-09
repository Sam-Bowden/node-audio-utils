"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioInterleaver = void 0;
const stream_1 = require("stream");
const AssertHighWaterMark_1 = require("../Asserts/AssertHighWaterMark");
const AudioInput_1 = require("../AudioInput/AudioInput");
const InterleaverUtils_1 = require("../Utils/InterleaverUtils");
class AudioInterleaver extends stream_1.Readable {
    constructor(params) {
        super();
        this.isWork = false;
        this.inputs = [];
        this.interleaverParams = params;
        this.audioUtils = new InterleaverUtils_1.InterleaverUtils(params);
        if (params.delayTime && typeof params.delayTime === 'number') {
            this.delayTimeValue = params.delayTime;
        }
        else {
            this.delayTimeValue = 1;
        }
    }
    get inputLength() {
        return this.inputs.length;
    }
    get params() {
        return this.interleaverParams;
    }
    set params(params) {
        Object.assign(this.interleaverParams, params);
    }
    _read() {
        (0, AssertHighWaterMark_1.assertHighWaterMark)(this.params.bitDepth, this.params.highWaterMark);
        const allInputsSize = this.inputs.map((input) => input.dataSize)
            .filter(size => size >= (this.params.highWaterMark ?? (this.params.bitDepth / 8)));
        if (allInputsSize.length > 0) {
            const minDataSize = this.interleaverParams.highWaterMark ?? Math.min(...allInputsSize);
            const availableInputs = this.inputs.filter((input) => input.dataSize >= minDataSize);
            const dataCollection = availableInputs.map((input) => input.getData(minDataSize));
            let interleavedData = this.audioUtils.setAudioData(dataCollection)
                .interleave()
                .getAudioData();
            if (this.interleaverParams.preProcessData) {
                interleavedData = this.interleaverParams.preProcessData(interleavedData);
            }
            this.unshift(interleavedData);
            return;
        }
        if (this.interleaverParams.generateSilence) {
            const silentSize = ((this.interleaverParams.sampleRate * this.interleaverParams.channels) / 1000) * (this.interleaverParams.silentDuration ?? this.delayTimeValue);
            const silentData = new Uint8Array(silentSize);
            this.unshift(silentData);
        }
        if (this.isWork) {
            if (this.inputs.length === 0 && this.interleaverParams.autoClose) {
                this.destroy();
            }
        }
    }
    _destroy(error, callback) {
        if (!this.closed) {
            this.inputs.forEach((input) => {
                input.destroy();
            });
        }
        callback(error);
    }
    createAudioInput(inputParams, index) {
        const audioInput = new AudioInput_1.AudioInput(inputParams, this.interleaverParams, this.removeAudioinput.bind(this));
        if (index >= this.inputs.length) {
            this.inputs.push(audioInput);
        }
        else {
            this.inputs.splice(index, 0, audioInput);
        }
        this.isWork ||= true;
        this.emit('createInput');
        return audioInput;
    }
    changeAudioInputIndex(audioInput, index) {
        const findAudioInput = this.inputs.indexOf(audioInput);
        if (findAudioInput !== -1) {
            const [temp] = this.inputs.splice(findAudioInput, 1);
            this.inputs.splice(index, 0, temp);
            return true;
        }
        return false;
    }
    removeAudioinput(audioInput) {
        const findAudioInput = this.inputs.indexOf(audioInput);
        if (findAudioInput !== -1) {
            this.inputs.splice(findAudioInput, 1);
            this.emit('removeInput');
            return true;
        }
        return false;
    }
}
exports.AudioInterleaver = AudioInterleaver;
