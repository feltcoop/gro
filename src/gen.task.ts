import {outputFile} from './fs/nodeFs.js';
import {Task} from './task/task.js';
import {red, green, gray} from './colors/terminal.js';
import {isGenPath, GEN_FILE_PATTERN} from './gen/gen.js';
import {runGen} from './gen/runGen.js';
import {loadGenModule} from './gen/genModule.js';
import {fmtPath, fmtMs, fmtError, fmtSubTiming} from './utils/fmt.js';
import {resolveRawInputPaths, getPossibleSourceIds} from './fs/inputPath.js';
import {findFiles} from './fs/nodeFs.js';
import {plural} from './utils/string.js';
import {Timings} from './utils/time.js';
import {findModules, loadModules} from './fs/modules.js';

// TODO test - especially making sure nothing gets genned
// if there's any validation or import errors
export const task: Task = {
	description: 'Run code generation scripts',
	run: async ({log, args}): Promise<void> => {
		const rawInputPaths = args._;

		const timings = new Timings<'total' | 'output results'>();
		timings.start('total');
		const subTimings = new Timings();

		// resolve the input paths relative to src/
		const inputPaths = resolveRawInputPaths(rawInputPaths);

		// load all of the gen modules
		const findModulesResult = await findModules(
			inputPaths,
			// TODO really we want a regexp here, but the API currently doesn't work that way -
			// it precomputes the possible files instead of performing a broader search -
			// maybe we just take regexps as params and search all files for now?
			id => findFiles(id, file => isGenPath(file.path)),
			inputPath => getPossibleSourceIds(inputPath, [GEN_FILE_PATTERN]),
		);
		if (!findModulesResult.ok) {
			for (const reason of findModulesResult.reasons) {
				log.error(reason);
			}
			return;
		}
		subTimings.merge(findModulesResult.timings);
		const loadModulesResult = await loadModules(
			findModulesResult.sourceIdsByInputPath,
			loadGenModule,
		);
		if (!loadModulesResult.ok) {
			for (const reason of loadModulesResult.reasons) {
				log.error(reason);
			}
			return;
		}
		subTimings.merge(loadModulesResult.timings);

		// run `gen` on each of the modules
		subTimings.start('generate code'); // TODO this ignores `genResults.elapsed` - should it return `Timings` instead?
		const genResults = await runGen(loadModulesResult.modules);
		subTimings.stop('generate code');

		// write generated files to disk
		subTimings.start('output results');
		if (genResults.failures.length) {
			for (const result of genResults.failures) {
				log.error(result.reason, '\n', fmtError(result.error));
			}
		}
		await Promise.all(
			genResults.successes
				.map(result =>
					result.files.map(file => {
						log.info(
							'writing',
							fmtPath(file.id),
							'generated from',
							fmtPath(file.originId),
						);
						return outputFile(file.id, file.contents);
					}),
				)
				.flat(),
		);
		subTimings.stop('output results');

		let logResult = '';
		for (const result of genResults.results) {
			logResult += `\n\t${result.ok ? green('✓') : red('🞩')}  ${
				result.ok ? result.files.length : 0
			} ${gray('in')} ${fmtMs(result.elapsed)} ${gray('←')} ${fmtPath(
				result.id,
			)}`;
		}
		log.info(logResult);
		log.info(
			green(
				`generated ${genResults.outputCount} file${plural(
					genResults.outputCount,
				)} from ${genResults.successes.length} input file${plural(
					genResults.successes.length,
				)}`,
			),
		);
		if (genResults.failures.length) {
			log.info(
				red(
					`${genResults.failures.length} file${plural(
						genResults.failures.length,
					)} failed to generate`,
				),
			);
		}
		for (const [key, timing] of subTimings.getAll()) {
			log.trace(fmtSubTiming(key, timing));
		}
		log.info(`🕒 ${fmtMs(timings.stop('total'))}`);
	},
};
