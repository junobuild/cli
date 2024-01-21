import {magenta, yellow} from 'kleur';
import {IC_WASM_MIN_VERSION} from '../constants/constants';
import {execute} from '../utils/cmd.utils';
import {checkIcWasmVersion} from '../utils/env.utils';
import {confirmAndExit} from '../utils/prompt.utils';

export const build = async () => {
  const {valid} = await checkIcWasmVersion();

  if (valid === false) {
    return;
  }

  if (valid === 'error') {
    await confirmAndExit(
      `The ${magenta('ic-wasm')} ${yellow(
        `v${IC_WASM_MIN_VERSION}`
      )} tool is required to build a satellite but appears to be not available. Would you like to install it on your machine?`
    );

    await execute({
      command: 'cargo',
      args: ['install', `ic-wasm@${IC_WASM_MIN_VERSION}`]
    });
  }

  await execute({
    command: 'cargo',
    args: [
      'build',
      '--target',
      'wasm32-unknown-unknown',
      '-p',
      'satellite',
      '--release',
      '--locked'
    ]
  });
};
