"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpmixState = void 0;
class UpmixState {
    constructor(options, inputChannels, sampleRate, bitDepth) {
        this.outputBuffer = new Uint8Array(0);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const upmixModule = require('node-libavfilter-upmix');
        this.upmix = new upmixModule.Upmix({
            sampleRate,
            bitDepth,
            inputChannels,
            inputLayout: channelCountToLayout(inputChannels),
            outputLayout: options.outputLayout,
            winSize: options.winSize,
        });
        this.outputChannels = layoutToChannelCount(options.outputLayout);
        this.bitDepth = bitDepth;
    }
    destroy() {
        this.upmix.close();
    }
    clear() {
        this.upmix.reset();
        this.outputBuffer = new Uint8Array(0);
    }
}
exports.UpmixState = UpmixState;
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
