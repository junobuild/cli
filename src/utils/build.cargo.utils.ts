import {execute} from '@junobuild/cli-tools';
import {magenta, yellow} from 'kleur';
import {IC_WASM_MIN_VERSION} from '../constants/dev.constants';
import {checkIcWasmVersion, checkToolInstalled} from './env.utils';
import {confirmAndExit} from './prompt.utils';

export const checkIcWasm = async (): Promise<{valid: boolean}> => {
  const {valid} = await checkIcWasmVersion();

  if (valid === false) {
    return {valid};
  }

  if (valid === 'error') {
    await confirmAndExit(
      `The ${magenta('ic-wasm')} ${yellow(
        `v${IC_WASM_MIN_VERSION}`
      )} tool is required to build a satellite but appears to be not available. Would you like to install it?`
    );

    await execute({
      command: 'cargo',
      args: ['install', `ic-wasm@${IC_WASM_MIN_VERSION}`]
    });
  }

  return {valid: true};
};

export const checkCandidExtractor = async (): Promise<{valid: boolean}> => {
  const {valid} = await checkToolInstalled({
    command: 'candid-extractor',
    args: ['--version']
  });

  if (valid === false) {
    return {valid};
  }

  if (valid === 'error') {
    await confirmAndExit(
      `The ${magenta(
        'candid-extractor'
      )} tool is required to generate the API ("did file"). Would you like to install it?`
    );

    await execute({
      command: 'cargo',
      args: ['install', 'candid-extractor']
    });
  }

  return {valid: true};
};

export const checkWasi2ic = async (): Promise<{valid: boolean}> => {
  const {valid} = await checkToolInstalled({
    command: 'wasi2ic',
    args: ['--version']
  });

  if (valid === false) {
    return {valid};
  }

  if (valid === 'error') {
    await confirmAndExit(
      `The ${magenta(
        'wasi2ic'
      )} polyfill tool is required to replaces the specific function calls with their corresponding polyfill implementations for the Internet Computer. Would you like to install it?`
    );

    await execute({
      command: 'cargo',
      args: ['install', 'wasi2ic']
    });
  }

  return {valid: true};
};
