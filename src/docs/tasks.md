# tasks

> <sub>[gro](/../..) / [docs](./) / tasks.md</sub>

What is a task? See [`src/tasks/README.md`](../task).

## all tasks

- [build](../build.task.ts) - build the project
- [check](../check.task.ts) - check that everything is ready to commit
- [clean](../clean.task.ts) - remove build and temp files
- [compile](../compile.task.ts) - compiles all files to the build directory
- [deploy](../deploy.task.ts) - deploy to gh-pages
- [dev](../dev.task.ts) - start dev server
- [dist](../dist.task.ts) - create the distribution
- [format](../format.task.ts) - format source files
- [gen](../gen.task.ts) - run code generation scripts
- [project/build](../project/build.task.ts) - build, create, and link the distribution
- [project/compilerBenchmark](../project/compilerBenchmark.task.ts) - benchmark compilation with different libraries
- [project/dist](../project/dist.task.ts) - create and link the distribution
- [project/echo](../project/echo.task.ts) - diagnostic task that logs CLI args
- [project/link](../project/link.task.ts) - link the distribution
- [serve](../serve.task.ts) - start static file server
- [test](../test.task.ts) - run tests
- [typecheck](../typecheck.task.ts) - typecheck the project without emitting any files

## usage

```bash
$ gro some/task/name
```

> <sub>[gro](/../..) / [docs](./) / tasks.md</sub>

> <sub>generated by [tasks.gen.md.ts](tasks.gen.md.ts)</sub>
