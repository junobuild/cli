import {isNullish} from '@dfinity/utils';
import {listRules} from '@junobuild/admin';
import {deployToCollection} from '@junobuild/cli-tools';
import type {EncodingType} from '@junobuild/config';
import {uploadBlob} from '@junobuild/core';
import {red, yellow, green, cyan} from 'kleur';
import {lstatSync} from 'node:fs';
import type {Asset} from '@junobuild/core';
import {noJunoConfig} from '../../configs/juno.config';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {assertConfigAndLoadSatelliteContext} from '../../utils/juno.config.utils';
import {consoleNoConfigFound} from '../../utils/msg.utils';
import {assertSatelliteMemorySize} from '../assert.services';
import {parseBatchSize} from '../assets/_args.services';
import {listAssetsForCollection} from './list.services';

export const deployStorage = async (args?: string[]) => {
  if (await noJunoConfig()) {
    consoleNoConfigFound();
    return;
  }

  const {satellite, satelliteConfig} = await assertConfigAndLoadSatelliteContext();
  const deployMappings = satelliteConfig.deploy;

  if (isNullish(deployMappings) || deployMappings.length === 0) {
    console.log(
      `${yellow('No storage deploy mappings found.')} Add a ${cyan('"deploy"')} section to your Juno configuration.`
    );
    console.log('');
    console.log('Example:');
    console.log('  deploy: [');
    console.log('    { source: "storage/audio", collection: "audio" },');
    console.log('    { source: "storage/images", collection: "images" }');
    console.log('  ]');
    return;
  }

  // Verify all target collections exist before uploading
  const existingRules = await listRules({type: 'storage', satellite});
  const existingCollections = new Set(existingRules.items.map((r) => r.collection));

  const missingCollections = deployMappings.filter(
    ({collection}) => !existingCollections.has(collection)
  );

  if (missingCollections.length > 0) {
    const names = missingCollections.map(({collection}) => `"${collection}"`).join(', ');
    console.log(
      `${red('Cannot proceed with storage deploy.')} The following storage collection${missingCollections.length > 1 ? 's do' : ' does'} not exist: ${names}.`
    );
    console.log('');
    console.log(
      `Run ${green('juno config apply')} first to create the missing collection${missingCollections.length > 1 ? 's' : ''}.`
    );
    process.exit(1);
  }

  const {value: uploadBatchSize} = parseBatchSize(args);

  for (const mapping of deployMappings) {
    await deployCollectionFromMapping({
      mapping,
      satellite,
      uploadBatchSize
    });
  }

  console.log('');
  console.log(`${green('✔')} Storage deploy complete.`);
};

const deployCollectionFromMapping = async ({
  mapping: {source, collection},
  satellite,
  uploadBatchSize
}: {
  mapping: {source: string; collection: string};
  satellite: SatelliteParametersWithId;
  uploadBatchSize?: number;
}) => {
  console.log(`\n📦 ${cyan(source)} → collection ${green(`"${collection}"`)}`);

  const listExistingAssets = async ({startAfter}: {startAfter?: string}): Promise<Asset[]> =>
    await listAssetsForCollection({
      startAfter,
      satellite,
      collection
    });

  const assertMemory = async () => {
    await assertSatelliteMemorySize();
  };

  const uploadFn = async ({
    filename,
    fullPath,
    data,
    headers,
    encoding
  }: {
    filename: string;
    fullPath?: string;
    data: Blob;
    collection: string;
    headers?: Array<[string, string]>;
    encoding?: EncodingType;
  }) => {
    await uploadBlob({
      satellite,
      filename,
      fullPath,
      data,
      collection,
      headers,
      encoding
    });
  };

  await deployToCollection({
    params: {
      config: {source},
      listAssets: listExistingAssets,
      assertSourceDirExists,
      assertMemory,
      uploadBatchSize
    },
    upload: {uploadFile: uploadFn},
    collection
  });
};

const assertSourceDirExists = (source: string) => {
  try {
    lstatSync(source);
  } catch (_err: unknown) {
    console.log(
      `${red('Cannot proceed with storage deploy.')} Source directory "${source}" does not exist or is not accessible.`
    );
    process.exit(1);
  }
};
