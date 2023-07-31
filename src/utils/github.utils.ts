import {githubLastRelease, type GitHubRelease} from '@junobuild/admin';

const GITHUB_API_CLI_URL = 'https://api.github.com/repos/buildwithjuno/cli';

export const githubCliLastRelease = (): Promise<GitHubRelease | undefined> =>
  githubLastRelease(GITHUB_API_CLI_URL);
