import {test} from '../oki/index.js';
import {run} from './run.js';

test('run()', async t => {
	test('without any task names', async () => {
		const result = await run({logLevel: 0, taskNames: []});
		t.ok(result.ok);
		t.ok(result.taskNames.length > 0); // TODO convert to `t.gt`
		t.is(result.loadResults.length, 0);
		t.is(result.runResults.length, 0);
	});

	test('with task names', async () => {
		const result = await run({
			logLevel: 0,
			taskNames: ['run/fixtures/testTask1', 'run/fixtures/testTask2'],
		});
		t.ok(result.ok);
		t.ok(result.elapsed > 0);
		t.is(result.taskNames.length, 2);
		t.is(result.loadResults.length, 2);
		t.is(result.runResults.length, 2);

		test('missing task', async () => {
			const result = await run({
				logLevel: 0,
				taskNames: [
					'run/fixtures/testTask1',
					'run/fixtures/MISSING_TASK',
					'run/fixtures/testTask2',
				],
			});
			t.notOk(result.ok);
			t.is(result.loadResults.length, 3);
			t.ok(result.loadResults[0].ok);
			t.notOk(result.loadResults[1].ok);
			t.ok(result.loadResults[2].ok);
			t.is(result.runResults.length, 0);
		});

		test('invalid task', async () => {
			const result = await run({
				logLevel: 0,
				taskNames: [
					'run/fixtures/testTask1',
					'run/fixtures/testInvalidTask',
					'run/fixtures/testTask2',
				],
			});
			t.notOk(result.ok);
			t.is(result.loadResults.length, 3);
			t.ok(result.loadResults[0].ok);
			t.notOk(result.loadResults[1].ok);
			t.ok(result.loadResults[2].ok);
			t.is(result.runResults.length, 0);
		});

		test('failing task', async () => {
			const result = await run({
				logLevel: 0,
				taskNames: [
					'run/fixtures/testTask1',
					'run/fixtures/testFailingTask',
					'run/fixtures/testTask2',
				],
			});
			t.notOk(result.ok);
			t.is(result.loadResults.length, 3);
			t.ok(result.loadResults[0].ok);
			t.ok(result.loadResults[1].ok);
			t.ok(result.loadResults[2].ok);
			t.is(result.runResults.length, 2);
			t.ok(result.runResults[0].ok);
			t.notOk(result.runResults[1].ok);
		});
	});
});