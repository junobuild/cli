export interface PackageJson {
  dependencies?: Record<string, string>;
  version?: string;
  juno?: PackageJsonJuno;
}

export interface PackageJsonJuno {
  functions?: PackageJsonJunoFunctions;
}

export interface PackageJsonJunoFunctions {
  version?: string;
}
