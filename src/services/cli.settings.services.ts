import {assertAnswerCtrlC} from '@junobuild/cli-tools';
import prompts from 'prompts';

export const askForPassword = async (
  message = 'Please provide the password for your CLI configuration.'
): Promise<string> => {
  const {encryptionKey}: {encryptionKey: string} = await prompts([
    {
      type: 'password',
      name: 'encryptionKey',
      message
    }
  ]);

  assertAnswerCtrlC(encryptionKey);

  return encryptionKey;
};
