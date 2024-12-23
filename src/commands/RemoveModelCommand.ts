import { ModelHandler } from '../handlers/ModelHandler';
import { MegaCommand, MegaCommandError } from '../MegaCommand';
import { MegaORMConfig, MegaConfig } from '../MegaConfig';
import { isAbsolute, join, resolve as resolver } from 'path';

/**
 * Represents a command to remove a model file from specific folders in the project
 * based on MegaORM configuration.
 *
 * @extends MegaCommand
 */
export class RemoveModelCommand extends MegaCommand {
  protected static syntax: string = '<! table>';

  /**
   * Resolves the appropriate paths for removing model files based on the configuration.
   *
   * @param config The MegaORM configuration object.
   * @returns An array of resolved paths for the model files to be removed.
   * @throws `MegaCommandError` if `paths.models` is absolute and TypeScript is enabled.
   */
  private static paths(config: MegaORMConfig): Array<string> {
    const paths = [];

    if (config.typescript.enabled === true) {
      // Cannot be absolute
      if (isAbsolute(config.paths.models)) {
        throw new MegaCommandError(
          `paths.models cannot be absolute if typescript is enabled`
        );
      }

      if (isAbsolute(config.typescript.src)) {
        paths.push(join(config.typescript.src, config.paths.models));
      } else {
        paths.push(
          resolver(
            MegaConfig.resolveSync(),
            config.typescript.src,
            config.paths.models
          )
        );
      }

      if (isAbsolute(config.typescript.dist)) {
        paths.push(join(config.typescript.dist, config.paths.models));
      } else {
        paths.push(
          resolver(
            MegaConfig.resolveSync(),
            config.typescript.dist,
            config.paths.models
          )
        );
      }

      return paths;
    }

    if (isAbsolute(config.paths.models)) {
      paths.push(config.paths.models);
      return paths;
    }

    paths.push(resolver(MegaConfig.resolveSync(), config.paths.models));
    return paths;
  }

  /**
   * Removes the model file associated with the specified table name.
   *
   * @returns A promise that resolves when the model files have been successfully removed or rejects with an error.
   */
  public static exec(): Promise<void> {
    return new Promise((resolve, reject) => {
      const t = this.argument('table') as string;

      MegaConfig.load()
        .then((config: MegaORMConfig) => {
          const ps = this.paths(config);
          const handler = new ModelHandler();

          MegaConfig.existMany(ps)
            .then(() => Promise.all(ps.map((p) => handler.remove(t, p))))
            .then((messages) => resolve(this.success(messages.join('\n'))))
            .catch(reject);
        })
        .catch(reject);
    });
  }
}
