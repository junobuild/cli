import type {EmulatorRunner} from '@junobuild/config';

export interface ContainerRunner {
  containerName: string;
  runner: EmulatorRunner['type'];
}
