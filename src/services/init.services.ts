import prompts from 'prompts';
import {assertAnswerCtrlC} from '../commands/init';
import type {ConfigType} from '../types/config';

export const promptConfigType = async (): Promise<ConfigType> => {
  const {configType}: {configType: ConfigType} = await prompts({
    type: 'select',
    name: 'configType',
    message: 'What configuration file format do you prefer?',
    choices: [
      {title: 'TypeScript', value: 'ts'},
      {title: 'JavaScript', value: 'js'},
      {title: 'JSON', value: 'json'}
    ],
    initial: 0
  });

  // In case of control+c
  assertAnswerCtrlC(configType);

  return configType;
};
