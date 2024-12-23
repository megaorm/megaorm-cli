import { ClearCommand } from '../../src/commands/ClearCommand';
import { MegaCommandError } from '../../src/MegaCommand';
import { MegaConfig } from '../../src/MegaConfig';
import { SeederHandler } from '../../src/handlers/SeederHandler';
import { MegaCluster } from '@megaorm/cluster';
import { join, resolve } from 'path';

const con = {
  id: Symbol('MegaPoolConnection'),
} as any;

MegaConfig.resolveSync = jest.fn(() => '/root/project');

describe('ClearCommand', () => {
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
          seeders: 'seeders', // relative
        },
      };

      expect(ClearCommand['path'](config)).toBe(
        resolve('/root/project', 'seeders')
      );

      config.paths.seeders = '/absolute/path/seeders'; // absolute
      expect(ClearCommand['path'](config)).toBe('/absolute/path/seeders');
    });

    it('should resolve when TypeScript is enabled and seeders path is relative', () => {
      const config = {
        cluster: new MegaCluster(),
        default: 'main',
        typescript: {
          enabled: true, // enabled
          src: 'src',
          dist: 'dist',
        },
        paths: {
          seeders: 'seeders', // relative
        },
      };

      expect(ClearCommand['path'](config)).toBe(
        resolve('/root/project', 'dist', 'seeders')
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
          seeders: 'seeders', // relative
        },
      };

      expect(ClearCommand['path'](config)).toBe(
        join('/absolute/dist', 'seeders')
      );
    });

    it('should reject if seeders path is absolute and TypeScript is enabled', () => {
      const config = {
        cluster: new MegaCluster(),
        default: 'main',
        typescript: {
          enabled: true, // enabled
          src: 'src',
          dist: 'dist',
        },
        paths: {
          seeders: '/absolute/path/seeders', // absolute
        },
      };

      expect(() => ClearCommand['path'](config)).toThrow(
        new MegaCommandError(
          'paths.seeders cannot be absolute if typescript is enabled'
        )
      );
    });
  });

  describe('exec', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should resolve with a success message', async () => {
      const path = '/resolved/path/seeders';
      const message = 'Command executed successfully';
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };

      // Mock dependencies
      jest.spyOn(ClearCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(ClearCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'exist').mockResolvedValue(undefined);
      jest.spyOn(MegaCluster.prototype, 'request').mockResolvedValue(con);
      jest.spyOn(SeederHandler.prototype, 'clear').mockResolvedValue(message);
      jest.spyOn(ClearCommand, 'success').mockReturnValue(undefined);

      // Execute the method
      const result = await ClearCommand.exec();

      // Assertions
      expect(result).toBeUndefined();
      expect((ClearCommand as any).argument).toHaveBeenCalledWith('table');
      expect(MegaConfig.load).toHaveBeenCalledWith();
      expect((ClearCommand as any).path).toHaveBeenCalledWith(config);
      expect(MegaConfig.exist).toHaveBeenCalledWith(path);
      expect(config.cluster.request).toHaveBeenCalledWith(undefined);
      expect(SeederHandler.prototype.clear).toHaveBeenCalledWith(path, 'table');
      expect(ClearCommand.success).toHaveBeenCalledWith(message);
    });

    it('should reject if argument fails', async () => {
      const error = new Error('Ops');

      // Mock dependencies
      jest.spyOn(ClearCommand as any, 'argument').mockImplementation(() => {
        throw error;
      });

      await expect(ClearCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if load fails', async () => {
      const error = new Error('Ops');

      // Mock dependencies
      jest.spyOn(ClearCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockRejectedValue(error);

      await expect(ClearCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if path fails', async () => {
      const error = new Error('Ops');
      const config = { typescript: { enabled: true } };

      // Mock dependencies
      jest.spyOn(ClearCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(ClearCommand as any, 'path').mockImplementation(() => {
        throw error;
      });

      await expect(ClearCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if exist fails', async () => {
      const path = '/resolved/path/seeders';
      const error = new Error('Ops');
      const config = { typescript: { enabled: true } };

      // Mock dependencies
      jest.spyOn(ClearCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(ClearCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'exist').mockRejectedValue(error);

      await expect(ClearCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if request fails', async () => {
      const path = '/resolved/path/seeders';
      const error = new Error('Ops');
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };

      // Mock dependencies
      jest.spyOn(ClearCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(ClearCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'exist').mockResolvedValue(undefined);
      jest.spyOn(MegaCluster.prototype, 'request').mockRejectedValue(error);

      await expect(ClearCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if clear fails', async () => {
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };
      const path = '/resolved/path/seeders';
      const error = new Error('Ops');

      // Mock dependencies
      jest.spyOn(ClearCommand as any, 'argument').mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(ClearCommand as any, 'path').mockReturnValue(path);
      jest.spyOn(MegaConfig, 'exist').mockResolvedValue(undefined);
      jest.spyOn(MegaCluster.prototype, 'request').mockResolvedValue(con);
      jest.spyOn(SeederHandler.prototype, 'clear').mockRejectedValue(error);

      await expect(ClearCommand.exec()).rejects.toThrow(error);
    });
  });
});
