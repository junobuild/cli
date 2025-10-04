import type {PrincipalText} from '@dfinity/zod-schemas';
import {execute} from '@junobuild/cli-tools';
import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {TestPage} from './_page';

const DEV = (process.env.NODE_ENV ?? 'production') === 'development';

const JUNO_CONFIG = join(process.cwd(), 'juno.config.ts');

const JUNO_TEST_ARGS = ['--mode', 'development', '--headless'];

const {command: JUNO_CMD, args: JUNO_CDM_ARGS} = DEV
  ? {command: 'node', args: ['dist/index.js']}
  : {command: 'juno', args: []};

const buildArgs = (args: string[]): string[] => [...JUNO_CDM_ARGS, ...args, ...JUNO_TEST_ARGS];

export interface CliPageParams {
  satelliteId: PrincipalText;
}

export class CliPage extends TestPage {
  readonly #satelliteId: PrincipalText;

  private constructor({satelliteId}: CliPageParams) {
    super();

    this.#satelliteId = satelliteId;
  }

  static async initWithEmulatorLogin(params: CliPageParams): Promise<CliPage> {
    const cliPage = new CliPage(params);

    await cliPage.initConfig();

    await cliPage.loginWithEmulator();

    await cliPage.applyConfig();

    return cliPage;
  }

  protected async initConfig(): Promise<void> {
    let content = await readFile(JUNO_CONFIG, 'utf-8');
    content = content.replace('<DEV_SATELLITE_ID>', this.#satelliteId);
    await writeFile(JUNO_CONFIG, content, 'utf-8');
  }

  private async revertConfig(): Promise<void> {
    let content = await readFile(JUNO_CONFIG, 'utf-8');
    content = content.replace(this.#satelliteId, '<DEV_SATELLITE_ID>');
    await writeFile(JUNO_CONFIG, content, 'utf-8');
  }

  protected async loginWithEmulator(): Promise<void> {
    await execute({
      command: JUNO_CMD,
      args: buildArgs(['login', '--emulator'])
    });
  }

  async applyConfig(): Promise<void> {
    await execute({
      command: JUNO_CMD,
      args: buildArgs(['config', 'apply'])
    });
  }

  private async logout(): Promise<void> {
    await execute({
      command: JUNO_CMD,
      args: buildArgs(['logout'])
    });
  }

  async clearHosting(): Promise<void> {
    await execute({
      command: JUNO_CMD,
      args: buildArgs(['hosting', 'clear'])
    });
  }

  async createSnapshot({
    target
  }: {
    target: 'satellite' | 'orbiter' | 'mission-control';
  }): Promise<void> {
    await execute({
      command: JUNO_CMD,
      args: buildArgs([
        ...JUNO_CDM_ARGS,
        'snapshot',
        'create',
        '--target',
        target,
        ...JUNO_TEST_ARGS
      ])
    });
  }

  /**
   * @override
   */
  async close(): Promise<void> {
    await this.revertConfig();
    await this.logout();
  }
}
