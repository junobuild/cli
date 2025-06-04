import {isNullish} from '@dfinity/utils';
import {uploadAssetWithProposal} from '@junobuild/cdn';
import {
  type DeployResultWithProposal,
  deploySatelliteWasmWithProposal,
  type FilePaths,
  hasArgs,
  nextArg,
  type UploadFileStorageWithProposal
} from '@junobuild/cli-tools';
import {red} from 'kleur';
import {dirname} from 'node:path';
import {SATELLITE_OUTPUT} from '../../constants/dev.constants';
import {CDN_RELEASES_FULL_PATH} from '../../constants/functions.constants';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';
import {readWasmFileMetadata} from '../../utils/wasm.utils';
import {assertSatelliteMemorySize} from '../assets/deploy/deploy.assert.services';
import {type UploadFileFnParamsWithProposal} from '../assets/deploy/deploy.execute.services';
import {clearProposalStagedAssets} from '../changes/changes.clear.services';

export const publish = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

  const srcArgs = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});
  const src = srcArgs ?? `${SATELLITE_OUTPUT}.gz`;

  await deployWasmWithProposal({
    args,
    src,
    satellite
  });
};

interface UpgradeFunctionsParams {
  src: string;
  satellite: SatelliteParametersWithId;
  args?: string[];
}

const deployWasmWithProposal = async ({
  args,
  src,
  satellite
}: UpgradeFunctionsParams): Promise<DeployResultWithProposal | {result: 'error'}> => {
  const {junoPackage, gzipped} = await readWasmFileMetadata({path: src});

  if (isNullish(junoPackage)) {
    console.log(red('No Juno Package metadata detected.'));
    console.log('Are you using the latest libraries and tooling?');
    return {result: 'error'};
  }

  const {version} = junoPackage;

  if (!gzipped) {
    console.log(red('The submitted WASM file must be gzipped.'));
    return {result: 'error'};
  }

  const fullPath = `${CDN_RELEASES_FULL_PATH}/satellite-${crypto.randomUUID()}.wasm.gz`;

  const result = await uploadWasmWithProposal({
    satellite,
    version,
    args,
    filePath: src,
    fullPath
  });

  if (result.result !== 'deployed') {
    return result;
  }

  const {proposalId} = result;

  await clearProposalStagedAssets({
    args,
    proposalId
  });

  return result;
};

const uploadWasmWithProposal = async ({
  args,
  satellite,
  fullPath,
  filePath,
  version
}: Omit<UpgradeFunctionsParams, 'src'> &
  FilePaths & {version: string}): Promise<DeployResultWithProposal> => {
  const noCommit = hasArgs({args, options: ['-na', '--no-apply']});

  const uploadFileFn = async ({
    fullPath: storagePath,
    headers = [],
    satellite,
    proposalId,
    data,
    ...restAsset
  }: UploadFileFnParamsWithProposal) => {
    await uploadAssetWithProposal({
      cdn: {satellite},
      proposalId,
      asset: {
        ...restAsset,
        // @ts-expect-error type incompatibility NodeJS vs bundle
        data,
        fullPath: storagePath ?? fullPath,
        headers,
        token: crypto.randomUUID(),
        description: `change=${proposalId};version=${version}`
      }
    });
  };

  const uploadFile = async (params: UploadFileStorageWithProposal) => {
    const paramsWithSatellite: UploadFileStorageWithProposal & {
      satellite: SatelliteParametersWithId;
    } = {
      ...params,
      satellite
    };

    await uploadFileFn(paramsWithSatellite);
  };

  const assertMemory = async () => {
    await assertSatelliteMemorySize(args);
  };

  const sourceAbsolutePath = dirname(filePath);

  return await deploySatelliteWasmWithProposal({
    deploy: {
      uploadFile,
      fullPath,
      filePath,
      sourceAbsolutePath,
      assertMemory
    },
    proposal: {
      autoCommit: !noCommit,
      cdn: {
        satellite
      },
      version
    }
  });
};
