import {dirname, relative, basename} from 'path';

import {Gen, toOutputFileName} from '../gen/gen.js';
import {createNodeRunHost} from '../run/nodeRunHost.js';
import {
	paths,
	toBasePath,
	toSourceId,
	toPathParts,
	toPathSegments,
} from '../paths.js';
import {stripStart} from '../utils/string.js';
import {last} from '../utils/array.js';

// This is the first simple implementation of Gro's automated docs.
// It combines Gro's gen and task systems
// to generate a markdown file describing all of the project's tasks.
// Other projects that use Gro should be able to import this module
// or other otherwise get frictionless access to this specific use case,
// and they should be able to extend or customize it to any degree.

// TODO display more info about each task, including a description and params
// TODO needs some cleanup and better APIs - paths are confusing and verbose!
// TODO add backlinks to every document that links to this one

export const gen: Gen = async ({originId}) => {
	const {findTaskModules, loadTaskModule} = createNodeRunHost({logLevel: 0});
	const taskSourceIds = await findTaskModules(paths.source);
	const tasks = await Promise.all(taskSourceIds.map(id => loadTaskModule(id)));

	// TODO need to get this from project config or something
	const rootPath = last(toPathSegments(paths.root));

	const originDir = dirname(originId);
	const originBase = basename(originId);

	const baseDir = paths.source;
	const relativePath = stripStart(originId, baseDir);
	const relativeDir = dirname(relativePath);

	// TODO should this be passed in the context, like `defaultOutputFileName`?
	const outputFileName = toOutputFileName(originBase);

	// TODO this is GitHub-specific
	const rootLink = `[${rootPath}](/../..)`;

	// TODO do we want to use absolute paths instead of relative paths,
	// because GitHub works with them and it simplifies the code?
	const pathParts = toPathParts(relativeDir).map(
		relativePathPart =>
			`[${last(toPathSegments(relativePathPart))}](${relative(
				originDir,
				toSourceId(relativePathPart),
			) || './'})`,
	);
	const breadcrumbs = [rootLink, ...pathParts, outputFileName]
		.map(line => `> <sub>${line}</sub>`)
		.join(' <sub>/</sub>\n');

	// TODO render the footer with the originId
	return `# Tasks

${breadcrumbs}

## all tasks

${tasks.reduce(
	(taskList, task) =>
		taskList +
		`- [${toBasePath(toSourceId(task.name))}](${relative(originDir, task.id)})${
			task.mod.task.description ? ` - ${task.mod.task.description}` : ''
		}\n`,
	'',
)}
## usage

\`\`\`bash
$ gro run some/task/name
\`\`\`

${breadcrumbs}

> <sub>generated by [${originBase}](${originBase})</sub>
`;
};