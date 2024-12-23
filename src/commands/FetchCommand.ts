import { MegaBuilder } from '@megaorm/builder';
import { MegaCommand } from '../MegaCommand';
import { MegaORMConfig, MegaConfig } from '../MegaConfig';

/**
 * Represents a command to fetch data from a specific table, with an optional row ID filter.
 *
 * The `FetchCommand` is designed to retrieve data from a table in the database. You can
 * specify a particular row by providing its ID. If no ID is provided, all rows from the table
 * will be fetched.
 *
 * The command performs the following actions:
 * - Constructs a query to fetch data from the specified table.
 * - Optionally filters the result by the provided row ID.
 *
 * This allows for retrieving specific rows from a table, or fetching all rows if no ID is given.
 *
 * @extends MegaCommand
 */
export class FetchCommand extends MegaCommand {
  // table name is required and id is optional
  protected static syntax: string = '<! table> <? id>';

  /**
   * Executes the command to fetch data from the specified table, optionally filtering by row ID.
   *
   * The command fetches all rows from the specified table. If an ID is provided, it filters
   * the result to include only the row with the given ID.
   *
   * @returns A promise that resolves with the fetched data or rejects with an error if the operation fails.
   */
  public static exec() {
    return new Promise((resolve, reject) => {
      const t = this.argument('table');
      const id = this.argument('id');

      MegaConfig.load()
        .then((config: MegaORMConfig) => {
          config.cluster
            .request(config.default)
            .then((con) => {
              const builder = new MegaBuilder(con);
              const selector = builder.select().from(t as string);
              if (id) selector.where((col) => col('id').equal(id));
              return selector.exec();
            })
            .then((r) => resolve(console.log(r)))
            .catch(reject);
        })
        .catch(reject);
    });
  }
}
