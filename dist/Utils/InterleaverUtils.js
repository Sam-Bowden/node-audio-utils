"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterleaverUtils = void 0;
const _hangeVolume_1 = require("./AudioUtils/\u0421hangeVolume");
const ModifiedDataView_1 = require("../ModifiedDataView/ModifiedDataView");
const InterleaveAudioData_1 = require("./General/InterleaveAudioData");
class InterleaverUtils {
    constructor(interleaverParams) {
        this.dataCollection = [];
        this.emptyData = new Uint8Array(0);
        this.audioInterleaverParams = interleaverParams;
        this.changedParams = { ...this.audioInterleaverParams };
        this.interleavedData = new ModifiedDataView_1.ModifiedDataView(this.emptyData.buffer);
    }
    setAudioData(audioData) {
        this.dataCollection = audioData.map((audioData) => new ModifiedDataView_1.ModifiedDataView(audioData.buffer));
        this.changedParams = { ...this.audioInterleaverParams };
        return this;
    }
    interleave() {
        if (this.dataCollection.length > 1) {
            this.interleavedData = (0, InterleaveAudioData_1.interleaveAudioData)(this.dataCollection, this.changedParams);
        }
        else {
            this.interleavedData = new ModifiedDataView_1.ModifiedDataView(this.dataCollection[0].buffer);
        }
        return this;
    }
    checkVolume() {
        const volume = this.audioInterleaverParams.volume ?? 100;
        if (volume !== 100) {
            (0, _hangeVolume_1.changeVolume)(this.interleavedData, this.changedParams);
        }
        return this;
    }
    getAudioData() {
        return new Uint8Array(this.interleavedData.buffer);
    }
}
exports.InterleaverUtils = InterleaverUtils;
