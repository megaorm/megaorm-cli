import { GeneratorHandler } from '../handlers/GeneratorHandler';
import { MegaBuilder } from '@megaorm/builder';
import { MegaCommand, MegaCommandError } from '../MegaCommand';
import { MegaORMConfig, MegaConfig } from '../MegaConfig';
import { isAbsolute, join, resolve as resolver } from 'path';

/**
 * Represents a command to remove a generator file from specific folders in the project
 * based on MegaORM configuration.
 *
 * @extends MegaCommand
 */
export class RemoveGeneratorCommand extends MegaCommand {
  protected static syntax: string = '<! table>';

  /**
   * Resolves the appropriate paths for removing generator files based on the configuration.
   *
   * @param config The MegaORM configuration object.
   * @returns An array of resolved paths for the generator files to be removed.
   * @throws `MegaCommandError` if `paths.generators` is absolute and TypeScript is enabled.
   */
  private static paths(config: MegaORMConfig): Array<string> {
    const paths = [];

    if (config.typescript.enabled === true) {
      // Cannot be absolute
      if (isAbsolute(config.paths.generators)) {
        throw new MegaCommandError(
          `paths.generators cannot be absolute if typescript is enabled`
        );
      }

      if (isAbsolute(config.typescript.src)) {
        paths.push(join(config.typescript.src, config.paths.generators));
      } else {
        paths.push(
          resolver(
            MegaConfig.resolveSync(),
            config.typescript.src,
            config.paths.generators
          )
        );
      }

      if (isAbsolute(config.typescript.dist)) {
        paths.push(join(config.typescript.dist, config.paths.generators));
      } else {
        paths.push(
          resolver(
            MegaConfig.resolveSync(),
            config.typescript.dist,
            config.paths.generators
          )
        );
      }

      return paths;
    }

    if (isAbsolute(config.paths.generators)) {
      paths.push(config.paths.generators);
      return paths;
    }

    paths.push(resolver(MegaConfig.resolveSync(), config.paths.generators));
    return paths;
  }

  /**
   * Removes the generator file associated with the specified table name.
   *
   * @returns A promise that resolves when the generator files have been successfully removed or rejects with an error.
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
            .then((builder) => Promise.resolve(new GeneratorHandler(builder)))
            .then((handler) => Promise.all(ps.map((p) => handler.remove(t, p))))
            .then((messages) => resolve(this.success(messages.join('\n'))))
            .catch(reject);
        })
        .catch(reject);
    });
  }
}
