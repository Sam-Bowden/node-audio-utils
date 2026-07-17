type SampleRate = 4000 | 8000 | 11025 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000 | 88200 | 96000 | 176400 | 192000;

type BitDepth = 8 | 16 | 24 | 32;

type Endianness = 'LE' | 'BE';

type IntType = 'Int' | 'Uint';

type UpmixOutputLayout = 'stereo' | '5.1' | '7.1';

type UpmixLfeMode = 'add' | 'sub';

export type {
	SampleRate, BitDepth, Endianness, IntType, UpmixOutputLayout, UpmixLfeMode,
};

export const isSampleRate = (v: unknown): v is SampleRate =>
	v === 4000
	|| v === 8000
	|| v === 11025
	|| v === 16000
	|| v === 22050
	|| v === 24000
	|| v === 32000
	|| v === 44100
	|| v === 48000
	|| v === 88200
	|| v === 96000
	|| v === 176400
	|| v === 192000;

export const isBitDepth = (v: unknown): v is BitDepth => v === 8 || v === 16 || v === 24 || v === 32;
