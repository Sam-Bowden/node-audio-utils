import type {Upmix as UpmixInstance} from 'node-libavfilter-upmix';
import {type UpmixOptions} from '../../Types/ParamTypes';

export class UpmixState {
	public readonly upmix: UpmixInstance;
	public readonly outputChannels: number;
	public readonly bitDepth: 16 | 32;
	public outputBuffer: Uint8Array = new Uint8Array(0);

	public constructor(options: UpmixOptions, inputChannels: number, sampleRate: number, bitDepth: 16 | 32) {
		type UpmixCtor = new (options: {
			sampleRate: number;
			bitDepth: 16 | 32;
			inputChannels: number;
			inputLayout: string;
			outputLayout: string;
			winSize?: number;
		}) => UpmixInstance;
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const upmixModule = require('node-libavfilter-upmix') as {Upmix: UpmixCtor};
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

	public destroy(): void {
		this.upmix.close();
	}

	public clear(): void {
		this.upmix.reset();
		this.outputBuffer = new Uint8Array(0);
	}
}

function channelCountToLayout(channels: number): string {
	switch (channels) {
		case 2: return 'stereo';
		case 6: return '5.1';
		case 8: return '7.1';
		default: throw new Error(`Unsupported input channel count for upmix: ${channels}`);
	}
}

function layoutToChannelCount(layout: string): number {
	switch (layout) {
		case 'stereo': return 2;
		case '5.1': return 6;
		case '7.1': return 8;
		default: throw new Error(`Unknown channel layout: '${layout}'`);
	}
}
