import {join} from 'path';

import {LogLevel, logger} from '../utils/log.js';
import {magenta} from '../colors/terminal.js';
import {omitUndefined} from '../utils/object.js';
import {fmtPath} from '../utils/fmt.js';
import {RunHost} from './run.js';
import {
	isTaskPath,
	toTaskName,
	TaskModuleMeta,
	validateTaskModule,
} from './task.js';
import {toSourcePath, toBuildId, toSourceId, toBasePath} from '../paths.js';
import {findFiles} from '../fs/nodeFs.js';

export interface Options {
	logLevel: LogLevel;
}
export type RequiredOptions = never;
export type InitialOptions = PartialExcept<Options, RequiredOptions>;
export const initOptions = (opts: InitialOptions): Options => ({
	logLevel: LogLevel.Info,
	...omitUndefined(opts),
});

export const createNodeRunHost = (opts: InitialOptions): RunHost => {
	const {logLevel} = initOptions(opts);
	const {info, trace} = logger(logLevel, [magenta('[run]')]);

	return {
		findTaskModules: async (dir: string): Promise<string[]> => {
			info(`finding all tasks in ${fmtPath(dir)}`);
			const sourceIds: string[] = [];

			const buildDir = toBuildId(dir);

			const paths = await findFiles(buildDir, ({path}) => isTaskPath(path));
			for (const [path, stats] of paths) {
				if (stats.isDirectory()) continue;
				const sourceId = toSourceId(join(buildDir, path));
				trace('found task', fmtPath(sourceId));
				sourceIds.push(sourceId);
			}

			return sourceIds;
		},
		loadTaskModule: async (sourceId: string): Promise<TaskModuleMeta> => {
			trace('loading task', fmtPath(sourceId));
			const buildId = toBuildId(sourceId);
			const mod = await import(buildId);
			if (!validateTaskModule(mod)) {
				throw Error(`Task module export is invalid: ${toSourcePath(buildId)}`);
			}
			return {
				id: sourceId,
				name: toTaskName(toBasePath(buildId)),
				mod,
			};
		},
	};
};