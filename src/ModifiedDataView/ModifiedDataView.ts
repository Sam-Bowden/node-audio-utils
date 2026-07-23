/* eslint-disable no-bitwise */
export class ModifiedDataView extends DataView {
	public getInt24(byteOffset: number, littleEndian?: boolean): number {
		return (this.getUint24(byteOffset, littleEndian) << 8) >> 8;
	}

	public getUint24(byteOffset: number, littleEndian?: boolean): number {
		if (littleEndian) {
			return this.getUint8(byteOffset) | (this.getUint8(byteOffset + 1) << 8) | (this.getUint8(byteOffset + 2) << 16);
		}

		return (this.getUint8(byteOffset) << 16) | (this.getUint8(byteOffset + 1) << 8) | this.getUint8(byteOffset + 2);
	}

	public setInt24(byteOffset: number, value: number, littleEndian?: boolean): void {
		this.setUint24(byteOffset, value, littleEndian);
	}

	public setUint24(byteOffset: number, value: number, littleEndian?: boolean): void {
		if (littleEndian) {
			this.setUint8(byteOffset, value & 0xff);
			this.setUint8(byteOffset + 1, (value >> 8) & 0xff);
			this.setUint8(byteOffset + 2, (value >> 16) & 0xff);
		} else {
			this.setUint8(byteOffset, (value >> 16) & 0xff);
			this.setUint8(byteOffset + 1, (value >> 8) & 0xff);
			this.setUint8(byteOffset + 2, value & 0xff);
		}
	}
}
