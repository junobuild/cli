import {assertNonNullish} from '@dfinity/utils';
import {nextArg} from '@junobuild/cli-tools';
import {TaskFnOrObjectSchema} from '@junobuild/config';
import {build} from 'esbuild';
import {extname} from 'node:path';

export const run = async (args?: string[]) => {
  const infile = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});

  // TODO
  assertNonNullish(infile);

  const isPathTypeScript = extname(infile) === '.ts';

  const {outputFiles} = await build({
    entryPoints: [infile],
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'node',
    write: false,
    supported: {
      'top-level-await': false,
      'inline-script': false
    },
    define: {
      self: 'globalThis'
    },
    metafile: true,
    banner: {
      js: `import { createRequire as topLevelCreateRequire } from 'node:module';
import { resolve } from 'node:path';
const require = topLevelCreateRequire(resolve(process.cwd(), '.juno-pseudo-require-anchor.mjs'));`
    }
  });

  const script = outputFiles[0].contents;

  const {onRun} = await import(
    `data:text/javascript;base64,${Buffer.from(script).toString(`base64`)}`
  );

  if (typeof onRun === 'undefined') {
    return;
  }

  TaskFnOrObjectSchema.parse(onRun);

  const config = typeof onRun === 'function' ? onRun({}) : onRun;
  await config.run({});
};
