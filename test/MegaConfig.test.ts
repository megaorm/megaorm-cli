import { MegaConfig, MegaORMConfig } from '../src/MegaConfig';
import { MegaCluster } from '@megaorm/cluster';

// Mock exist
MegaConfig.exist = jest.fn(() => Promise.resolve());

describe('MegaConfig.load()', () => {
  it('should resolve with a valid configuration', async () => {
    // Mock config
    jest.doMock(
      'root\\mega.config.js',
      () => ({
        default: 'default_pool',
        cluster: new MegaCluster(),
      }),
      { virtual: true }
    );

    // Mock resolveSync
    MegaConfig.resolveSync = jest.fn(() => 'root');

    const config = await MegaConfig.load<MegaORMConfig>();

    expect(config.default).toBe('default_pool');
    expect(config.cluster).toBeInstanceOf(MegaCluster);
    expect(config.paths?.models).toBe('models');
    expect(config.paths?.seeders).toBe('seeders');
    expect(config.paths?.commands).toBe('commands');
    expect(config.paths?.generators).toBe('generators');
    expect(config.typescript?.enabled).toBe(false);
    expect(config.typescript?.src).toBe('src');
    expect(config.typescript?.dist).toBe('dist');
  });

  it('should reject with an error if the configuration is not an object', async () => {
    jest.doMock(
      'root1\\mega.config.js',
      () => 'invalid_config', // Return something other than an object.
      { virtual: true }
    );

    // Mock resolveSync
    MegaConfig.resolveSync = jest.fn(() => 'root1');

    // Clear cache
    (MegaConfig as any).config = undefined;

    // Test validation
    await expect(MegaConfig.load()).rejects.toThrow(
      'Invalid config: Expected an object but received string.'
    );
  });

  it('should reject with an error if the cluster is invalid', async () => {
    jest.doMock(
      'root2\\mega.config.js',
      () => ({
        default: 'default_pool',
        cluster: {}, // Invalid cluster.
      }),
      { virtual: true }
    );

    // Mock resolveSync
    MegaConfig.resolveSync = jest.fn(() => 'root2');

    // Clear cache
    (MegaConfig as any).config = undefined;

    // Test validation
    await expect(MegaConfig.load()).rejects.toThrow(
      'Invalid config.cluster: Expected an instance of MegaCluster but received object.'
    );
  });

  it('should reject with an error if the default pool name is invalid', async () => {
    jest.doMock(
      'root3\\mega.config.js',
      () => ({
        default: 123, // Invalid default pool name (not a string).
        cluster: new MegaCluster(),
      }),
      { virtual: true }
    );

    // Mock resolveSync
    MegaConfig.resolveSync = jest.fn(() => 'root3');

    // Clear cache
    (MegaConfig as any).config = undefined;

    // Test validation
    await expect(MegaConfig.load()).rejects.toThrow(
      'Invalid config.default: Expected a valid default pool name but received number.'
    );
  });
});
