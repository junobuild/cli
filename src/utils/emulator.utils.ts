/**
 * Joins a `[hostname, destination]` tuple into the `"hostname:destination"` string
 * expected by Docker's `--add-host` flag.
 *
 * @example
 * joinExtraHost(['host.docker.internal', 'host-gateway'])
 * // => 'host.docker.internal:host-gateway'
 */
export const joinExtraHost = ([hostname, destination]: [string, string]): string =>
  `${hostname}:${destination}`;

/**
 * Maps an array of `[hostname, destination]` tuples (from the emulator config's
 * `extraHosts` field) into `"hostname:destination"` strings for use with Docker's
 * `--add-host` flag.
 */
export const mapExtraHosts = (extraHosts: Array<[string, string]> | undefined): string[] =>
  (extraHosts ?? []).map(joinExtraHost);
