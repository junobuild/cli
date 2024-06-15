import type {FileDetails} from '@junobuild/cli-tools';
import {fullPath, hasArgs, prepareDeploy} from '@junobuild/cli-tools';
import {uploadBlob, type Asset, type AssetKey} from '@junobuild/core-peer';
import {isNullish, nonNullish} from '@junobuild/utils';
import {Blob} from 'buffer';
import {red} from 'kleur';
import Listr from 'listr';
import {lstatSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {basename, relative} from 'node:path';
import {junoConfigExist, readJunoConfig} from '../configs/juno.config';
import {COLLECTION_DAPP, UPLOAD_BATCH_SIZE} from '../constants/constants';
import {clear} from '../services/clear.services';
import {assertSatelliteMemorySize, listAssets} from '../services/deploy.services';
import {links} from '../services/links.services';
import {configEnv} from '../utils/config.utils';
import {satelliteParameters} from '../utils/satellite.utils';
import {init} from './init';

export const deploy = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    await init();
  }

  if (hasArgs({args, options: ['-c', '--clear']})) {
    await clear(args);
  }

  await executeDeploy(args);

  await links(args);
};

const executeDeploy = async (args?: string[]) => {
  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const listExistingAssets = async (): Promise<Asset[]> =>
    await listAssets({
      env: {
        env,
        satellite: satelliteConfig
      }
    });

  const {files: sourceFiles, sourceAbsolutePath} = await prepareDeploy({
    config: satelliteConfig,
    listAssets: listExistingAssets,
    assertSourceDirExists
  });

  if (sourceFiles.length === 0) {
    console.log('No new files to upload.');
    return;
  }

  await assertSatelliteMemorySize(args);

  const satellite = satelliteParameters({satellite: satelliteConfig, env});

  const fileDetailsPath = (file: FileDetails): string => file.alternateFile ?? file.file;

  const upload = async (file: FileDetails): Promise<AssetKey> => {
    const filePath = fileDetailsPath(file);

    return await uploadBlob({
      satellite,
      filename: basename(filePath),
      fullPath: fullPath({file: filePath, sourceAbsolutePath}),
      // @ts-expect-error type incompatibility NodeJS vs bundle
      data: new Blob([await readFile(file.file)]),
      collection: COLLECTION_DAPP,
      headers: [
        ...(file.mime === undefined
          ? []
          : ([['Content-Type', file.mime]] as Array<[string, string]>))
      ],
      encoding: file.encoding
    });
  };

  const uploadFiles = async (groupFiles: FileDetails[]) => {
    // Execute upload UPLOAD_BATCH_SIZE files at a time max preventively to not stress too much the network
    for (let i = 0; i < groupFiles.length; i += UPLOAD_BATCH_SIZE) {
      const files = groupFiles.slice(i, i + UPLOAD_BATCH_SIZE);

      const tasks = new Listr<AssetKey>(
        files.map((file) => ({
          title: `Uploading ${relative(sourceAbsolutePath, file.file)}`,
          task: async () => await upload(file)
        })),
        {concurrent: true}
      );

      await tasks.run();
    }
  };

  // TODO: temporary possible race condition fix until Satellite v0.0.13 is published
  // We must upload the alternative path first to ensure . Friday Oct. 10 2023 I got unexpected race condition while uploading the Astro sample example (file hoisted.8961d9b1.js).
  await uploadFiles(sourceFiles.filter(({alternateFile}) => nonNullish(alternateFile)));
  await uploadFiles(sourceFiles.filter(({alternateFile}) => isNullish(alternateFile)));

  console.log(`\n🚀 Deploy complete!`);
};

const assertSourceDirExists = (source: string) => {
  try {
    lstatSync(source);
  } catch (err: unknown) {
    console.log(
      `${red(
        'Cannot proceed deployment.'
      )}\nAre you sure the folder containing your built app (the "source" tag in the configuration file for Juno) files is correctly configured, or have you built your app?`
    );
    process.exit(1);
  }
};
