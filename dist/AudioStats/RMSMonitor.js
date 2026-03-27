"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RMSMonitor = void 0;
class RMSMonitor {
    constructor() {
        this.numSamples = 0;
        this.sumOfSquares = 0;
    }
    /** Sample normalised to [-1,1] */
    onSample(sample) {
        this.numSamples++;
        this.sumOfSquares += sample ** 2;
    }
    getRMS() {
        if (this.numSamples === 0) {
            return 0;
        }
        return percentFSToDB(Math.sqrt(this.sumOfSquares / this.numSamples));
    }
    reset() {
        this.numSamples = 0;
        this.sumOfSquares = 0;
    }
}
exports.RMSMonitor = RMSMonitor;
function percentFSToDB(value) {
    return 20 * Math.log10(value);
}
