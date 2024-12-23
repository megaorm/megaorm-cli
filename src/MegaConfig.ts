import { Config, ConfigError } from '@megaorm/config';
import { isBool, isChildOf, isObj, isStr } from '@megaorm/test';
import { MegaCluster } from '@megaorm/cluster';

/**
 * Represents TypeScript-specific configuration options.
 */
interface TypeScript {
  /**
   * Indicates whether TypeScript is used.
   */
  enabled: boolean;

  /**
   * Name of the source folder for TypeScript files.
   * default folder name is `src`.
   */
  src?: string;

  /**
   * Name of the distribution folder for compiled files.
   * default folder name is `dist`.
   */
  dist?: string;
}

/**
 * Defines folder paths used in MegaORM project.
 */
interface Paths {
  /**
   * Path to the generator files folder.
   * default name is `generators`.
   */
  generators?: string;

  /**
   * Path to the seeder files folder.
   * default folder name is `seeders`.
   */
  seeders?: string;

  /**
   * Path to the model files folder.
   * default folder name is `models`.
   */
  models?: string;

  /**
   * Path to the command files folder.
   * default folder name is `commands`.
   */
  commands?: string;
}

/**
 * Interface for configuring MegaORM system.
 */
export interface MegaORMConfig {
  /**
   * The default pool name from which connections will be requested.
   */
  default: string;

  /**
   * The cluster instance responsible for managing database connections.
   */
  cluster: MegaCluster;

  /**
   * Configuration for folder paths used in the project.
   * These paths can be relative or absolute:
   * - If a **relative path** is provided:
   *   - For JavaScript projects: Resolved relative to the root folder.
   *   - For TypeScript projects: Resolved relative to `root/src` `root/dist` or a custom folder if specified.
   * - If an **absolute path** is provided, it will be used as-is.
   */
  paths?: Paths;

  /**
   * TypeScript configuration for MegaORM TypeScript projects.
   */
  typescript?: TypeScript;

  /**
   * Allows additional custom properties to be added to the configuration.
   */
  [key: string]: any;
}

/**
 * MegaConfig is a specialized configuration manager for the MegaORM system.
 * It handles validation and defaulting for various configuration properties,
 * including paths, TypeScript settings, and cluster details.
 *
 * The configuration includes:
 * - Paths to project folders such as models, seeders, and commands.
 * - Support for TypeScript projects with optional source and distribution folder configuration.
 * - Integration with a `MegaCluster` instance for managing database connections.
 *
 * Default configurations are applied where necessary, and detailed error messages
 * are provided for invalid or missing configurations.
 */
export class MegaConfig extends Config {
  /**
   * The default name of the configuration file.
   */
  protected static file: string = 'mega.config.js';
}

/**
 * Ensures the configuration is an object before proceeding.
 */
MegaConfig.register((config: MegaORMConfig) => {
  if (!isObj(config)) {
    throw new ConfigError(
      `Invalid config: Expected an object but received ${typeof config}.`
    );
  }
  return config;
});

/**
 * Ensures that `config.cluster` is an instance of `MegaCluster`.
 */
MegaConfig.register((config: MegaORMConfig) => {
  if (!isChildOf(config.cluster, MegaCluster)) {
    throw new ConfigError(
      `Invalid config.cluster: Expected an instance of MegaCluster but received ${typeof config.cluster}.`
    );
  }
  return config;
});

/**
 * Ensures that `config.default` is a string.
 */
MegaConfig.register((config: MegaORMConfig) => {
  if (!isStr(config.default)) {
    throw new ConfigError(
      `Invalid config.default: Expected a valid default pool name but received ${typeof config.default}.`
    );
  }
  return config;
});

/**
 * Ensures `config.paths` is an object.
 */
MegaConfig.register((config: MegaORMConfig) => {
  if (!isObj(config.paths)) config.paths = {};

  return config;
});

/**
 * Set default values for the `paths` property in the configuration.
 */
MegaConfig.register((config: MegaORMConfig) => {
  if (!isStr(config.paths.models)) config.paths.models = 'models';
  if (!isStr(config.paths.seeders)) config.paths.seeders = 'seeders';
  if (!isStr(config.paths.commands)) config.paths.commands = 'commands';
  if (!isStr(config.paths.generators)) config.paths.generators = 'generators';

  return config;
});

/**
 * Ensures `config.typescript` is an object.
 */
MegaConfig.register((config: MegaORMConfig) => {
  if (!isObj(config.typescript)) config.typescript = {} as any;

  return config;
});

/**
 * Set default values for the `typescript` property in the configuration.
 */
MegaConfig.register((config: MegaORMConfig) => {
  if (!isBool(config.typescript.enabled)) config.typescript.enabled = false;
  if (!isStr(config.typescript.src)) config.typescript.src = 'src';
  if (!isStr(config.typescript.dist)) config.typescript.dist = 'dist';

  return config;
});
