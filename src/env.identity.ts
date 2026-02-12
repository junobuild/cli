import {nonNullish} from '@dfinity/utils';
import type {JsonnableEd25519KeyIdentity} from '@icp-sdk/core/identity';

export class EnvIdentity {
  static #instance: EnvIdentity | undefined;

  readonly #identity: JsonnableEd25519KeyIdentity | undefined;

  private constructor(readonly token: JsonnableEd25519KeyIdentity | undefined) {
    this.#identity = token;
  }

  static async getInstance(): Promise<EnvIdentity> {
    if (EnvIdentity.#instance === undefined) {
      // eslint-disable-next-line require-atomic-updates
      EnvIdentity.#instance = await EnvIdentity.#init();
    }

    return EnvIdentity.#instance;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  static async #init(): Promise<EnvIdentity> {
    const envToken = process.env.JUNO_TOKEN;

    if (envToken !== undefined) {
      const token = this.#parseToken({envToken});
      return new EnvIdentity(token);
    }

    return new EnvIdentity(undefined);
  }

  static #parseToken({envToken}: {envToken: string}): JsonnableEd25519KeyIdentity | undefined {
    try {
      const {token} = JSON.parse(atob(envToken));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return token;
    } catch (err: unknown) {
      throw new Error('Cannot parse token provided as an environment variable.', {
        cause: err
      });
    }
  }

  get identity(): JsonnableEd25519KeyIdentity | undefined {
    return this.#identity;
  }

  hasCredentials = (): boolean => {
    return nonNullish(this.#identity);
  };
}
