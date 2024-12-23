import { MegaCommand } from './MegaCommand';

// Commands
import { AddCommandCommand } from './commands/AddCommandCommand';
import { AddGeneratorCommand } from './commands/AddGeneratorCommand';
import { AddModelCommand } from './commands/AddModelCommand';
import { AddSeederCommand } from './commands/AddSeederCommand';
import { ClearCommand } from './commands/ClearCommand';
import { FetchCommand } from './commands/FetchCommand';
import { GenerateCommand } from './commands/GenerateCommand';
import { RemoveCommandCommand } from './commands/RemoveCommandCommand';
import { RemoveGeneratorCommand } from './commands/RemoveGeneratorCommand';
import { RemoveModelCommand } from './commands/RemoveModelCommand';
import { RemoveSeederCommand } from './commands/RemoveSeederCommand';
import { ResetCommand } from './commands/ResetCommand';
import { RollbackCommand } from './commands/RollbackCommand';
import { SeedCommand } from './commands/SeedCommand';
import { AddForCommand } from './commands/AddForCommand';
import { RemoveForCommand } from './commands/RemoveForCommand';
import { VersionCommand } from './commands/VersionCommand';

import {
  isDefined,
  isFullStr,
  isSubclass,
  isUndefined,
  isPromise,
} from '@megaorm/test';

/**
 * Type representing an array of registered commands.
 * Each entry contains the command name and the corresponding command class.
 *
 * @property `name` The name of the command.
 * @property `command` The command class that extends MegaCommand.
 */
type Commands = Array<{ name: string; command: typeof MegaCommand }>;

/**
 * Custom error class for errors related to the MegaExecutor.
 */
export class MegaExecutorError extends Error {}

/**
 * MegaExecutor is a class responsible for registering and executing commands in MegaORM.
 * It allows commands to be registered with a specific name and executed based on the provided name.
 */
export class MegaExecutor {
  /**
   * List of registered commands with their names and associated MegaCommand classes.
   *
   * @private
   * @static
   */
  private static commands: Commands = [
    { name: 'add:command', command: AddCommandCommand },
    { name: 'add:cmd', command: AddCommandCommand },
    { name: 'add:model', command: AddModelCommand },
    { name: 'add:seeder', command: AddSeederCommand },
    { name: 'add:generator', command: AddGeneratorCommand },
    { name: 'add:gen', command: AddGeneratorCommand },
    { name: 'add:for', command: AddForCommand },
    { name: 'remove:command', command: RemoveCommandCommand },
    { name: 'remove:cmd', command: RemoveCommandCommand },
    { name: 'remove:model', command: RemoveModelCommand },
    { name: 'remove:seeder', command: RemoveSeederCommand },
    { name: 'remove:generator', command: RemoveGeneratorCommand },
    { name: 'remove:gen', command: RemoveGeneratorCommand },
    { name: 'remove:for', command: RemoveForCommand },
    { name: 'generate', command: GenerateCommand },
    { name: 'gen', command: GenerateCommand },
    { name: 'rollback', command: RollbackCommand },
    { name: 'roll', command: RollbackCommand },
    { name: 'reset', command: ResetCommand },
    { name: 'seed', command: SeedCommand },
    { name: 'clear', command: ClearCommand },
    { name: 'fetch', command: FetchCommand },
    { name: 'version', command: VersionCommand },
    { name: 'v', command: VersionCommand },
  ];

  /**
   * Registers a command under a specific name. If the name is already registered or the command is invalid, an error is thrown.
   *
   * @param name The name of the command.
   * @param command The `MegaCommand` subclass.
   * @throws `MegaExecutorError` if the name is invalid, the command class is not a subclass of `MegaCommand`, or if the name already exists.
   */
  public static register(name: string, command: typeof MegaCommand) {
    if (!isSubclass(command, MegaCommand)) {
      throw new MegaExecutorError(`Invalid command: ${String(command)}`);
    }

    if (!isFullStr(name)) {
      throw new MegaExecutorError(`Invalid command name: ${String(name)}`);
    }

    const cmd = this.commands.find((command) => command.name === name);

    if (isDefined(cmd)) {
      throw new MegaExecutorError(`Deplicated command names: ${name}`);
    }

    this.commands.push({ name, command });
  }

  /**
   * Executes the command associated with the argument passed from the command line.
   *
   * @returns A promise that resolves when the command finishes execution, or rejects with an error.
   * @throws `MegaExecutorError`if the command name is undefined, the command is unknown, or the `exec` method is invalid.
   */
  public static execute(): Promise<void> {
    return new Promise((resolve, reject) => {
      const name = process.argv[2];

      if (isUndefined(name)) {
        return reject(new MegaExecutorError('Undefined command name'));
      }

      const command = this.commands.find((cmd) => cmd.name === name)?.command;

      if (isUndefined(command)) {
        return reject(new MegaExecutorError(`Unknown command: ${name}`));
      }

      const value = command.exec();

      if (!isPromise(value)) return resolve(value as void);

      return (value as Promise<void>).then(resolve).catch(reject);
    });
  }
}

/**
 * Registers a command under a specific name. If the name is already registered or the command is invalid, an error is thrown.
 *
 * @param name The name of the command.
 * @param command The `MegaCommand` subclass.
 * @throws `MegaExecutorError` if the name is invalid, the command class is not a subclass of `MegaCommand`, or if the name already exists.
 */
export const register: (name: string, command: typeof MegaCommand) => void =
  MegaExecutor.register.bind(MegaExecutor);

/**
 * Executes the command associated with the argument passed from the command line.
 *
 * @returns A promise that resolves when the command finishes execution, or rejects with an error.
 * @throws `MegaExecutorError`if the command name is undefined, the command is unknown, or the `exec` method is invalid.
 */
export const execute: () => Promise<void> =
  MegaExecutor.execute.bind(MegaExecutor);
