import { SeederHandler } from '../handlers/SeederHandler';
import { MegaBuilder } from '@megaorm/builder';
import { MegaCommand, MegaCommandError } from '../MegaCommand';
import { MegaORMConfig, MegaConfig } from '../MegaConfig';
import { isAbsolute, join, resolve as resolver } from 'path';

/**
 * Represents a command to add a seeder file to a specific folder in the project
 * based on MegaORM configuration.
 *
 * @extends MegaCommand
 */
export class AddSeederCommand extends MegaCommand {
  protected static syntax: string = '<! table>';

  /**
   * Resolves the appropriate path for adding a seeder file based on the configuration.
   *
   * @param config The MegaORM configuration object.
   * @returns The resolved path for the seeder file.
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

      if (isAbsolute(config.typescript.src)) {
        return join(config.typescript.src, config.paths.seeders);
      }

      return resolver(
        MegaConfig.resolveSync(),
        config.typescript.src,
        config.paths.seeders
      );
    }

    if (isAbsolute(config.paths.seeders)) {
      return config.paths.seeders;
    }

    return resolver(MegaConfig.resolveSync(), config.paths.seeders);
  }

  /**
   * Executes the command to add a seeder.
   *
   * @returns A promise that resolves when the seeder has been added successfully or rejects with an error.
   */
  public static exec(): Promise<void> {
    return new Promise((resolve, reject) => {
      const t = this.argument('table') as string;

      MegaConfig.load()
        .then((config: MegaORMConfig) => {
          const p = this.path(config);
          const ts = config.typescript.enabled;

          MegaConfig.mkdir(p)
            .then(() => config.cluster.request(config.default))
            .then((con) => Promise.resolve(new MegaBuilder(con)))
            .then((builder) => Promise.resolve(new SeederHandler(builder)))
            .then((handler) => handler.add(t, p, ts))
            .then((message) => resolve(this.success(message)))
            .catch(reject);
        })
        .catch(reject);
    });
  }
}
