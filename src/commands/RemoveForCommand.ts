import { MegaCommand } from '../MegaCommand';
import { RemoveGeneratorCommand } from './RemoveGeneratorCommand';
import { RemoveSeederCommand } from './RemoveSeederCommand';
import { RemoveModelCommand } from './RemoveModelCommand';

/**
 * Represents a command to add a command file to a specific folder in the project
 * based on MegaORM configuration.
 *
 * @extends MegaCommand
 */
export class RemoveForCommand extends MegaCommand {
  /**
   * Executes 3 commands to add `generator`, `seeder` and a `model` file for the specified table.
   *
   * @returns A promise that resolves when all files has been added successfully or rejects with an error.
   */
  public static exec() {
    return new Promise((resolve, reject) => {
      RemoveGeneratorCommand.exec()
        .then(() => RemoveSeederCommand.exec())
        .then(() => RemoveModelCommand.exec())
        .then(resolve)
        .catch(reject);
    });
  }
}
