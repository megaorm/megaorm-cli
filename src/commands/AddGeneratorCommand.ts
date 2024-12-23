import { GeneratorHandler } from '../handlers/GeneratorHandler';
import { MegaBuilder } from '@megaorm/builder';
import { MegaCommand, MegaCommandError } from '../MegaCommand';
import { MegaORMConfig, MegaConfig } from '../MegaConfig';
import { isAbsolute, join, resolve as resolver } from 'path';

/**
 * Represents a command to add a generator file to a specific folder in the project
 * based on MegaORM configuration.
 *
 * @extends MegaCommand
 */
export class AddGeneratorCommand extends MegaCommand {
  protected static syntax: string = '<! table>';

  /**
   * Resolves the appropriate path for adding a generator file based on the configuration.
   *
   * @param config The MegaORM configuration object.
   * @returns The resolved path for the generator file.
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

      if (isAbsolute(config.typescript.src)) {
        return join(config.typescript.src, config.paths.generators);
      }

      return resolver(
        MegaConfig.resolveSync(),
        config.typescript.src,
        config.paths.generators
      );
    }

    if (isAbsolute(config.paths.generators)) {
      return config.paths.generators;
    }

    return resolver(MegaConfig.resolveSync(), config.paths.generators);
  }

  /**
   * Executes the command to add a generator.
   *
   * @returns A promise that resolves when the generator has been added successfully or rejects with an error.
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
            .then((builder) => Promise.resolve(new GeneratorHandler(builder)))
            .then((handler) => handler.add(t, p, ts))
            .then((message) => resolve(this.success(message)))
            .catch(reject);
        })
        .catch(reject);
    });
  }
}
