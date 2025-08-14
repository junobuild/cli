import type {
  DeployParams,
  DeployResult,
  DeployResultWithProposal,
  UploadFile,
  UploadFileStorage
} from '@junobuild/cli-tools';
import type {OnUploadProgress} from '@junobuild/storage';
import type {SatelliteParametersWithId} from './satellite';

export interface DeployOptions {
  deprecatedGzip?: string;
  uploadBatchSize: number | undefined;
}

export interface DeployFnParams<T = UploadFile> {
  deploy: {params: DeployParams; upload: T};
  satellite: SatelliteParametersWithId;
}

export type UploadFileFnParams = UploadFileStorage & {satellite: SatelliteParametersWithId};
export type UploadFileFnParamsWithProposal = UploadFileFnParams & {
  proposalId: bigint;
} & OnUploadProgress;

export type UploadFilesFnParams = {
  files: UploadFileStorage[];
  satellite: SatelliteParametersWithId;
} & OnUploadProgress;
export type UploadFilesFnParamsWithProposal = UploadFilesFnParams & {proposalId: bigint};

export type UploadInput<T, R> = [R] extends [DeployResultWithProposal]
  ? T & {proposalId: bigint}
  : T;

export type UploadParams<T, R> = UploadInput<T, R> & {
  satellite: SatelliteParametersWithId;
};

export type UploadFn<
  P extends UploadFileStorage,
  R extends DeployResult | DeployResultWithProposal
> =
  | {
      method: 'individual';
      deployFn: (
        params: DeployFnParams<(params: UploadInput<P, R>) => Promise<void>>
      ) => Promise<R>;
      uploadFn: (params: UploadParams<P, R>) => Promise<void>;
    }
  | {
      method: 'batch';
      deployFn: (
        params: DeployFnParams<(params: UploadInput<{files: P[]}, R>) => Promise<void>>
      ) => Promise<R>;
      uploadFn: (params: UploadParams<{files: P[]}, R>) => Promise<void>;
    };
