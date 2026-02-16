export class RMSMonitor {
	public numSamples = 0;
	public sumOfSquares = 0;

	/** Sample normalised to [-1,1] */
	public onSample(sample: number) {
		this.numSamples++;
		this.sumOfSquares += sample ** 2;
	}

	public getRMS(): number {
		if (this.numSamples === 0) {
			return 0;
		}

		return percentFSToDB(Math.sqrt(this.sumOfSquares / this.numSamples));
	}

	public reset() {
		this.numSamples = 0;
		this.sumOfSquares = 0;
	}
}

function percentFSToDB(value: number): number {
	return 20 * Math.log10(value);
}
