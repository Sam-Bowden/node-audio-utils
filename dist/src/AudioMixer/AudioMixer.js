"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioMixer = void 0;
const stream_1 = require("stream");
const AssertHighWaterMark_1 = require("../Asserts/AssertHighWaterMark");
const MixerUtils_1 = require("../Utils/MixerUtils");
const AudioInput_1 = require("../AudioInput/AudioInput");
class AudioMixer extends stream_1.Readable {
    constructor(params) {
        super();
        this.isWork = false;
        this.inputs = [];
        this.mixerParams = params;
        this.audioUtils = new MixerUtils_1.MixerUtils(params);
        if (params.delayTime && typeof params.delayTime === 'number') {
            this.delayTimeValue = params.delayTime;
        }
        else {
            this.delayTimeValue = 1;
        }
    }
    get params() {
        return this.mixerParams;
    }
    set params(params) {
        Object.assign(this.mixerParams, params);
    }
    _read() {
        (0, AssertHighWaterMark_1.assertHighWaterMark)(this.params.bitDepth, this.params.highWaterMark);
        const allInputsSize = this.inputs.map((input) => input.dataSize)
            .filter(size => size >= (this.params.highWaterMark ?? (this.params.bitDepth / 8)));
        if (allInputsSize.length > 0) {
            const minDataSize = this.mixerParams.highWaterMark ?? Math.min(...allInputsSize);
            const availableInputs = this.inputs.filter((input) => input.dataSize >= minDataSize);
            const dataCollection = availableInputs.map((input) => input.getData(minDataSize));
            let mixedData = this.audioUtils.setAudioData(dataCollection)
                .mix()
                .checkVolume()
                .getAudioData();
            if (this.mixerParams.preProcessData) {
                mixedData = this.mixerParams.preProcessData(mixedData);
            }
            this.unshift(mixedData);
            return;
        }
        if (this.mixerParams.generateSilence) {
            const silentSize = ((this.mixerParams.sampleRate * this.mixerParams.channels) / 1000) * (this.mixerParams.silentDuration ?? this.delayTimeValue);
            const silentData = new Uint8Array(silentSize);
            this.unshift(silentData);
        }
        if (this.isWork) {
            if (this.inputs.length === 0 && this.mixerParams.autoClose) {
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
    createAudioInput(inputParams) {
        const audioInput = new AudioInput_1.AudioInput(inputParams, this.mixerParams, this.removeAudioinput.bind(this));
        this.inputs.push(audioInput);
        this.isWork ||= true;
        this.emit('createInput');
        return audioInput;
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
exports.AudioMixer = AudioMixer;
