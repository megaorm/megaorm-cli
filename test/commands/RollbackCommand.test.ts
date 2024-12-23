import { RollbackCommand } from '../../src/commands/RollbackCommand';
import { MegaConfig } from '../../src/MegaConfig';
import { GeneratorHandler } from '../../src/handlers/GeneratorHandler';
import { MegaCluster } from '@megaorm/cluster';

const con = {
  id: Symbol('MegaPoolConnection'),
} as any;

describe('RollbackCommand', () => {
  describe('exec', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should resolve with a success message', async () => {
      const message = 'Command executed successfully';
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };

      // Mock dependencies
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(MegaCluster.prototype, 'request').mockResolvedValue(con);
      jest
        .spyOn(GeneratorHandler.prototype, 'rollback')
        .mockResolvedValue(message);
      jest.spyOn(RollbackCommand, 'success').mockReturnValue(undefined);

      // Execute the method
      const result = await RollbackCommand.exec();

      // Assertions
      expect(result).toBeUndefined();
      expect(MegaConfig.load).toHaveBeenCalledWith();
      expect(config.cluster.request).toHaveBeenCalledWith(undefined);
      expect(GeneratorHandler.prototype.rollback).toHaveBeenCalledWith();
      expect(RollbackCommand.success).toHaveBeenCalledWith(message);
    });

    it('should reject if request fails', async () => {
      const error = new Error('Ops');
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };

      // Mock dependencies
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(MegaCluster.prototype, 'request').mockRejectedValue(error);

      await expect(RollbackCommand.exec()).rejects.toThrow(error);
    });

    it('should reject if rollback fails', async () => {
      const error = new Error('Ops');
      const config = {
        typescript: { enabled: true },
        cluster: new MegaCluster(),
      };

      // Mock dependencies
      jest.spyOn(MegaConfig, 'load').mockResolvedValue(config);
      jest.spyOn(MegaCluster.prototype, 'request').mockResolvedValue(con);
      jest
        .spyOn(GeneratorHandler.prototype, 'rollback')
        .mockRejectedValue(error);

      await expect(RollbackCommand.exec()).rejects.toThrow(error);
    });
  });
});
