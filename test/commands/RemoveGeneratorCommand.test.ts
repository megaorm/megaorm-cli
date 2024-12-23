import { RemoveGeneratorCommand } from '../../src/commands/RemoveGeneratorCommand';
import { MegaCommandError } from '../../src/MegaCommand';
import { MegaConfig } from '../../src/MegaConfig';
import { GeneratorHandler } from '../../src/handlers/GeneratorHandler';
import { MegaCluster } from '@megaorm/cluster';
import { join, resolve } from 'path';

MegaConfig.resolveSync = jest.fn(() => '/root/project');

const con = {
  id: Symbol('MegaPoolConnection'),
} as any;

describe('RemoveGeneratorCommand', () => {
  describe('paths', () => {
    it('should resolve paths when TypeScript is disabled', () => {
      const config: any = {
        typescript: {
          enabled: false, // disabled
        },
        paths: {
          generators: 'generators', // relative
        },
      };

      expect(RemoveGeneratorCommand['paths'](config)).toEqual([
        resolve('/root/project', 'generators'),
      ]);

      config.paths.generators = '/absolute/path/generators'; // absolute
      expect(RemoveGeneratorCommand['paths'](config)).toEqual([
        '/absolute/path/generators',
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
          generators: 'generators', // relative
        },
      };

      expect(RemoveGeneratorCommand['paths'](config)).toEqual([
        resolve('/root/project', 'src', 'generators'),
        resolve('/root/project', 'dist', 'generators'),
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
          generators: 'generators', // relative
        },
      };

      expect(RemoveGeneratorCommand['paths'](config)).toEqual([
        join('/absolute/src', 'generators'),
        join('/absolute/dist', 'generators'),
      ]);
    });

    it('should throw an error if generators path is absolute and TypeScript is enabled', () => {
      const config: any = {
        typescript: {
          enabled: true, // enabled
          src: 'src',
          dist: 'dist',
        },
        paths: {
          generators: '/absolute/path/generators', // absolute
        },
      };

      expect(() => RemoveGeneratorCommand['paths'](config)).toThrow(
        new MegaCommandError(
          'paths.generators cannot be absolute if typescript is enabled'
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
        .spyOn(RemoveGeneratorCommand as any, 'argument')
        .mockReturnValue('table');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(RemoveGeneratorCommand as any, 'paths').mockReturnValue(paths);
      jest.spyOn(MegaConfig, 'existMany').mockResolvedValue(undefined);
      jest.spyOn(config.cluster, 'request').mockResolvedValue(con);
      jest
        .spyOn(GeneratorHandler.prototype, 'remove')
        .mockResolvedValue('message');
      jest.spyOn(RemoveGeneratorCommand, 'success').mockReturnValue(undefined);

      const result = await RemoveGeneratorCommand.exec();

      expect(result).toBeUndefined();
      expect(MegaConfig.load).toHaveBeenCalledWith();
      expect((RemoveGeneratorCommand as any).argument).toHaveBeenCalledWith(
        'table'
      );
      expect((RemoveGeneratorCommand as any).paths).toHaveBeenCalledWith(
        config
      );
      expect(MegaConfig.existMany).toHaveBeenCalledWith(paths);
      expect(config.cluster.request).toHaveBeenCalledWith(undefined);
      expect(GeneratorHandler.prototype.remove).toHaveBeenCalledTimes(2);
      expect(GeneratorHandler.prototype.remove).toHaveBeenNthCalledWith(
        1,
        'table',
        paths[0]
      );
      expect(GeneratorHandler.prototype.remove).toHaveBeenNthCalledWith(
        2,
        'table',
        paths[1]
      );
      expect(RemoveGeneratorCommand.success).toHaveBeenCalledWith(
        'message\nmessage'
      );
    });

    it('should reject if argument fails', async () => {
      const error = new Error('Ops');

      jest
        .spyOn(RemoveGeneratorCommand as any, 'argument')
        .mockImplementation(() => {
          throw error;
        });

      await expect(RemoveGeneratorCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if load fails', async () => {
      const error = new Error('Ops');

      jest
        .spyOn(RemoveGeneratorCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockRejectedValue(error);

      await expect(RemoveGeneratorCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if paths fails', async () => {
      const error = new Error('Ops');
      const config: any = { typescript: { enabled: true } };

      jest
        .spyOn(RemoveGeneratorCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest
        .spyOn(RemoveGeneratorCommand as any, 'paths')
        .mockImplementation(() => {
          throw error;
        });

      await expect(RemoveGeneratorCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if existMany fails', async () => {
      const paths = ['/resolved/path/commands'];
      const error = new Error('Ops');
      const config: any = { typescript: { enabled: true } };

      jest
        .spyOn(RemoveGeneratorCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(RemoveGeneratorCommand as any, 'paths').mockReturnValue(paths);
      jest.spyOn(MegaConfig, 'existMany').mockRejectedValue(error);

      await expect(RemoveGeneratorCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if request fails', async () => {
      const paths = ['/resolved/path/commands'];
      const error = new Error('Ops');
      const config: any = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };

      jest
        .spyOn(RemoveGeneratorCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(RemoveGeneratorCommand as any, 'paths').mockReturnValue(paths);
      jest.spyOn(MegaConfig, 'existMany').mockResolvedValue(undefined);
      jest.spyOn(config.cluster, 'request').mockRejectedValue(error);

      await expect(RemoveGeneratorCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if remove fails', async () => {
      const paths = ['/resolved/path/commands'];
      const error = new Error('Ops');
      const config: any = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };

      jest
        .spyOn(RemoveGeneratorCommand as any, 'argument')
        .mockReturnValue('name');
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(RemoveGeneratorCommand as any, 'paths').mockReturnValue(paths);
      jest.spyOn(MegaConfig, 'existMany').mockResolvedValue(undefined);
      jest.spyOn(config.cluster, 'request').mockResolvedValue(con);
      jest.spyOn(GeneratorHandler.prototype, 'remove').mockRejectedValue(error);

      await expect(RemoveGeneratorCommand.exec()).rejects.toThrow(error);
    });
  });
});
