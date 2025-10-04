import type {PrincipalText} from '@dfinity/zod-schemas';
import {execute} from '@junobuild/cli-tools';
import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {TestPage} from './_page';

const JUNO_CONFIG = join(process.cwd(), 'juno.config.ts');

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
      command: 'juno',
      args: ['login', '--emulator', '--mode', 'development', '--headless']
    });
  }

  async applyConfig(): Promise<void> {
    await execute({
      command: 'juno',
      args: ['config', 'apply', '--mode', 'development', '--headless']
    });
  }

  private async logout(): Promise<void> {
    await execute({
      command: 'juno',
      args: ['logout']
    });
  }

  async clearHosting(): Promise<void> {
    await execute({
      command: 'juno',
      args: ['hosting', 'clear']
    });
  }

  async createSnapshot(): Promise<void> {
    await execute({
      command: 'juno',
      args: ['snapshot', 'create']
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
