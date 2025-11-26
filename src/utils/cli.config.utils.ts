import {nonNullish} from '@dfinity/utils';
import Conf from 'conf';
import envPaths from 'env-paths';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {getCliOrbiters, getCliSatellites} from '../configs/cli.config';
import {CONFIG_OPTIONS} from '../constants/config.constants';
import type {CliConfig} from '../types/cli.config';

export const loadConfig = (encryptionKey: string | undefined): Conf<CliConfig> => {
  return new Conf<CliConfig>({
    ...CONFIG_OPTIONS,
    ...(nonNullish(encryptionKey) && {encryptionKey})
  });
};

// A copy of the Conf constructor logic to build the path of the configuration file.
// Useful for checking if the file actually exists without loading the config,
// since loading an encrypted file without providing its password throws an exception.
const configPath = (): string => {
  const {projectName, projectSuffix, fileExtension: fileExt, configName} = CONFIG_OPTIONS;

  // Source: https://github.com/sindresorhus/conf/blob/184fc278736dee34c44d4e7fa7e1b2a16ffdd5be/source/index.ts#L80
  const cwd = envPaths(projectName, {suffix: projectSuffix}).config;

  // Source: https://github.com/sindresorhus/conf/blob/184fc278736dee34c44d4e7fa7e1b2a16ffdd5be/source/index.ts#L128
  const fileExtension = nonNullish(fileExt) ? `.${fileExt}` : '';

  return resolve(cwd, `${configName}${fileExtension}`);
};

export const configFileExists = (): boolean => existsSync(configPath());

export const noConfigFile = (): boolean => !configFileExists();

/**
 * For display purpose, use either the name or id. Most probably we should find a name but for simplicity reason we fallback to Id.
 * @param satelliteId name or id
 */
export const satelliteKey = async (satelliteId: string): Promise<string> => {
  const satellites = await getCliSatellites();
  const satellite = satellites.find(({p}) => p === satelliteId);
  return satellite?.n ?? satelliteId;
};

export const orbiterKey = async (orbiterId: string): Promise<string> => {
  const orbiters = await getCliOrbiters();
  const orbiter = orbiters?.find(({p}) => p === orbiterId);
  return orbiter?.n !== undefined && orbiter.n !== '' ? orbiter.n : orbiterId;
};
