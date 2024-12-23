import { RemoveCommandCommand } from '../../src/commands/RemoveCommandCommand';
import { MegaCommandError } from '../../src/MegaCommand';
import { MegaConfig } from '../../src/MegaConfig';
import { CommandHandler } from '../../src/handlers/CommandHandler';
import { join, resolve } from 'path';

MegaConfig.resolveSync = jest.fn(() => '/root/project');

describe('RemoveCommandCommand', () => {
  describe('paths', () => {
    it('should resolve paths when TypeScript is disabled', () => {
      const config: any = {
        typescript: {
          enabled: false, // disabled
        },
        paths: {
          commands: 'commands', // relative
        },
      };

      expect(RemoveCommandCommand['paths'](config)).toEqual([
        resolve('/root/project', 'commands'),
      ]);

      config.paths.commands = '/absolute/path/commands'; // absolute
      expect(RemoveCommandCommand['paths'](config)).toEqual([
        '/absolute/path/commands',
      ]);
    });

    it('should resolve paths when TypeScript is enabled and paths are relative', () => {
      const config: any = {
        typescript: {
          enabled: true, // enabled
          src: 'src',
          dist: 'dist',
        },
        paths: {
          commands: 'commands', // relative
        },
      };

      expect(RemoveCommandCommand['paths'](config)).toEqual([
        resolve('/root/project', 'src', 'commands'),
        resolve('/root/project', 'dist', 'commands'),
      ]);
    });

    it('should resolve paths when TypeScript is enabled and src/dist are absolute', () => {
      const config: any = {
        typescript: {
          enabled: true, // enabled
          src: '/absolute/src',
          dist: '/absolute/dist',
        },
        paths: {
          commands: 'commands', // relative
        },
      };

      expect(RemoveCommandCommand['paths'](config)).toEqual([
        join('/absolute/src', 'commands'),
        join('/absolute/dist', 'commands'),
      ]);
    });

    it('should throw an error if commands path is absolute and TypeScript is enabled', () => {
      const config: any = {
        typescript: {
          enabled: true, // enabled
          src: 'src',
          dist: 'dist',
        },
        paths: {
          commands: '/absolute/path/commands', // absolute
        },
      };

      expect(() => RemoveCommandCommand['paths'](config)).toThrow(
        new MegaCommandError(
          'paths.commands cannot be absolute if typescript is enabled'
        )
      );
    });
  });

  describe('exec', () => {
    it('should resolve with success messages when model files are removed', async () => {
      const config: any = {
        typescript: {
          enabled: true,
          src: 'src',
          dist: 'dist',
        },
        paths: {
          commands: 'commands',
        },
      };

      const paths = [
        resolve('/root/project', 'src', 'commands'),
        resolve('/root/project', 'dist', 'commands'),
      ];

      jest
        .spyOn(RemoveCommandCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(RemoveCommandCommand as any, 'paths').mockReturnValue(paths);
      jest.spyOn(MegaConfig, 'existMany').mockResolvedValue(undefined);
      jest
        .spyOn(CommandHandler.prototype, 'remove')
        .mockResolvedValue('message');
      jest.spyOn(RemoveCommandCommand, 'success').mockReturnValue(undefined);

      const result = await RemoveCommandCommand.exec();

      expect(result).toBeUndefined();
      expect(MegaConfig.load).toHaveBeenCalledWith();
      expect((RemoveCommandCommand as any).argument).toHaveBeenCalledWith(
        'name'
      );
      expect((RemoveCommandCommand as any).paths).toHaveBeenCalledWith(config);
      expect(MegaConfig.existMany).toHaveBeenCalledWith(paths);
      expect(CommandHandler.prototype.remove).toHaveBeenCalledTimes(2);
      expect(CommandHandler.prototype.remove).toHaveBeenNthCalledWith(
        1,
        'name',
        paths[0]
      );
      expect(CommandHandler.prototype.remove).toHaveBeenNthCalledWith(
        2,
        'name',
        paths[1]
      );
      expect(RemoveCommandCommand.success).toHaveBeenCalledWith(
        'message\nmessage'
      );
    });

    it('should reject if argument fails', async () => {
      const error = new Error('Ops');

      jest
        .spyOn(RemoveCommandCommand as any, 'argument')
        .mockImplementation(() => {
          throw error;
        });

      await expect(RemoveCommandCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if load fails', async () => {
      const error = new Error('Ops');

      jest
        .spyOn(RemoveCommandCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockRejectedValue(error);

      await expect(RemoveCommandCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if paths fails', async () => {
      const config: any = { typescript: { enabled: true } };
      const error = new Error('Ops');

      jest
        .spyOn(RemoveCommandCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest
        .spyOn(RemoveCommandCommand as any, 'paths')
        .mockImplementation(() => {
          throw error;
        });

      await expect(RemoveCommandCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if existMany fails', async () => {
      const config: any = { typescript: { enabled: true } };
      const paths = ['/resolved/path/commands'];
      const error = new Error('Ops');

      jest
        .spyOn(RemoveCommandCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(RemoveCommandCommand as any, 'paths').mockReturnValue(paths);
      jest.spyOn(MegaConfig, 'existMany').mockRejectedValue(error);

      await expect(RemoveCommandCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if remove fails', async () => {
      const config: any = { typescript: { enabled: true } };
      const paths = ['/resolved/path/commands'];
      const error = new Error('Ops');

      jest
        .spyOn(RemoveCommandCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(RemoveCommandCommand as any, 'paths').mockReturnValue(paths);
      jest.spyOn(MegaConfig, 'existMany').mockResolvedValue(undefined);
      jest.spyOn(CommandHandler.prototype, 'remove').mockRejectedValue(error);

      await expect(RemoveCommandCommand.exec()).rejects.toThrow(error);
    });
  });
});
