import { VersionCommand } from '../../src/commands/VersionCommand';
import { Config } from '@megaorm/config';
import { MegaCommandError } from '../../src/MegaCommand';

// Mock the Config.loadJSON method
jest.mock('@megaorm/config', () => ({
  Config: {
    loadJSON: jest.fn(),
  },
}));

describe('VersionCommand', () => {
  beforeEach(() => {
    // Reset mock implementation before each test
    jest.clearAllMocks();
  });

  it('should log the version from package.json on success', async () => {
    // Arrange: mock Config.loadJSON to resolve with a fake version
    const mockVersion = '1.0.0';
    (Config.loadJSON as jest.Mock).mockResolvedValueOnce({
      version: mockVersion,
    });

    // Capture console output
    const consoleWarningSpy = jest
      .spyOn(VersionCommand, 'warning')
      .mockImplementation(() => {}); // do nothing

    // Act: execute the command
    await VersionCommand.exec();

    // Assert: verify the version was logged
    expect(consoleWarningSpy).toHaveBeenCalledWith(mockVersion);
  });

  it('should throw an error if loading package.json fails', async () => {
    // Arrange: mock Config.loadJSON to reject with an error
    (Config.loadJSON as jest.Mock).mockRejectedValueOnce(
      new Error('File not found')
    );

    // Act & Assert: expect the error to be thrown
    await expect(VersionCommand.exec()).rejects.toThrow(
      new MegaCommandError('Falied to load package.json')
    );
  });
});
