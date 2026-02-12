import {nonNullish} from '@dfinity/utils';
import type {JsonnableEd25519KeyIdentity} from '@icp-sdk/core/identity';

export class EnvToken {
  static #instance: EnvToken | undefined;

  readonly #token: JsonnableEd25519KeyIdentity | undefined;

  private constructor(readonly keyIdentity: JsonnableEd25519KeyIdentity | undefined) {
    this.#token = keyIdentity;
  }

  static async getInstance(): Promise<EnvToken> {
    if (EnvToken.#instance === undefined) {
      // eslint-disable-next-line require-atomic-updates
      EnvToken.#instance = await EnvToken.#init();
    }

    return EnvToken.#instance;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  static async #init(): Promise<EnvToken> {
    const envToken = process.env.JUNO_TOKEN;

    if (envToken !== undefined) {
      const token = this.#parseToken({envToken});
      return new EnvToken(token);
    }

    return new EnvToken(undefined);
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

  get token(): JsonnableEd25519KeyIdentity | undefined {
    return this.#token;
  }

  isDefined = (): boolean => {
    return nonNullish(this.#token);
  };
}
