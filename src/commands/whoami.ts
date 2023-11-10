import {Ed25519KeyIdentity} from '@dfinity/identity';
import {isNullish} from '@junobuild/utils';
import {green} from 'kleur';
import {getToken, getUse, isDefaultProfile} from '../configs/auth.config';

export const whoami = () => {
  const profile = getUse();

  if (!isDefaultProfile(profile)) {
    console.log(`👤 Profile: ${green(profile!)}`);
  }

  const token = getToken();

  if (isNullish(token)) {
    console.log(`No controller found.`);
    return;
  }

  const identity = Ed25519KeyIdentity.fromParsedJson(token);
  console.log(`🔐 Controller: ${green(identity.getPrincipal().toText())}`);
};
