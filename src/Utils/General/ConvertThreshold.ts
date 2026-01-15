import {type BitDepth} from '../../Types/AudioTypes';

type ThresholdResult = {lowerThreshold: number; upperThreshold: number; equilibrium: number};

export function convertThreshold(bitDepth: BitDepth, isUnsigned: boolean | undefined, thresholdPercentage: number): ThresholdResult {
	const halfRange = (2 ** bitDepth) / 2;
	const threshold = halfRange * thresholdPercentage;
	const equilibrium = isUnsigned ? halfRange : 0;
	return {
		upperThreshold: equilibrium + threshold - 1,
		lowerThreshold: equilibrium - threshold,
		equilibrium,
	};
}
