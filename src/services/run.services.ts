import {Principal} from '@dfinity/principal';
import {assertNonNullish} from '@dfinity/utils';
import {nextArg} from '@junobuild/cli-tools';
import {OnRunSchema} from '@junobuild/config';
import {build} from 'esbuild';
import {ENV} from '../env';
import {assertConfigAndLoadSatelliteContext} from '../utils/satellite.utils';

export const run = async (args?: string[]) => {
  const infile = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});

  // TODO
  assertNonNullish(infile);

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

  const task =
    typeof onRun === 'function'
      ? onRun({
          mode: ENV.mode,
          profile: ENV.profile
        })
      : onRun;

  const assertedTask = OnRunSchema.parse(task);

  const {
    satellite: {satelliteId, identity}
  } = await assertConfigAndLoadSatelliteContext();

  await assertedTask.run({
    satelliteId: Principal.fromText(satelliteId),
    identity
  });
};
