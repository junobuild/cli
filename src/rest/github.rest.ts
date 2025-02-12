import {GITHUB_API_CLI_URL} from '../constants/constants';

export interface GitHubAsset {
  url: string; // 'https://api.github.com/repos/peterpeterparker/dummy/releases/assets/91555492'
  id: number;
  name: string; // 'mission_control.wasm'
  content_type: string; // 'application/wasm'
  state: string; // 'uploaded'
  size: number;
  download_count: number;
  created_at: string; // '2023-01-13T12:04:31Z'
  updated_at: string; // '2023-01-13T12:04:31Z'
  browser_download_url: string; // 'https://github.com/peterpeterparker/dummy/releases/download/v0.1.2/mission_control.wasm'
}

export interface GitHubRelease {
  url: string; // 'https://api.github.com/repos/peterpeterparker/dummy/releases/88841011',
  assets_url: string; // 'https://api.github.com/repos/peterpeterparker/dummy/releases/88841011/assets',
  upload_url: string; // 'https://uploads.github.com/repos/peterpeterparker/dummy/releases/88841011/assets{?name,label}',
  html_url: string; // 'https://github.com/peterpeterparker/dummy/releases/tag/v0.1.2',
  id: number;
  tag_name: string;
  assets: GitHubAsset[] | undefined;
  draft: boolean;
  prerelease: boolean;
  target_commitish: string; //  'main',
  created_at: string; // '2023-01-13T08:29:24Z',
  published_at: string; // '2023-01-13T12:04:36Z',
  tarball_url: string; // 'https://api.github.com/repos/peterpeterparker/dummy/tarball/v0.1.2',
  zipball_url: string; // 'https://api.github.com/repos/peterpeterparker/dummy/zipball/v0.1.2',
  body: string;
}

const GITHUB_API_HEADERS: RequestInit = {
  headers: {
    accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
};

const githubLastRelease = async (apiUrl: string): Promise<GitHubRelease | undefined> => {
  const response = await fetch(`${apiUrl}/releases/latest`, GITHUB_API_HEADERS);

  if (!response.ok) {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await response.json();
};

export const githubCliLastRelease = async (): Promise<GitHubRelease | undefined> =>
  await githubLastRelease(GITHUB_API_CLI_URL);
