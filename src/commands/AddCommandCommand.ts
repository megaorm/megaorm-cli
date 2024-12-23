import { CommandHandler } from '../handlers/CommandHandler';
import { MegaCommand, MegaCommandError } from '../MegaCommand';
import { MegaORMConfig, MegaConfig } from '../MegaConfig';
import { isAbsolute, join, resolve as resolver } from 'path';

/**
 * Represents a command to add a command file to a specific folder in the project
 * based on MegaORM configuration.
 *
 * @extends MegaCommand
 */
export class AddCommandCommand extends MegaCommand {
  protected static syntax: string = '<! name>';

  /**
   * Resolves the appropriate path for adding a command file based on the configuration.
   *
   * @param config The MegaORM configuration object.
   * @returns The resolved path for the command file.
   * @throws `MegaCommandError` if `paths.commands` is absolute and TypeScript is enabled.
   */
  private static path(config: MegaORMConfig): string {
    if (config.typescript.enabled === true) {
      // Cannot be absolute
      if (isAbsolute(config.paths.commands)) {
        throw new MegaCommandError(
          `paths.commands cannot be absolute if typescript is enabled`
        );
      }

      if (isAbsolute(config.typescript.src)) {
        return join(config.typescript.src, config.paths.commands);
      }

      return resolver(
        MegaConfig.resolveSync(),
        config.typescript.src,
        config.paths.commands
      );
    }

    if (isAbsolute(config.paths.commands)) {
      return config.paths.commands;
    }

    return resolver(MegaConfig.resolveSync(), config.paths.commands);
  }

  /**
   * Executes the command to add a command.
   *
   * @returns A promise that resolves when the command has been added successfully or rejects with an error.
   */
  public static exec(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Command name
      const n = this.argument('name') as string;

      MegaConfig.load()
        .then((config: MegaORMConfig) => {
          const p = this.path(config);
          const ts = config.typescript.enabled;

          MegaConfig.mkdir(p)
            .then(() => new CommandHandler().add(n, p, ts))
            .then((message) => resolve(this.success(message)))
            .catch(reject);
        })
        .catch(reject);
    });
  }
}
