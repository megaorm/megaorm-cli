import { GeneratorHandler } from '../handlers/GeneratorHandler';
import { MegaBuilder } from '@megaorm/builder';
import { MegaCommand, MegaCommandError } from '../MegaCommand';
import { MegaORMConfig, MegaConfig } from '../MegaConfig';
import { isAbsolute, join, resolve as resolver } from 'path';

/**
 * Represents a command to drop all tables associated with generator files.
 *
 * The command performs the following actions:
 * - Resolves the path to the generators folder based on the configuration.
 * - Drops all tables associated with the generator files.
 *
 * This ensures that the database is cleared of any generator-created tables,
 * making it easy to reset or reinitialize the database schema.
 *
 * @extends MegaCommand
 */
export class ResetCommand extends MegaCommand {
  /**
   * Resolves the appropriate path for the generators folder based on the configuration.
   *
   * @param config The MegaORM configuration object.
   * @returns The resolved path for the generators folder.
   * @throws `MegaCommandError` if `paths.generators` is absolute and TypeScript is enabled.
   */
  private static path(config: MegaORMConfig): string {
    if (config.typescript.enabled === true) {
      // Cannot be absolute
      if (isAbsolute(config.paths.generators)) {
        throw new MegaCommandError(
          `paths.generators cannot be absolute if typescript is enabled`
        );
      }

      if (isAbsolute(config.typescript.dist)) {
        return join(config.typescript.dist, config.paths.generators);
      }

      return resolver(
        MegaConfig.resolveSync(),
        config.typescript.dist,
        config.paths.generators
      );
    }

    if (isAbsolute(config.paths.generators)) {
      return config.paths.generators;
    }

    return resolver(MegaConfig.resolveSync(), config.paths.generators);
  }

  /**
   * Executes the command to reset the database by dropping all tables associated with generators.
   *
   * The command ensures that all generator-related tables are dropped, providing a fresh start.
   * This can be useful during development or testing when a clean database state is required.
   *
   * @returns A promise that resolves when the tables have been successfully dropped
   * or rejects with an error if the operation fails.
   */
  public static exec() {
    return new Promise((resolve, reject) => {
      MegaConfig.load()
        .then((config: MegaORMConfig) => {
          const p = this.path(config);

          MegaConfig.exist(p)
            .then(() => config.cluster.request(config.default))
            .then((con) => Promise.resolve(new MegaBuilder(con)))
            .then((builder) => Promise.resolve(new GeneratorHandler(builder)))
            .then((handler) => handler.reset(p))
            .then((message) => resolve(this.success(message)))
            .catch(reject);
        })
        .catch(reject);
    });
  }
}
