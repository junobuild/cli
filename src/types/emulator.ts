import type {EmulatorConfig, EmulatorConsole, EmulatorRunner} from '@junobuild/config';

export type EmulatorType = 'skylab' | 'satellite' | 'console';

export type EmulatorRunnerType = EmulatorRunner['type'];

export type EmulatorConfigWithoutConsole = Exclude<EmulatorConfig, {console: EmulatorConsole}>;

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
