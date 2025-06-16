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
