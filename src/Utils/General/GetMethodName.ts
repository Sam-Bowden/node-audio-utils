/* eslint-disable @typescript-eslint/naming-convention */
import {type IntType, type BitDepth} from '../../Types/AudioTypes';

export function getMethodName(bitDepth: BitDepth, isUnsigned?: boolean): `${IntType}${BitDepth}` {
	return `${isUnsigned ? 'Uint' : 'Int'}${bitDepth}`;
}

const getMethodNames = {
	Int: {
		8: 'getInt8',
		16: 'getInt16',
		24: 'getInt24',
		32: 'getInt32',
	},
	Uint: {
		8: 'getUint8',
		16: 'getUint16',
		24: 'getUint24',
		32: 'getUint32',
	},
} as const;

const setMethodNames = {
	Int: {
		8: 'setInt8',
		16: 'setInt16',
		24: 'setInt24',
		32: 'setInt32',
	},
	Uint: {
		8: 'setUint8',
		16: 'setUint16',
		24: 'setUint24',
		32: 'setUint32',
	},
} as const;

export function getReadMethodName(bitDepth: BitDepth, isUnsigned?: boolean): `get${IntType}${BitDepth}` {
	return getMethodNames[isUnsigned ? 'Uint' : 'Int'][bitDepth];
}

export function getWriteMethodName(bitDepth: BitDepth, isUnsigned?: boolean): `set${IntType}${BitDepth}` {
	return setMethodNames[isUnsigned ? 'Uint' : 'Int'][bitDepth];
}
