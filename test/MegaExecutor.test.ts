import {
  execute,
  MegaExecutor,
  MegaExecutorError,
  register,
} from '../src/MegaExecutor';
import { MegaCommand } from '../src/MegaCommand';

/**
 * A mock command class extending MegaCommand to use in tests.
 */
class MockCommand extends MegaCommand {
  static exec = jest.fn(() => Promise.resolve()) as any;
}

describe('MegaExecutor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a valid command', () => {
      register('mock_command', MockCommand);

      expect(MegaExecutor['commands']).toContainEqual({
        name: 'mock_command',
        command: MockCommand,
      });
    });

    it('should throw an error if the command is not a subclass of MegaCommand', () => {
      class InvalidCommand {}

      expect(() => {
        register('invalid_command', InvalidCommand as any);
      }).toThrow(MegaExecutorError);

      expect(() => {
        register('invalid_command', InvalidCommand as any);
      }).toThrow(`Invalid command: ${String(InvalidCommand)}`);
    });

    it('should throw an error if the name is not a valid string', () => {
      expect(() => {
        register('', MockCommand);
      }).toThrow(MegaExecutorError);

      expect(() => {
        register('', MockCommand);
      }).toThrow('Invalid command name: ');
    });

    it('should throw an error if the name already exists', () => {
      expect(() => {
        register('mock_command', MockCommand);
      }).toThrow(MegaExecutorError);

      expect(() => {
        register('mock_command', MockCommand);
      }).toThrow('Deplicated command names: mock_command');
    });
  });

  describe('execute', () => {
    it('should execute a registered command successfully', async () => {
      process.argv = ['node', 'script.js', 'mock_command'];

      await execute();

      expect(MockCommand.exec).toHaveBeenCalled();
    });

    it('should reject if the command name is undefined', async () => {
      process.argv = ['node', 'script.js'];

      await expect(execute()).rejects.toThrow(MegaExecutorError);
      await expect(execute()).rejects.toThrow('Undefined command name');
    });

    it('should reject if the command is unknown', async () => {
      process.argv = ['node', 'script.js', 'unknown_command'];

      await expect(execute()).rejects.toThrow(MegaExecutorError);
      await expect(execute()).rejects.toThrow(
        'Unknown command: unknown_command'
      );
    });

    it('should reject if command.exec throws', async () => {
      MockCommand.exec = jest.fn(() => {
        throw new Error('Non-promise execution failed');
      });

      process.argv = ['node', 'script.js', 'mock_command'];

      await expect(execute()).rejects.toThrow('Non-promise execution failed');

      expect(MockCommand.exec).toHaveBeenCalled();
    });

    it('should reject if command.exec rejectes', async () => {
      MockCommand.exec = jest.fn(() =>
        Promise.reject(new Error('Promise execution failed'))
      );

      process.argv = ['node', 'script.js', 'mock_command'];

      await expect(execute()).rejects.toThrow('Promise execution failed');

      expect(MockCommand.exec).toHaveBeenCalled();
    });

    it('should resolve with command.exec resolve value', async () => {
      MockCommand.exec = jest.fn(() => Promise.resolve('done'));

      process.argv = ['node', 'script.js', 'mock_command'];

      const result = await execute();

      expect(result).toBe('done');
      expect(MockCommand.exec).toHaveBeenCalled();
    });

    it('should resolve with command.exec return value', async () => {
      MockCommand.exec = jest.fn(() => 'done');

      process.argv = ['node', 'script.js', 'mock_command'];

      const result = await execute();

      expect(result).toBe('done');
      expect(MockCommand.exec).toHaveBeenCalled();
    });
  });
});
