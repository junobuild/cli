import terminalLinkLib from 'terminal-link';

const fallback = (_text: string, url: string) => `${url}`;

export const terminalLink = (url: string) => terminalLinkLib(url, url, {fallback});
