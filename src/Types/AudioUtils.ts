export type AudioUtils = {
	setAudioData(audioData: Uint8Array | Uint8Array[]): ThisType<AudioUtils>;
	checkPreProcessVolume(): ThisType<AudioUtils>;
	checkPostProcessVolume(): ThisType<AudioUtils>;
	getAudioData(): Uint8Array;
};
