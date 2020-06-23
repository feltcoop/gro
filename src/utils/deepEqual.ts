import {UnreachableError} from './error.js';
import {arraysEqual} from './array.js';
import {objectsEqual} from './object.js';
import {mapsEqual} from './map.js';
import {setsEqual} from './set.js';
import {regexpsEqual} from './regexp.js';

export const deepEqual = (a: unknown, b: unknown): boolean => {
	if (Object.is(a, b)) return true;

	const aType = typeof a;
	const bType = typeof b;

	if (aType !== bType) return false;

	switch (aType) {
		case 'string':
		case 'number':
		case 'bigint':
		case 'boolean':
		case 'symbol':
		case 'undefined':
		case 'function':
			return false;
		case 'object':
			if (a === null) return b === null;
			if (b === null) return a === null;

			// TODO might want to duck-type Array-likes to speed up e.g. typed array checking

			if (a instanceof Array) {
				if (!(b instanceof Array)) return false;
				return arraysEqual(a, b);
			}
			if (a instanceof Set) {
				if (!(b instanceof Set)) return false;
				return setsEqual(a, b);
			}
			if (a instanceof Map) {
				if (!(b instanceof Map)) return false;
				return mapsEqual(a, b);
			}
			if (a instanceof RegExp) {
				if (!(b instanceof RegExp)) return false;
				return regexpsEqual(a, b);
			}

			return objectsEqual(a as object, b as object);
		default:
			throw new UnreachableError(aType);
	}
};
