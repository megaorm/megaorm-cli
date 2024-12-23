import { AddCommandCommand } from '../../src/commands/AddCommandCommand';
import { MegaCommandError } from '../../src/MegaCommand';
import { MegaConfig } from '../../src/MegaConfig';
import { CommandHandler } from '../../src/handlers/CommandHandler';
import { MegaCluster } from '@megaorm/cluster';
import { join, resolve } from 'path';

MegaConfig.resolveSync = jest.fn(() => '/root/project');

describe('AddCommandCommand', () => {
  describe('path', () => {
    it('should resolve when TypeScript is disabled', () => {
      const config = {
        cluster: new MegaCluster(),
        default: 'main',
        typescript: {
          enabled: false, // disabled
          src: 'src',
          dist: 'dist',
        },
        paths: {
          commands: 'commands', // relative
        },
      };

      expect(AddCommandCommand['path'](config)).toBe(
        resolve('/root/project', 'commands')
      );

      config.paths.commands = '/absolute/path/commands'; // absolute
      expect(AddCommandCommand['path'](config)).toBe('/absolute/path/commands');
    });

    it('should resolve when TypeScript is enabled and commands path is relative', () => {
      const config = {
        cluster: new MegaCluster(),
        default: 'main',
        typescript: {
          enabled: true, // enabled
          src: 'src',
          dist: 'dist',
        },
        paths: {
          commands: 'commands', // relative
        },
      };

      expect(AddCommandCommand['path'](config)).toBe(
        resolve('/root/project', 'src', 'commands')
      );
    });

    it('should resolve when TypeScript is enabled and src is absolute', () => {
      const config = {
        cluster: new MegaCluster(),
        default: 'main',
        typescript: {
          enabled: true, // enabled
          src: '/absolute/src',
          dist: 'dist',
        },
        paths: {
          commands: 'commands', // relative
        },
      };

      expect(AddCommandCommand['path'](config)).toBe(
        join('/absolute/src', 'commands')
      );
    });

    it('should reject if commands path is absolute and TypeScript is enabled', () => {
      const config = {
        cluster: new MegaCluster(),
        default: 'main',
        typescript: {
          enabled: true, // enabled
          src: 'src',
          dist: 'dist',
        },
        paths: {
          commands: '/absolute/path/commands', // absolute
        },
      };

      expect(() => AddCommandCommand['path'](config)).toThrow(
        new MegaCommandError(
          'paths.commands cannot be absolute if typescript is enabled'
        )
      );
    });
  });

  describe('exec', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should resolve with a success message', async () => {
      const path = '/resolved/path';
      const message = 'Command executed successfully';
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };

      // Mock dependencies
      jest.spyOn(AddCommandCommand as any, 'argument').mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(AddCommandCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(CommandHandler.prototype, 'add').mockResolvedValue(message);
      jest.spyOn(AddCommandCommand, 'success').mockReturnValue(undefined);

      // Execute the method
      const result = await AddCommandCommand.exec();

      // Assertions
      expect(result).toBeUndefined();
      expect((AddCommandCommand as any).argument).toHaveBeenCalledWith('name');
      expect(MegaConfig.load).toHaveBeenCalledWith();
      expect((AddCommandCommand as any).path).toHaveBeenCalledWith(config);
      expect(MegaConfig.mkdir).toHaveBeenCalledWith(path);
      expect(CommandHandler.prototype.add).toHaveBeenCalledWith(
        'name',
        path,
        true
      );
      expect(AddCommandCommand.success).toHaveBeenCalledWith(message);
    });

    it('should reject if argument fails', async () => {
      const error = new Error('Ops');

      // Mock dependencies
      jest
        .spyOn(AddCommandCommand as any, 'argument')
        .mockImplementation(() => {
          throw error;
        });

      await expect(AddCommandCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if load fails', async () => {
      const error = new Error('Ops');

      // Mock dependencies
      jest.spyOn(AddCommandCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockRejectedValue(error);

      await expect(AddCommandCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if path fails', async () => {
      const error = new Error('Ops');
      const config = { typescript: { enabled: true } };

      // Mock dependencies
      jest.spyOn(AddCommandCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(AddCommandCommand as any, 'path').mockImplementation(() => {
        throw error;
      });

      await expect(AddCommandCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if mkdir fails', async () => {
      const path = '/resolved/path';
      const error = new Error('Ops');
      const config = { typescript: { enabled: true } };

      // Mock dependencies
      jest.spyOn(AddCommandCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(AddCommandCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'mkdir').mockRejectedValue(error);

      await expect(AddCommandCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if add fails', async () => {
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };
      const path = '/resolved/path';
      const error = new Error('Ops');

      // Mock dependencies
      jest.spyOn(AddCommandCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(AddCommandCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(CommandHandler.prototype, 'add').mockRejectedValue(error);

      await expect(AddCommandCommand.exec()).rejects.toThrow(error);
    });
  });
});
