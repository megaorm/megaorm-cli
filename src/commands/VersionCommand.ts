import path from 'path';
import { MegaCommand, MegaCommandError } from '../MegaCommand';
import { Config } from '@megaorm/config';

/**
 * Command that outputs the current version of the application.
 *
 *
 * @extends MegaCommand
 */
export class VersionCommand extends MegaCommand {
  /**
   * Logs the current version of the application to the console.
   */
  public static exec(): any {
    return new Promise((resolve, reject) => {
      Config.loadJSON(path.resolve(__dirname, '../../package.json'))
        .then((config: any) => resolve(this.warning(config.version)))
        .catch(() =>
          reject(new MegaCommandError('Falied to load package.json'))
        );
    });
  }
}
