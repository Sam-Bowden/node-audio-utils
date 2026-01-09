"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixerUtils = void 0;
const _hangeVolume_1 = require("./AudioUtils/\u0421hangeVolume");
const ModifiedDataView_1 = require("../ModifiedDataView/ModifiedDataView");
const MixAudioData_1 = require("./General/MixAudioData");
class MixerUtils {
    constructor(mixerParams) {
        this.dataCollection = [];
        this.emptyData = new Uint8Array(0);
        this.audioMixerParams = mixerParams;
        this.changedParams = { ...this.audioMixerParams };
        this.mixedData = new ModifiedDataView_1.ModifiedDataView(this.emptyData.buffer);
    }
    setAudioData(audioData) {
        this.dataCollection = audioData.map((audioData) => new ModifiedDataView_1.ModifiedDataView(audioData.buffer));
        this.changedParams = { ...this.audioMixerParams };
        return this;
    }
    mix() {
        if (this.dataCollection.length > 1) {
            this.mixedData = (0, MixAudioData_1.mixAudioData)(this.dataCollection, this.changedParams);
        }
        else {
            this.mixedData = new ModifiedDataView_1.ModifiedDataView(this.dataCollection[0].buffer);
        }
        return this;
    }
    checkVolume() {
        const volume = this.audioMixerParams.volume ?? 100;
        if (volume !== 100) {
            (0, _hangeVolume_1.changeVolume)(this.mixedData, this.changedParams);
        }
        return this;
    }
    getAudioData() {
        return new Uint8Array(this.mixedData.buffer);
    }
}
exports.MixerUtils = MixerUtils;
