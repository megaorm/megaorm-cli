import { SeederHandler } from '../handlers/SeederHandler';
import { MegaBuilder } from '@megaorm/builder';
import { MegaCommand, MegaCommandError } from '../MegaCommand';
import { MegaORMConfig, MegaConfig } from '../MegaConfig';
import { isAbsolute, join, resolve as resolver } from 'path';

/**
 * Represents a command to remove a seeder file from specific folders in the project
 * based on MegaORM configuration.
 *
 * @extends MegaCommand
 */
export class RemoveSeederCommand extends MegaCommand {
  protected static syntax: string = '<! table>';

  /**
   * Resolves the appropriate paths for removing seeder files based on the configuration.
   *
   * @param config The MegaORM configuration object.
   * @returns An array of resolved paths for the seeder files to be removed.
   * @throws `MegaCommandError` if `paths.seeders` is absolute and TypeScript is enabled.
   */
  private static paths(config: MegaORMConfig): Array<string> {
    const paths = [];

    if (config.typescript.enabled === true) {
      // Cannot be absolute
      if (isAbsolute(config.paths.seeders)) {
        throw new MegaCommandError(
          `paths.seeders cannot be absolute if typescript is enabled`
        );
      }

      if (isAbsolute(config.typescript.src)) {
        paths.push(join(config.typescript.src, config.paths.seeders));
      } else {
        paths.push(
          resolver(
            MegaConfig.resolveSync(),
            config.typescript.src,
            config.paths.seeders
          )
        );
      }

      if (isAbsolute(config.typescript.dist)) {
        paths.push(join(config.typescript.dist, config.paths.seeders));
      } else {
        paths.push(
          resolver(
            MegaConfig.resolveSync(),
            config.typescript.dist,
            config.paths.seeders
          )
        );
      }

      return paths;
    }

    if (isAbsolute(config.paths.seeders)) {
      paths.push(config.paths.seeders);
      return paths;
    }

    paths.push(resolver(MegaConfig.resolveSync(), config.paths.seeders));
    return paths;
  }

  /**
   * Removes the seeder file associated with the specified table name.
   *
   * @returns A promise that resolves when the seeder files have been successfully removed or rejects with an error.
   */
  public static exec(): Promise<void> {
    return new Promise((resolve, reject) => {
      const t = this.argument('table') as string;

      MegaConfig.load()
        .then((config: MegaORMConfig) => {
          const ps = this.paths(config);

          MegaConfig.existMany(ps)
            .then(() => config.cluster.request(config.default))
            .then((con) => Promise.resolve(new MegaBuilder(con)))
            .then((builder) => Promise.resolve(new SeederHandler(builder)))
            .then((handler) => Promise.all(ps.map((p) => handler.remove(t, p))))
            .then((messages) => resolve(this.success(messages.join('\n'))))
            .catch(reject);
        })
        .catch(reject);
    });
  }
}
