import * as fp from 'path';
import CheapWatch from 'cheap-watch';

import {LogLevel, logger, Logger} from '../utils/log.js';
import {cyan, magenta, red, yellow} from '../colors/terminal.js';
import {omitUndefined} from '../utils/object.js';
import {FileStats} from '../project/fileData.js';
import {
	isTaskPath,
	toTaskName,
	TaskMeta,
	toTaskPath,
	TaskContext,
	validateTaskModule,
} from '../run/task.js';
import {paths, toSourcePath} from '../paths.js';
import {fmtPath, fmtMs, fmtError} from '../utils/fmt.js';
import {createStopwatch} from '../utils/time.js';

export interface Options {
	logLevel: LogLevel;
	taskNames: string[];
}
export type RequiredOptions = 'taskNames';
export type InitialOptions = PartialExcept<Options, RequiredOptions>;
export const initOptions = (opts: InitialOptions): Options => ({
	logLevel: LogLevel.Info,
	...omitUndefined(opts),
});

export type RunResult = {
	ok: boolean;
	taskNames: string[];
	loadResults: TaskLoadResult[];
	runResults: TaskRunResult[];
	elapsed: number;
};
export type TaskLoadResult =
	| {ok: true; taskName: string}
	| {
			ok: false;
			taskName: string;
			reason: string;
			error: Error;
	  };
export type TaskRunResult =
	| {ok: true; taskName: string; elapsed: number}
	| {
			ok: false;
			taskName: string;
			reason: string;
			error: Error;
	  };

export const run = async (opts: InitialOptions): Promise<RunResult> => {
	const options = initOptions(opts);
	const {logLevel, taskNames} = options;
	const log = logger(logLevel, [magenta('[run]')]);
	const {error, info} = log;

	const loadResults: TaskLoadResult[] = [];
	const runResults: TaskRunResult[] = [];

	const dir = paths.build; //  the base directory where tasks are located

	const mainStopwatch = createStopwatch();

	// If no task names are provided,
	// find all of the available ones and print them out.
	if (!taskNames.length) {
		const tasks = await findAllTasks(log, dir);
		if (tasks.length) {
			info(
				'Available tasks:\n',
				tasks.map(t => '\t\t' + cyan(t.name)).join('\n'),
			);
		} else {
			info('No tasks found.');
		}
		return {
			ok: true,
			taskNames: tasks.map(t => t.name),
			loadResults,
			runResults,
			elapsed: mainStopwatch(),
		};
	}

	// First load all of the specified tasks,
	// so any errors cause the command to exit before running anything.
	const tasks: TaskMeta[] = [];
	let shouldRunTasks = true;
	for (const taskName of taskNames) {
		const path = toTaskPath(taskName);
		let task;
		try {
			task = await loadTask(dir, path);
			loadResults.push({ok: true, taskName});
		} catch (err) {
			const reason = `Failed to load task "${taskName}".`;
			error(red(reason), yellow(err.message));
			loadResults.push({ok: false, taskName, reason, error: err});
			shouldRunTasks = false;
			continue;
		}
		tasks.push(task);
	}

	// Abort if the cancellation flag was set.
	// Postponing this check allows all errors to surface.
	if (!shouldRunTasks) {
		info(yellow('Aborting. No tasks were run due to errors.'));
		return {
			ok: false,
			taskNames,
			loadResults,
			runResults,
			elapsed: mainStopwatch(),
		};
	}

	// Run the loaded tasks.
	for (const task of tasks) {
		const taskStopwatch = createStopwatch();
		const taskCtx: TaskContext = {log};
		info(`→ ${cyan(task.name)}`);
		try {
			await task.task.run(taskCtx);
			const elapsed = taskStopwatch();
			runResults.push({ok: true, taskName: task.name, elapsed});
			info(`✓ ${cyan(task.name)} 🕒 ${fmtMs(elapsed)}`);
		} catch (err) {
			const reason = `Unexpected error running task ${cyan(
				task.name,
			)}. Aborting.`;
			info(red(reason));
			info(fmtError(err));
			runResults.push({ok: false, taskName: task.name, reason, error: err});
			return {
				ok: false,
				taskNames,
				loadResults,
				runResults,
				elapsed: mainStopwatch(),
			};
		}
	}

	const elapsed = mainStopwatch();
	info(`🕒 ${fmtMs(elapsed)}`);

	return {ok: true, taskNames, loadResults, runResults, elapsed};
};

const loadTask = async (dir: string, path: string): Promise<TaskMeta> => {
	const fullPath = fp.join(dir, path);
	const mod = await import(fullPath);
	if (!validateTaskModule(mod)) {
		throw Error(`Task module export is invalid: ${toSourcePath(fullPath)}`);
	}
	return {
		task: mod.task,
		name: toTaskName(path),
		path: fullPath,
	};
};

const findAllTasks = async (log: Logger, dir: string): Promise<TaskMeta[]> => {
	const results: TaskMeta[] = [];

	// TODO we're using CheapWatch to find all files, which works fine,
	// but maybe we want a faster more specialized method.
	const filter: (p: {path: string; stats: FileStats}) => boolean = ({
		path,
		stats,
	}) => stats.isDirectory() || isTaskPath(path);
	const watcher = new CheapWatch({dir, filter, watch: false});

	await watcher.init();
	for (const [path, stats] of watcher.paths) {
		if (stats.isDirectory()) continue;
		log.trace('found task', fmtPath(path));
		let task;
		try {
			task = await loadTask(dir, path);
		} catch (err) {
			log.warn(yellow('Skipping invalid task.'), yellow(err.message));
			continue;
		}
		results.push(task);
	}

	return results;
};