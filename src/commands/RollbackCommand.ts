import { GeneratorHandler } from '../handlers/GeneratorHandler';
import { MegaBuilder } from '@megaorm/builder';
import { MegaCommand } from '../MegaCommand';
import { MegaConfig, MegaORMConfig } from '../MegaConfig';

/**
 * Represents a command to rollback the most recently generated tables.
 *
 * The command performs the following actions:
 * - Resolves the configuration and establishes a connection to the database.
 * - Identifies the last batch of generated tables.
 * - Drops the tables created in the most recent generation batch.
 *
 * Example Behavior:
 * - If the first generation created 2 tables, and the second created 4 tables:
 *   - Executing the rollback will drop the last 4 tables created in the second generation.
 *
 * This ensures that rollbacks only affect the most recent changes, preserving earlier tables.
 *
 * @extends MegaCommand
 */
export class RollbackCommand extends MegaCommand {
  /**
   * Executes the rollback command to drop the most recently generated tables.
   *
   * The command identifies the last batch of tables created by the most recent
   * generator files and drops them to revert the changes.
   *
   * @returns A promise that resolves when the tables have been successfully dropped
   * or rejects with an error if the rollback fails.
   */
  public static exec() {
    return new Promise((resolve, reject) => {
      MegaConfig.load<MegaORMConfig>()
        .then((config) => config.cluster.request(config.default))
        .then((con) => Promise.resolve(new MegaBuilder(con)))
        .then((builder) => Promise.resolve(new GeneratorHandler(builder)))
        .then((handler) => handler.rollback())
        .then((message) => resolve(this.success(message)))
        .catch(reject);
    });
  }
}
