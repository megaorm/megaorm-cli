import { RemoveSeederCommand } from '../../src/commands/RemoveSeederCommand';
import { MegaCommandError } from '../../src/MegaCommand';
import { MegaConfig } from '../../src/MegaConfig';
import { SeederHandler } from '../../src/handlers/SeederHandler';
import { MegaCluster } from '@megaorm/cluster';
import { join, resolve } from 'path';

MegaConfig.resolveSync = jest.fn(() => '/root/project');

const con = {
  id: Symbol('MegaPoolConnection'),
} as any;

describe('RemoveSeederCommand', () => {
  describe('paths', () => {
    it('should resolve paths when TypeScript is disabled', () => {
      const config: any = {
        typescript: {
          enabled: false, // disabled
        },
        paths: {
          seeders: 'seeders', // relative
        },
      };

      expect(RemoveSeederCommand['paths'](config)).toEqual([
        resolve('/root/project', 'seeders'),
      ]);

      config.paths.seeders = '/absolute/path/seeders'; // absolute
      expect(RemoveSeederCommand['paths'](config)).toEqual([
        '/absolute/path/seeders',
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
          seeders: 'seeders', // relative
        },
      };

      expect(RemoveSeederCommand['paths'](config)).toEqual([
        resolve('/root/project', 'src', 'seeders'),
        resolve('/root/project', 'dist', 'seeders'),
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
          seeders: 'seeders', // relative
        },
      };

      expect(RemoveSeederCommand['paths'](config)).toEqual([
        join('/absolute/src', 'seeders'),
        join('/absolute/dist', 'seeders'),
      ]);
    });

    it('should throw an error if seeders path is absolute and TypeScript is enabled', () => {
      const config: any = {
        typescript: {
          enabled: true, // enabled
          src: 'src',
          dist: 'dist',
        },
        paths: {
          seeders: '/absolute/path/seeders', // absolute
        },
      };

      expect(() => RemoveSeederCommand['paths'](config)).toThrow(
        new MegaCommandError(
          'paths.seeders cannot be absolute if typescript is enabled'
        )
      );
    });
  });

  describe('exec', () => {
    it('should resolve with success messages when model files are removed', async () => {
      const paths = [
        resolve('/root/project', 'src', 'commands'),
        resolve('/root/project', 'dist', 'commands'),
      ];

      const config: any = {
        cluster: new MegaCluster(),
        typescript: {
          enabled: true,
        },
      };

      jest
        .spyOn(RemoveSeederCommand as any, 'argument')
        .mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(RemoveSeederCommand as any, 'paths').mockReturnValue(paths);
      jest.spyOn(MegaConfig, 'existMany').mockResolvedValue(undefined);
      jest.spyOn(config.cluster, 'request').mockResolvedValue(con);
      jest
        .spyOn(SeederHandler.prototype, 'remove')
        .mockResolvedValue('message');
      jest.spyOn(RemoveSeederCommand, 'success').mockReturnValue(undefined);

      const result = await RemoveSeederCommand.exec();

      expect(result).toBeUndefined();
      expect(MegaConfig.load).toHaveBeenCalledWith();
      expect((RemoveSeederCommand as any).argument).toHaveBeenCalledWith(
        'table'
      );
      expect((RemoveSeederCommand as any).paths).toHaveBeenCalledWith(config);
      expect(MegaConfig.existMany).toHaveBeenCalledWith(paths);
      expect(config.cluster.request).toHaveBeenCalledWith(undefined);
      expect(SeederHandler.prototype.remove).toHaveBeenCalledTimes(2);
      expect(SeederHandler.prototype.remove).toHaveBeenNthCalledWith(
        1,
        'table',
        paths[0]
      );
      expect(SeederHandler.prototype.remove).toHaveBeenNthCalledWith(
        2,
        'table',
        paths[1]
      );
      expect(RemoveSeederCommand.success).toHaveBeenCalledWith(
        'message\nmessage'
      );
    });

    it('should reject if argument fails', async () => {
      const error = new Error('Ops');

      jest
        .spyOn(RemoveSeederCommand as any, 'argument')
        .mockImplementation(() => {
          throw error;
        });

      await expect(RemoveSeederCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if load fails', async () => {
      const error = new Error('Ops');

      jest
        .spyOn(RemoveSeederCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockRejectedValue(error);

      await expect(RemoveSeederCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if paths fails', async () => {
      const error = new Error('Ops');
      const config: any = { typescript: { enabled: true } };

      jest
        .spyOn(RemoveSeederCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(RemoveSeederCommand as any, 'paths').mockImplementation(() => {
        throw error;
      });

      await expect(RemoveSeederCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if existMany fails', async () => {
      const paths = ['/resolved/path/commands'];
      const error = new Error('Ops');
      const config: any = { typescript: { enabled: true } };

      jest
        .spyOn(RemoveSeederCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(RemoveSeederCommand as any, 'paths').mockReturnValue(paths);
      jest.spyOn(MegaConfig, 'existMany').mockRejectedValue(error);

      await expect(RemoveSeederCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if request fails', async () => {
      const paths = ['/resolved/path/commands'];
      const error = new Error('Ops');
      const config: any = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };

      jest
        .spyOn(RemoveSeederCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(RemoveSeederCommand as any, 'paths').mockReturnValue(paths);
      jest.spyOn(MegaConfig, 'existMany').mockResolvedValue(undefined);
      jest.spyOn(config.cluster, 'request').mockRejectedValue(error);

      await expect(RemoveSeederCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if remove fails', async () => {
      const paths = ['/resolved/path/commands'];
      const error = new Error('Ops');
      const config: any = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };

      jest
        .spyOn(RemoveSeederCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(RemoveSeederCommand as any, 'paths').mockReturnValue(paths);
      jest.spyOn(MegaConfig, 'existMany').mockResolvedValue(undefined);
      jest.spyOn(config.cluster, 'request').mockResolvedValue(con);
      jest.spyOn(SeederHandler.prototype, 'remove').mockRejectedValue(error);

      await expect(RemoveSeederCommand.exec()).rejects.toThrow(error);
    });
  });
});
