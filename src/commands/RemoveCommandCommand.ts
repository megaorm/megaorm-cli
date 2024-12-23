import { CommandHandler } from '../handlers/CommandHandler';
import { MegaCommand, MegaCommandError } from '../MegaCommand';
import { MegaORMConfig, MegaConfig } from '../MegaConfig';
import { isAbsolute, join, resolve as resolver } from 'path';

/**
 * Represents a command to remove a command file from specific folders in the project
 * based on MegaORM configuration.
 *
 * @extends MegaCommand
 */
export class RemoveCommandCommand extends MegaCommand {
  protected static syntax: string = '<! name>';

  /**
   * Resolves the appropriate paths for removing command files based on the configuration.
   *
   * @param config The MegaORM configuration object.
   * @returns An array of resolved paths for the command files to be removed.
   * @throws `MegaCommandError` if `paths.commands` is absolute and TypeScript is enabled.
   */
  private static paths(config: MegaORMConfig): Array<string> {
    const paths = [];

    if (config.typescript.enabled === true) {
      // Cannot be absolute
      if (isAbsolute(config.paths.commands)) {
        throw new MegaCommandError(
          `paths.commands cannot be absolute if typescript is enabled`
        );
      }

      if (isAbsolute(config.typescript.src)) {
        paths.push(join(config.typescript.src, config.paths.commands));
      } else {
        paths.push(
          resolver(
            MegaConfig.resolveSync(),
            config.typescript.src,
            config.paths.commands
          )
        );
      }

      if (isAbsolute(config.typescript.dist)) {
        paths.push(join(config.typescript.dist, config.paths.commands));
      } else {
        paths.push(
          resolver(
            MegaConfig.resolveSync(),
            config.typescript.dist,
            config.paths.commands
          )
        );
      }

      return paths;
    }

    if (isAbsolute(config.paths.commands)) {
      paths.push(config.paths.commands);
      return paths;
    }

    paths.push(resolver(MegaConfig.resolveSync(), config.paths.commands));
    return paths;
  }

  /**
   * Removes the command file with the specified name.
   *
   * @returns A promise that resolves when the command files have been successfully removed or rejects with an error.
   */
  public static exec(): Promise<void> {
    return new Promise((resolve, reject) => {
      const n = this.argument('name') as string;

      MegaConfig.load()
        .then((config: MegaORMConfig) => {
          const ps = this.paths(config);
          const handler = new CommandHandler();

          MegaConfig.existMany(ps)
            .then(() => Promise.all(ps.map((p) => handler.remove(n, p))))
            .then((messages) => resolve(this.success(messages.join('\n'))))
            .catch(reject);
        })
        .catch(reject);
    });
  }
}
