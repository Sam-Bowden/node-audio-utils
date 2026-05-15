export class RmsMonitor {
	public numSamples = 0;
	public sumOfSquares = 0;

	/** Sample normalised to [-1,1] */
	public onSample(sample: number) {
		this.numSamples++;
		this.sumOfSquares += sample ** 2;
	}

	public getRms(): number {
		if (this.numSamples === 0) {
			return 0;
		}

		return percentFsToDb(Math.sqrt(this.sumOfSquares / this.numSamples));
	}

	public reset() {
		this.numSamples = 0;
		this.sumOfSquares = 0;
	}
}

function percentFsToDb(value: number): number {
	return 20 * Math.log10(value);
}
