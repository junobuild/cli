import type {PackageJson} from '@junobuild/cli-tools';

export type BuildLang = 'ts' | 'mjs' | 'rs';

export interface BuildPaths {
  cargo?: string | undefined;
  source?: string | undefined;
}

export interface BuildArgs {
  lang?: BuildLang;
  paths?: BuildPaths;
  watch?: boolean | string;
  exitOnError?: boolean;
}

export type BuildType =
  | {build: 'legacy'}
  | {
      build: 'modern';
      version: string;
      satelliteVersion: string;
      sputnikVersion?: string | undefined;
    };

export type BuildMetadata = Omit<PackageJson, 'dependencies'> | undefined;