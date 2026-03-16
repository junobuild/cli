import type {EmulatorConfig, EmulatorConsole, EmulatorRunner} from '@junobuild/config';

export type EmulatorType = 'skylab' | 'satellite' | 'console';

export type EmulatorRunnerType = EmulatorRunner['type'];

export type EmulatorConfigWithoutConsole = Exclude<EmulatorConfig, {console: EmulatorConsole}>;

export interface CliEmulatorDerivedConfig {
  containerName: string;
  runner: EmulatorRunnerType;
  emulatorType: EmulatorType;
  targetDeploy: string;
  /**
   * Additional host-to-IP mappings injected into the container via `--add-host`.
   * Each entry is a `"hostname:destination"` string, derived by joining the
   * `[hostname, destination]` tuples from the emulator config.
   *
   * This is useful for making host-machine services (e.g. a local Ethereum RPC node)
   * reachable from within the container under a stable DNS name such as
   * `host.docker.internal`.
   *
   * @example
   * ```ts
   * // juno.config.ts
   * runner: {
   *   extraHosts: [['host.docker.internal', 'host-gateway']]
   * }
   * // Produces: ['host.docker.internal:host-gateway']
   * ```
   *
   * @see https://docs.docker.com/reference/cli/docker/container/run/#add-host
   */
  extraHosts: string[];
}

export interface CliEmulatorConfig {
  config: EmulatorConfig;
  derivedConfig: CliEmulatorDerivedConfig;
}
