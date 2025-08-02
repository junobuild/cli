import type {EmulatorConfig, EmulatorRunner} from '@junobuild/config';

export type EmulatorType = 'skylab' | 'satellite' | 'console';

export type EmulatorRunnerType = EmulatorRunner['type'];

export interface CliEmulatorDerivedConfig {
  containerName: string;
  runner: EmulatorRunnerType;
  emulatorType: EmulatorType;
  targetDeploy: string;
}

export interface CliEmulatorConfig {
  config: EmulatorConfig;
  derivedConfig: CliEmulatorDerivedConfig;
}
