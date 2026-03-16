import type {EmulatorConfig, EmulatorConsole, EmulatorRunner} from '@junobuild/config';

export type EmulatorType = 'skylab' | 'satellite' | 'console';

export type EmulatorRunnerType = EmulatorRunner['type'];

export type EmulatorConfigWithoutConsole = Exclude<EmulatorConfig, {console: EmulatorConsole}>;

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type EmulatorImage = `junobuild/${EmulatorType}:latest` | string;

export interface CliEmulatorDerivedConfig {
  containerName: string;
  runner: EmulatorRunnerType;
  emulatorType: EmulatorType;
  targetDeploy: string;
  extraHosts: string[];
  image: EmulatorImage;
}

export interface CliEmulatorConfig {
  config: EmulatorConfig;
  derivedConfig: CliEmulatorDerivedConfig;
}
