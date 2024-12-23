import { AddGeneratorCommand } from '../../src/commands/AddGeneratorCommand';
import { MegaCommandError } from '../../src/MegaCommand';
import { MegaConfig } from '../../src/MegaConfig';
import { GeneratorHandler } from '../../src/handlers/GeneratorHandler';
import { MegaCluster } from '@megaorm/cluster';
import { join, resolve } from 'path';

const con = {
  id: Symbol('MegaPoolConnection'),
} as any;

MegaConfig.resolveSync = jest.fn(() => '/root/project');

describe('AddGeneratorCommand', () => {
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
          generators: 'generators', // relative
        },
      };

      expect(AddGeneratorCommand['path'](config)).toBe(
        resolve('/root/project', 'generators')
      );

      config.paths.generators = '/absolute/path/generators'; // absolute
      expect(AddGeneratorCommand['path'](config)).toBe(
        '/absolute/path/generators'
      );
    });

    it('should resolve when TypeScript is enabled and generators path is relative', () => {
      const config = {
        cluster: new MegaCluster(),
        default: 'main',
        typescript: {
          enabled: true, // enabled
          src: 'src',
          dist: 'dist',
        },
        paths: {
          generators: 'generators', // relative
        },
      };

      expect(AddGeneratorCommand['path'](config)).toBe(
        resolve('/root/project', 'src', 'generators')
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
          generators: 'generators', // relative
        },
      };

      expect(AddGeneratorCommand['path'](config)).toBe(
        join('/absolute/src', 'generators')
      );
    });

    it('should reject if generators path is absolute and TypeScript is enabled', () => {
      const config = {
        cluster: new MegaCluster(),
        default: 'main',
        typescript: {
          enabled: true, // enabled
          src: 'src',
          dist: 'dist',
        },
        paths: {
          generators: '/absolute/path/generators', // absolute
        },
      };

      expect(() => AddGeneratorCommand['path'](config)).toThrow(
        new MegaCommandError(
          'paths.generators cannot be absolute if typescript is enabled'
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
      jest
        .spyOn(AddGeneratorCommand as any, 'argument')
        .mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(AddGeneratorCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(MegaCluster.prototype, 'request').mockResolvedValue(con);
      jest.spyOn(GeneratorHandler.prototype, 'add').mockResolvedValue(message);
      jest.spyOn(AddGeneratorCommand, 'success').mockReturnValue(undefined);

      // Execute the method
      const result = await AddGeneratorCommand.exec();

      // Assertions
      expect(result).toBeUndefined();
      expect((AddGeneratorCommand as any).argument).toHaveBeenCalledWith(
        'table'
      );
      expect(MegaConfig.load).toHaveBeenCalledWith();
      expect((AddGeneratorCommand as any).path).toHaveBeenCalledWith(config);
      expect(MegaConfig.mkdir).toHaveBeenCalledWith(path);
      expect(config.cluster.request).toHaveBeenCalledWith(undefined);
      expect(GeneratorHandler.prototype.add).toHaveBeenCalledWith(
        'table',
        path,
        true
      );
      expect(AddGeneratorCommand.success).toHaveBeenCalledWith(message);
    });

    it('should reject if argument fails', async () => {
      const error = new Error('Ops');

      // Mock dependencies
      jest
        .spyOn(AddGeneratorCommand as any, 'argument')
        .mockImplementation(() => {
          throw error;
        });

      await expect(AddGeneratorCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if load fails', async () => {
      const error = new Error('Ops');

      // Mock dependencies
      jest
        .spyOn(AddGeneratorCommand as any, 'argument')
        .mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockRejectedValue(error);

      await expect(AddGeneratorCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if path fails', async () => {
      const error = new Error('Ops');
      const config = { typescript: { enabled: true } };

      // Mock dependencies
      jest
        .spyOn(AddGeneratorCommand as any, 'argument')
        .mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(AddGeneratorCommand as any, 'path').mockImplementation(() => {
        throw error;
      });

      await expect(AddGeneratorCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if mkdir fails', async () => {
      const path = '/resolved/path';
      const error = new Error('Ops');
      const config = { typescript: { enabled: true } };

      // Mock dependencies
      jest
        .spyOn(AddGeneratorCommand as any, 'argument')
        .mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(AddGeneratorCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'mkdir').mockRejectedValue(error);

      await expect(AddGeneratorCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if request fails', async () => {
      const path = '/resolved/path';
      const error = new Error('Ops');
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };

      // Mock dependencies
      jest
        .spyOn(AddGeneratorCommand as any, 'argument')
        .mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(AddGeneratorCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(MegaCluster.prototype, 'request').mockRejectedValue(error);

      await expect(AddGeneratorCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if add fails', async () => {
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };
      const path = '/resolved/path';
      const error = new Error('Ops');

      // Mock dependencies
      jest
        .spyOn(AddGeneratorCommand as any, 'argument')
        .mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(AddGeneratorCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(MegaCluster.prototype, 'request').mockResolvedValue(con);
      jest.spyOn(GeneratorHandler.prototype, 'add').mockRejectedValue(error);

      await expect(AddGeneratorCommand.exec()).rejects.toThrow(error);
    });
  });
});
