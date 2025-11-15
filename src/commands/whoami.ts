import {isNullish, nonNullish} from '@dfinity/utils';
import {Ed25519KeyIdentity} from '@icp-sdk/core/identity';
import {green} from 'kleur';
import {getToken} from '../configs/cli.config';
import {ENV} from '../env';
import {links} from '../services/links.services';

export const whoami = async () => {
  const {success} = await info();

  if (!success) {
    return;
  }

  await links();
};

const info = async (): Promise<{success: boolean}> => {
  if (nonNullish(ENV.profile)) {
    console.log(`👤 Profile: ${ENV.profile}`);
  }

  const token = await getToken();

  if (isNullish(token)) {
    console.log(`No access key found.`);
    return {success: false};
  }

  const identity = Ed25519KeyIdentity.fromParsedJson(token);
  console.log(`🔐 Access key: ${green(identity.getPrincipal().toText())}`);

  return {success: true};
};
