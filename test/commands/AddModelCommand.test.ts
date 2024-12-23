import { AddModelCommand } from '../../src/commands/AddModelCommand';
import { MegaCommandError } from '../../src/MegaCommand';
import { MegaConfig } from '../../src/MegaConfig';
import { ModelHandler } from '../../src/handlers/ModelHandler';
import { MegaCluster } from '@megaorm/cluster';
import { join, resolve } from 'path';

MegaConfig.resolveSync = jest.fn(() => '/root/project');

describe('AddModelCommand', () => {
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
          models: 'models', // relative
        },
      };

      expect(AddModelCommand['path'](config)).toBe(
        resolve('/root/project', 'models')
      );

      config.paths.models = '/absolute/path/models'; // absolute
      expect(AddModelCommand['path'](config)).toBe('/absolute/path/models');
    });

    it('should resolve when TypeScript is enabled and models path is relative', () => {
      const config = {
        cluster: new MegaCluster(),
        default: 'main',
        typescript: {
          enabled: true, // enabled
          src: 'src',
          dist: 'dist',
        },
        paths: {
          models: 'models', // relative
        },
      };

      expect(AddModelCommand['path'](config)).toBe(
        resolve('/root/project', 'src', 'models')
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
          models: 'models', // relative
        },
      };

      expect(AddModelCommand['path'](config)).toBe(
        join('/absolute/src', 'models')
      );
    });

    it('should reject if models path is absolute and TypeScript is enabled', () => {
      const config = {
        cluster: new MegaCluster(),
        default: 'main',
        typescript: {
          enabled: true, // enabled
          src: 'src',
          dist: 'dist',
        },
        paths: {
          models: '/absolute/path/models', // absolute
        },
      };

      expect(() => AddModelCommand['path'](config)).toThrow(
        new MegaCommandError(
          'paths.models cannot be absolute if typescript is enabled'
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
      jest.spyOn(AddModelCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(AddModelCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(ModelHandler.prototype, 'add').mockResolvedValue(message);
      jest.spyOn(AddModelCommand, 'success').mockReturnValue(undefined);

      // Execute the method
      const result = await AddModelCommand.exec();

      // Assertions
      expect(result).toBeUndefined();
      expect((AddModelCommand as any).argument).toHaveBeenCalledWith('table');
      expect(MegaConfig.load).toHaveBeenCalledWith();
      expect((AddModelCommand as any).path).toHaveBeenCalledWith(config);
      expect(MegaConfig.mkdir).toHaveBeenCalledWith(path);
      expect(ModelHandler.prototype.add).toHaveBeenCalledWith(
        'table',
        path,
        true
      );
      expect(AddModelCommand.success).toHaveBeenCalledWith(message);
    });

    it('should reject if argument fails', async () => {
      const error = new Error('Ops');

      // Mock dependencies
      jest.spyOn(AddModelCommand as any, 'argument').mockImplementation(() => {
        throw error;
      });

      await expect(AddModelCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if load fails', async () => {
      const error = new Error('Ops');

      // Mock dependencies
      jest.spyOn(AddModelCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockRejectedValue(error);

      await expect(AddModelCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if path fails', async () => {
      const error = new Error('Ops');
      const config = { typescript: { enabled: true } };

      // Mock dependencies
      jest.spyOn(AddModelCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(AddModelCommand as any, 'path').mockImplementation(() => {
        throw error;
      });

      await expect(AddModelCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if mkdir fails', async () => {
      const path = '/resolved/path';
      const error = new Error('Ops');
      const config = { typescript: { enabled: true } };

      // Mock dependencies
      jest.spyOn(AddModelCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(AddModelCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'mkdir').mockRejectedValue(error);

      await expect(AddModelCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if add fails', async () => {
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };
      const path = '/resolved/path';
      const error = new Error('Ops');

      // Mock dependencies
      jest.spyOn(AddModelCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(AddModelCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(ModelHandler.prototype, 'add').mockRejectedValue(error);

      await expect(AddModelCommand.exec()).rejects.toThrow(error);
    });
  });
});
