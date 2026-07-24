import {type OmitSomeParams, type InputParams, type ProcessorParams} from '../Types/ParamTypes';

import {Writable} from 'stream';
import {endianness} from 'os';

import {InputUtils} from '../Utils/InputUtils';
import {getZeroSample} from '../Utils/General/GetZeroSample';
import {type ProcessingStats} from '../Utils/Stats/ProcessingStats';

type SelfRemoveFunction = (audioInput: AudioInput) => void;

export class AudioInput extends Writable {
	private readonly inputParams: InputParams;
	private readonly processorParams: ProcessorParams;

	private readonly selfRemoveFunction: SelfRemoveFunction | undefined;

	private readonly audioUtils: InputUtils;

	private chunks: Uint8Array[] = [];
	private headOffset = 0;
	private totalBytes = 0;
	private correctionBuffer: Uint8Array = new Uint8Array(0);

	constructor(inputParams: InputParams, processorParams: ProcessorParams, selfRemoveFunction?: SelfRemoveFunction) {
		super();

		this.inputParams = inputParams;
		this.inputParams.endianness ??= endianness();

		this.processorParams = processorParams;

		this.selfRemoveFunction = selfRemoveFunction;

		this.audioUtils = new InputUtils(inputParams, processorParams);
	}

	get params(): Readonly<InputParams> {
		return this.inputParams;
	}

	set params(params: OmitSomeParams<InputParams>) {
		Object.assign(this.inputParams, params);
	}

	get processingStats(): ProcessingStats {
		return this.audioUtils.processingStats;
	}

	public get dataSize(): number {
		return this.closed ? (this.processorParams.highWaterMark ?? this.totalBytes) : this.totalBytes;
	}

	public resetUpmixState(): void {
		this.audioUtils.resetUpmixState();
	}

	public clear(): void {
		this.chunks = [];
		this.headOffset = 0;
		this.totalBytes = 0;
		this.audioUtils.clear();
	}

	public _write(chunk: Uint8Array, _: BufferEncoding, callback: (error?: Error) => void): number {
		let processedLength = 0;

		if (!this.closed) {
			const bytesPerElement = this.inputParams.bitDepth / 8;

			if (chunk.length % bytesPerElement !== 0) {
				chunk = this.correctByteSize(chunk);
			}

			if (chunk.length > 0) {
				const processedData = this.processData(chunk);

				processedLength = processedData.length;

				if (processedData.length > 0) {
					// The queue retains the chunk beyond this call: writers must
					// not reuse or mutate the buffer they pass in
					this.chunks.push(processedData);
					this.totalBytes += processedData.length;

					const {maxBufferLength} = this.processorParams;

					if (maxBufferLength !== undefined && this.totalBytes > maxBufferLength) {
						this.discard(this.totalBytes - maxBufferLength);
					}
				}
			}
		}

		callback();

		return processedLength;
	}

	public _destroy(error: Error, callback: (error?: Error) => void): void {
		this.audioUtils.destroy();

		if (!this.closed) {
			if (this.totalBytes === 0 && this.correctionBuffer.length === 0) {
				this.removeInputSelf();

				return;
			}

			if (this.correctionBuffer.length > 0) {
				const correctedData = this.correctByteSize(this.correctionBuffer, true);

				this.chunks = correctedData.length > 0 ? [correctedData] : [];
				this.headOffset = 0;
				this.totalBytes = correctedData.length;
			}
		}

		callback(error);
	}

	public getData(size: number): Uint8Array {
		const zeroSample = getZeroSample(this.inputParams.bitDepth, this.inputParams.unsigned);

		const tempChunk = new Uint8Array(size);

		if ((this.totalBytes < size && this.closed) || this.totalBytes >= size) {
			const copied = this.consumeInto(tempChunk);

			if (copied < size) {
				tempChunk.fill(zeroSample, copied);
			}
		} else {
			tempChunk.fill(zeroSample);
		}

		if (this.totalBytes === 0 && this.closed) {
			this.removeInputSelf();
		}

		return tempChunk;
	}

	private consumeInto(target: Uint8Array): number {
		let copied = 0;

		while (copied < target.length && this.chunks.length > 0) {
			const head = this.chunks[0];
			const available = head.length - this.headOffset;
			const byteCount = Math.min(available, target.length - copied);

			target.set(head.subarray(this.headOffset, this.headOffset + byteCount), copied);
			copied += byteCount;

			if (byteCount === available) {
				this.chunks.shift();
				this.headOffset = 0;
			} else {
				this.headOffset += byteCount;
			}
		}

		this.totalBytes -= copied;

		return copied;
	}

	private discard(byteCount: number): void {
		this.totalBytes -= byteCount;

		while (byteCount > 0 && this.chunks.length > 0) {
			const head = this.chunks[0];
			const available = head.length - this.headOffset;

			if (byteCount < available) {
				this.headOffset += byteCount;

				return;
			}

			byteCount -= available;
			this.headOffset = 0;
			this.chunks.shift();
		}
	}

	private correctByteSize(chunk: Uint8Array, isProcessed?: boolean): Uint8Array {
		if (!this.params.correctByteSize) {
			return new Uint8Array(0);
		}

		if (this.correctionBuffer.length > 0) {
			const zeroSample = getZeroSample(this.inputParams.bitDepth, this.inputParams.unsigned);
			const newSize = chunk.length + this.correctionBuffer.length;

			const tempChunk = new Uint8Array(newSize).fill(zeroSample);

			tempChunk.set(this.correctionBuffer, 0);
			tempChunk.set(chunk, this.correctionBuffer.length);

			chunk = tempChunk;

			this.correctionBuffer = new Uint8Array(0);
		}

		const bytesPerElement = (isProcessed ? this.processorParams : this.inputParams).bitDepth / 8;

		const chunkSize = chunk.length + this.correctionBuffer.length;
		const remainder = chunkSize % bytesPerElement;
		const correctedSize = chunkSize - remainder;

		const correctedChunk = new Uint8Array(correctedSize);

		correctedChunk.set(this.correctionBuffer, 0);
		correctedChunk.set(chunk.slice(0, correctedSize), this.correctionBuffer.length);

		this.correctionBuffer = new Uint8Array(remainder);

		this.correctionBuffer.set(chunk.slice(correctedSize));

		return correctedChunk;
	}

	private processData(chunk: Uint8Array): Uint8Array {
		return this.audioUtils
			.setAudioData(chunk)
			.checkActiveChannelsCount()
			.applyDownmix()
			.applyUpmix()
			.checkBitDepth()
			.checkSampleRate()
			.checkChannelsCount()
			.checkIntType()
			.checkEndianness()
			.checkPreProcessVolume()
			.updatePreProcessStats()
			.applyDownwardCompressor()
			.applyGate()
			.checkPostProcessVolume()
			.getAudioData();
	}

	private removeInputSelf(): void {
		if (this.totalBytes > 0) {
			this.chunks = [];
			this.headOffset = 0;
			this.totalBytes = 0;
		}

		if (typeof this.selfRemoveFunction === 'function') {
			this.selfRemoveFunction(this);
		}
	}
}
