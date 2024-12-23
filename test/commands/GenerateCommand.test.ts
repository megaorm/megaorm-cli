import { GenerateCommand } from '../../src/commands/GenerateCommand';
import { MegaCommandError } from '../../src/MegaCommand';
import { MegaConfig } from '../../src/MegaConfig';
import { GeneratorHandler } from '../../src/handlers/GeneratorHandler';
import { MegaCluster } from '@megaorm/cluster';
import { join, resolve } from 'path';

const con = {
  id: Symbol('MegaPoolConnection'),
} as any;

MegaConfig.resolveSync = jest.fn(() => '/root/project');

describe('GenerateCommand', () => {
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

      expect(GenerateCommand['path'](config)).toBe(
        resolve('/root/project', 'generators')
      );

      config.paths.generators = '/absolute/path/generators'; // absolute
      expect(GenerateCommand['path'](config)).toBe('/absolute/path/generators');
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

      expect(GenerateCommand['path'](config)).toBe(
        resolve('/root/project', 'dist', 'generators')
      );
    });

    it('should resolve when TypeScript is enabled and dist is absolute', () => {
      const config = {
        cluster: new MegaCluster(),
        default: 'main',
        typescript: {
          enabled: true, // enabled
          src: 'src',
          dist: '/absolute/dist',
        },
        paths: {
          generators: 'generators', // relative
        },
      };

      expect(GenerateCommand['path'](config)).toBe(
        join('/absolute/dist', 'generators')
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

      expect(() => GenerateCommand['path'](config)).toThrow(
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
      const path = '/resolved/path/generators';
      const message = 'Command executed successfully';
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };

      // Mock dependencies
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(GenerateCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'exist').mockResolvedValue(undefined);
      jest.spyOn(MegaCluster.prototype, 'request').mockResolvedValue(con);
      jest
        .spyOn(GeneratorHandler.prototype, 'generate')
        .mockResolvedValue(message);
      jest.spyOn(GenerateCommand, 'success').mockReturnValue(undefined);

      // Execute the method
      const result = await GenerateCommand.exec();

      // Assertions
      expect(result).toBeUndefined();
      expect(MegaConfig.load).toHaveBeenCalledWith();
      expect((GenerateCommand as any).path).toHaveBeenCalledWith(config);
      expect(MegaConfig.exist).toHaveBeenCalledWith(path);
      expect(config.cluster.request).toHaveBeenCalledWith(undefined);
      expect(GeneratorHandler.prototype.generate).toHaveBeenCalledWith(path);
      expect(GenerateCommand.success).toHaveBeenCalledWith(message);
    });

    it('should reject if load fails', async () => {
      const error = new Error('Ops');

      // Mock dependencies
      jest.spyOn(GenerateCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockRejectedValue(error);

      await expect(GenerateCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if path fails', async () => {
      const error = new Error('Ops');
      const config = { typescript: { enabled: true } };

      // Mock dependencies
      jest.spyOn(GenerateCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(GenerateCommand as any, 'path').mockImplementation(() => {
        throw error;
      });

      await expect(GenerateCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if exist fails', async () => {
      const path = '/resolved/path/generators';
      const error = new Error('Ops');
      const config = { typescript: { enabled: true } };

      // Mock dependencies
      jest.spyOn(GenerateCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(GenerateCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'exist').mockRejectedValue(error);

      await expect(GenerateCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if request fails', async () => {
      const path = '/resolved/path/generators';
      const error = new Error('Ops');
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };

      // Mock dependencies
      jest.spyOn(GenerateCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(GenerateCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'exist').mockResolvedValue(undefined);
      jest.spyOn(MegaCluster.prototype, 'request').mockRejectedValue(error);

      await expect(GenerateCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if generate fails', async () => {
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };
      const path = '/resolved/path/generators';
      const error = new Error('Ops');

      // Mock dependencies
      jest.spyOn(GenerateCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(GenerateCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'exist').mockResolvedValue(undefined);
      jest.spyOn(MegaCluster.prototype, 'request').mockResolvedValue(con);
      jest
        .spyOn(GeneratorHandler.prototype, 'generate')
        .mockRejectedValue(error);

      await expect(GenerateCommand.exec()).rejects.toThrow(error);
    });
  });
});
