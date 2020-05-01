import CheapWatch from 'cheap-watch';
import fsExtra from 'fs-extra';

import {PathStats, PathFilter} from './pathData.js';

export interface CheapWatchPathAddedEvent {
	path: string;
	stats: PathStats;
	isNew: boolean;
}

export interface CheapWatchPathRemovedEvent {
	path: string;
	stats: PathStats;
}

export const DEBOUNCE_DEFAULT = 10;

// TODO should this API be changed to only include files and not directories?
// or maybe change the name so it's not misleading?
export const findFiles = async (
	dir: string,
	filter?: PathFilter,
): Promise<Map<string, PathStats>> => {
	const watcher = new CheapWatch({
		dir,
		filter: filter
			? (file: {path: string; stats: PathStats}) =>
					file.stats.isDirectory() || filter(file)
			: undefined,
		watch: false,
		debounce: DEBOUNCE_DEFAULT,
	});
	await watcher.init();
	watcher.close();
	return watcher.paths;
};

/*

Re-export the functions we use from `fs-extra`.
The reason is twofold.

1. `fs-extra` doesn't support named imports yet.
https://github.com/jprichardson/node-fs-extra/issues/746

2. We want to minimize our code's reliance
to the Node platform when the cost and friction are low.
Eventually we'll want our code to run on other platforms, like Deno,
and this practice will make future interop or migration more feasible.

*/
export const pathExists = fsExtra.pathExists;
export const stat = fsExtra.stat;
export type Stats = fsExtra.Stats;
export const readFile = fsExtra.readFile;
export const outputFile = fsExtra.outputFile;
export const emptyDir = fsExtra.emptyDir;
export const copy = fsExtra.copy;
