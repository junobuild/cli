import {Principal} from '@dfinity/principal';
import {assertNonNullish, isNullish, nonNullish} from '@dfinity/utils';
import {nextArg} from '@junobuild/cli-tools';
import {OnRunSchema, type RunFnOrObject, RunFnOrObjectSchema} from '@junobuild/config';
import {build} from 'esbuild';
import {red, yellow} from 'kleur';
import {ENV} from '../env';
import {assertConfigAndLoadSatelliteContext} from '../utils/satellite.utils';

export const run = async (args?: string[]) => {
  const infile = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});

  if (isNullish(infile)) {
    console.log(red('Missing required path to script: --src <path>'));
    return;
  }

  const {onRun} = await importOnRun({infile});

  if (isNullish(onRun)) {
    console.log(yellow('Cannot import a task to run. 🤷‍♂️'));
    console.log(`Does your script ${infile} export a function named "onRun"?`);
    return;
  }

  if (!RunFnOrObjectSchema.safeParse(onRun).success) {
    console.log(red('Your "onRun" export is invalid. It must be of type RunFnOrObject.'));
    return;
  }

  const job =
    typeof onRun === 'function'
      ? onRun({
          mode: ENV.mode,
          profile: ENV.profile
        })
      : onRun;

  const assertJob = OnRunSchema.safeParse(job);

  if (!assertJob.success) {
    console.log(red('Your job to run is invalid. It must be of type OnRun.'));
    return;
  }

  const {data: assertedJob} = assertJob;

  const {
    satellite: {satelliteId, identity}
  } = await assertConfigAndLoadSatelliteContext();

  await assertedJob.run({
    satelliteId: Principal.fromText(satelliteId),
    identity,
    ...(nonNullish(ENV.containerUrl) && {container: ENV.containerUrl})
  });
};

const importOnRun = async ({
  infile
}: {
  infile: string;
}): Promise<{onRun: RunFnOrObject | undefined}> => {
  const {code} = await buildCode({infile});

  const {onRun} = await import(
    `data:text/javascript;base64,${Buffer.from(code).toString(`base64`)}`
  );

  return {onRun: typeof onRun === 'undefined' ? undefined : onRun};
};

const buildCode = async ({infile}: {infile: string}): Promise<{code: Uint8Array}> => {
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

  const code = outputFiles[0]?.contents;

  assertNonNullish(code, 'No script build');

  return {code};
};
