import { SeederHandler } from '../handlers/SeederHandler';
import { MegaBuilder } from '@megaorm/builder';
import { MegaCommand, MegaCommandError } from '../MegaCommand';
import { MegaORMConfig, MegaConfig } from '../MegaConfig';
import { isAbsolute, join, resolve as resolver } from 'path';

/**
 * Represents a command to clear tables using seeder files.
 *
 * The command performs the following actions:
 * - Resolves the path to the seeders folder based on the configuration.
 * - Clears all tables associated with seeder files by default.
 * - Optionally allows specifying a single table to clear instead of all tables.
 *
 * This ensures that seeded data can be efficiently removed while providing flexibility
 * to target specific tables or clear all tables if needed.
 *
 * @extends MegaCommand
 */
export class ClearCommand extends MegaCommand {
  protected static syntax: string = '<? table>';

  /**
   * Resolves the appropriate path for the seeders folder based on the configuration.
   *
   * @param config The MegaORM configuration object.
   * @returns The resolved path for the seeders folder.
   * @throws `MegaCommandError` if `paths.seeders` is absolute and TypeScript is enabled.
   */
  private static path(config: MegaORMConfig): string {
    if (config.typescript.enabled === true) {
      // Cannot be absolute
      if (isAbsolute(config.paths.seeders)) {
        throw new MegaCommandError(
          `paths.seeders cannot be absolute if typescript is enabled`
        );
      }

      if (isAbsolute(config.typescript.dist)) {
        return join(config.typescript.dist, config.paths.seeders);
      }

      return resolver(
        MegaConfig.resolveSync(),
        config.typescript.dist,
        config.paths.seeders
      );
    }

    if (isAbsolute(config.paths.seeders)) {
      return config.paths.seeders;
    }

    return resolver(MegaConfig.resolveSync(), config.paths.seeders);
  }

  /**
   * Executes the command to clear seeded data from tables.
   *
   * The command clears all tables associated with seeder files by default.
   * If a specific table is provided as an argument, only that table will be cleared.
   *
   * @returns A promise that resolves when the table(s) have been successfully cleared
   * or rejects with an error if the clearing operation fails.
   */
  public static exec() {
    return new Promise((resolve, reject) => {
      const t = this.argument('table');

      MegaConfig.load()
        .then((config: MegaORMConfig) => {
          const p = this.path(config);

          MegaConfig.exist(p)
            .then(() => config.cluster.request(config.default))
            .then((con) => Promise.resolve(new MegaBuilder(con)))
            .then((builder) => Promise.resolve(new SeederHandler(builder)))
            .then((handler) => handler.clear(p, t as string | undefined))
            .then((message) => resolve(this.success(message)))
            .catch(reject);
        })
        .catch(reject);
    });
  }
}
