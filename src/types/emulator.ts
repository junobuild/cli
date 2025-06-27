import type {EmulatorConfig, EmulatorRunner} from '@junobuild/config';

export interface CliEmulatorDerivedConfig {
  containerName: string;
  runner: EmulatorRunner['type'];
  emulatorType: 'skylab' | 'satellite' | 'console';
  targetDeploy: string;
}

export interface CliEmulatorConfig {
  config: EmulatorConfig;
  derivedConfig: CliEmulatorDerivedConfig;
}
