import {Ed25519KeyIdentity} from '@dfinity/identity';
import {isNullish} from '@dfinity/utils';
import {green} from 'kleur';
import {getToken, getUse, isDefaultProfile} from '../configs/cli.config';
import {links} from '../services/links.services';

export const whoami = async (args?: string[]) => {
  const {success} = await info();

  if (!success) {
    return;
  }

  await links(args);
};

const info = async (): Promise<{success: boolean}> => {
  const profile = await getUse();

  if (!isDefaultProfile(profile)) {
    console.log(`👤 Profile: ${green(profile!)}`);
  }

  const token = await getToken();

  if (isNullish(token)) {
    console.log(`No controller found.`);
    return {success: false};
  }

  const identity = Ed25519KeyIdentity.fromParsedJson(token);
  console.log(`🔐 Controller: ${green(identity.getPrincipal().toText())}`);

  return {success: true};
};
