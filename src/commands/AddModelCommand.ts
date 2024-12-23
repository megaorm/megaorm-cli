import { ModelHandler } from '../handlers/ModelHandler';
import { MegaCommand, MegaCommandError } from '../MegaCommand';
import { MegaORMConfig, MegaConfig } from '../MegaConfig';
import { isAbsolute, join, resolve as resolver } from 'path';

/**
 * Represents a command to add a model file to a specific folder in the project
 * based on MegaORM configuration.
 *
 * @extends MegaCommand
 */
export class AddModelCommand extends MegaCommand {
  protected static syntax: string = '<! table>';

  /**
   * Resolves the appropriate path for adding a model file based on the configuration.
   *
   * @param config The MegaORM configuration object.
   * @returns The resolved path for the model file.
   * @throws `MegaCommandError` if `paths.models` is absolute and TypeScript is enabled.
   */
  private static path(config: MegaORMConfig): string {
    if (config.typescript.enabled === true) {
      // Cannot be absolute
      if (isAbsolute(config.paths.models)) {
        throw new MegaCommandError(
          `paths.models cannot be absolute if typescript is enabled`
        );
      }

      if (isAbsolute(config.typescript.src)) {
        return join(config.typescript.src, config.paths.models);
      }

      return resolver(
        MegaConfig.resolveSync(),
        config.typescript.src,
        config.paths.models
      );
    }

    if (isAbsolute(config.paths.models)) {
      return config.paths.models;
    }

    return resolver(MegaConfig.resolveSync(), config.paths.models);
  }

  /**
   * Executes the command to add a model.
   *
   * @returns A promise that resolves when the model has been added successfully or rejects with an error.
   */
  public static exec(): Promise<void> {
    return new Promise((resolve, reject) => {
      const t = this.argument('table') as string;

      MegaConfig.load()
        .then((config: MegaORMConfig) => {
          const p = this.path(config);
          const ts = config.typescript.enabled;

          MegaConfig.mkdir(p)
            .then(() => new ModelHandler().add(t, p, ts))
            .then((message) => resolve(this.success(message)))
            .catch(reject);
        })
        .catch(reject);
    });
  }
}
