import { SeederHandler } from '../handlers/SeederHandler';
import { MegaBuilder } from '@megaorm/builder';
import { MegaCommand, MegaCommandError } from '../MegaCommand';
import { MegaORMConfig, MegaConfig } from '../MegaConfig';
import { isAbsolute, join, resolve as resolver } from 'path';

/**
 * Represents a command to execute all seeder files in the project's seeders folder in order.
 *
 * The command performs the following actions:
 * - Resolves the path to the seeders folder based on the configuration.
 * - Identifies all seeder files in the folder.
 * - Executes each seeder file in the correct order to populate tables with data.
 *
 * This ensures that the seeding process is orderly and consistent, allowing for the initialization
 * or population of database tables as defined by the seeder files.
 *
 * @extends MegaCommand
 */
export class SeedCommand extends MegaCommand {
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
   * Executes the command to process and run all seeder files.
   *
   * The command identifies all seeder files in the folder and executes them
   * in the correct order to seed the database tables with data.
   *
   * @returns A promise that resolves when all seeder files have been executed successfully
   * or rejects with an error if any of the seeders fail.
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
            .then((handler) => handler.seed(p, t as string | undefined))
            .then((message) => resolve(this.success(message)))
            .catch(reject);
        })
        .catch(reject);
    });
  }
}
