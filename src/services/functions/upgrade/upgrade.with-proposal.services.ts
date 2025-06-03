import {isNullish} from '@dfinity/utils';
import {uploadAssetWithProposal} from '@junobuild/cdn';
import {
  type DeployResultWithProposal,
  deploySatelliteWasmWithProposal,
  type FilePaths,
  hasArgs,
  type UploadFileStorageWithProposal
} from '@junobuild/cli-tools';
import {red} from 'kleur';
import {CDN_RELEASES_FULL_PATH} from '../../../constants/functions.constants';
import {type UpgradeFunctionsParams} from '../../../types/functions';
import type {SatelliteParametersWithId} from '../../../types/satellite';
import {readWasmFileMetadata} from '../../../utils/wasm.utils';
import {assertSatelliteMemorySize} from '../../assets/deploy/deploy.assert.services';
import {type UploadFileFnParamsWithProposal} from '../../assets/deploy/deploy.execute.services';
import {clearProposalStagedAssets} from '../../changes/changes.clear.services';
import {upgradeSatelliteWithSrc} from '../../modules/upgrade/upgrade.satellite.services';

export const upgradeFunctionsWithProposal = async (params: UpgradeFunctionsParams) => {
  const result = await deployWasmWithProposal(params);

  if (result.result !== 'deployed') {
    return;
  }

  console.log('');

  await upgradeSatelliteWithSrc(params);
};

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

  const fullPath = `${CDN_RELEASES_FULL_PATH}/satellite-v${version}-${crypto.randomUUID()}.wasm.gz`;

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
    filename,
    fullPath: storagePath,
    data,
    collection,
    headers = [],
    encoding,
    satellite,
    proposalId
  }: UploadFileFnParamsWithProposal) => {
    await uploadAssetWithProposal({
      cdn: {satellite},
      proposalId,
      asset: {
        filename,
        fullPath: storagePath ?? fullPath,
        // @ts-expect-error type incompatibility NodeJS vs bundle
        data,
        collection,
        headers,
        encoding
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

  return await deploySatelliteWasmWithProposal({
    deploy: {
      uploadFile,
      fullPath,
      filePath,
      token: crypto.randomUUID(),
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
