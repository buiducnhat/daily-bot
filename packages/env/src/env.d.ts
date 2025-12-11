/** biome-ignore-all lint/style/useConsistentTypeDefinitions: <> */

interface ImportMetaEnv {
  [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
