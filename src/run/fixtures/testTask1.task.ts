import {Task} from '../task.js';

export const task: Task = {
	description: 'a test task for basic task behavior',
	run: async ({log: {info}, argv}, data) => {
		info('test task 1!');
		return {
			...data,
			foo: 1, // add a property
			argv, // forward argv to test that it exists in ctx
		};
	},
};
