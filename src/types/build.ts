export type BuildLang = 'ts' | 'mjs' | 'rs';

export interface BuildArgs {
  lang?: BuildLang;
  path?: string | undefined;
  watch?: boolean | string;
}
