## MegaORM CLI

This package allows you to communicate with MegaORM via commands directly from the command line interface (CLI), with support for defining and executing custom commands.

## Table of Contents

1. **[Installation](#installation)**
2. **[MegaORM Config](#megaorm-config)**
3. **[MegaORM Executor](#megaorm-executor)**
4. **[Built-in Commands](#built-in-commands)**
5. **[Custom Commands](#custom-commands)**
6. **[Output Methods](#output-methods)**

## Installation

To install this package, run the following command:

```bash
npm install @megaorm/cli
```

> You should be familiar with [@megaorm/pool](https://github.com/megaorm/megaorm-pool) and [@megaorm/cluster](https://github.com/megaorm/megaorm-cluster).

## MegaORM Config

This package requires a configuration file `mega.config.js` at the root of your project. Below is a breakdown of the configuration options, their purposes, and examples.

### Required Options

1. `cluster`: A `MegaCluster` instance representing your database setup. It can contain multiple pools, with different drivers (e.g., `MySQL`, `PostgreSQL`, `SQLite`).

2. `default`: The name of the pool `MegaORM` will use for connections by default.

Here’s an example of a `mega.config.js` file:

```js
const { resolve } = require('path');
const { MegaCluster } = require('@megaorm/cluster');
const { MegaClusterPool } = require('@megaorm/cluster');
const { MySQL } = require('@megaorm/mysql');
const { PostgreSQL } = require('@megaorm/pg');
const { SQLite } = require('@megaorm/sqlite');

module.exports = {
  // Default pool name MegaORM will use
  default: 'mysql',

  // Cluster setup with three database pools
  cluster: new MegaCluster(
    new MegaClusterPool(
      'mysql', // Pool name
      new MySQL({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'main',
      })
    ),
    new MegaClusterPool(
      'pg', // Pool name
      new PostgreSQL({
        host: 'localhost',
        user: 'postgres',
        password: 'root',
        database: 'main',
      })
    ),
    new MegaClusterPool(
      'sqlite', // Pool name
      new SQLite(resolve(__dirname, './database.sqlite'))
    )
  ),
};
```

In this setup:

- `mysql` is the default pool to request connections from.
- The `cluster` contains three database pools: `mysql`, `pg`, and `sqlite`. Each pool is defined with its respective driver and connection details.

### Optional Options

1. `paths`: An object that specifies custom paths for MegaORM folders. If not provided, MegaORM uses the default paths.

| Property           | Description                         | Default Path        |
| ------------------ | ----------------------------------- | ------------------- |
| `paths.generators` | Path to your **generators** folder. | `<root>/generators` |
| `paths.seeders`    | Path to your **seeders** folder.    | `<root>/seeders`    |
| `paths.models`     | Path to your **models** folder.     | `<root>/models`     |
| `paths.commands`   | Path to your **commands** folder.   | `<root>/commands`   |

2. `typescript`: An object to enable and configure TypeScript support.

| Property             | Description                                       | Default       |
| -------------------- | ------------------------------------------------- | ------------- |
| `typescript.enabled` | Enable TypeScript support (boolean).              | `false`       |
| `typescript.src`     | Path to the **source** folder when TS is enabled. | `<root>/src`  |
| `typescript.dist`    | Path to the **dist** folder when TS is enabled.   | `<root>/dist` |

- When `typescript.enabled` is `false`, commands like `node mega add:model <table>` will add js files.
- When `typescript.enabled` is `true`, the same command will add TypeScript files.

Here’s a complete example combining all options:

```js
const { resolve } = require('path');
const { MegaCluster } = require('@megaorm/cluster');
const { MegaClusterPool } = require('@megaorm/cluster');
const { MySQL } = require('@megaorm/mysql');
const { PostgreSQL } = require('@megaorm/pg');
const { SQLite } = require('@megaorm/sqlite');

module.exports = {
  default: 'mysql',
  cluster: new MegaCluster(
    new MegaClusterPool(
      'mysql',
      new MySQL({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'main',
      })
    ),
    new MegaClusterPool(
      'pg',
      new PostgreSQL({
        host: 'localhost',
        user: 'postgres',
        password: 'root',
        database: 'main',
      })
    ),
    new MegaClusterPool(
      'sqlite',
      new SQLite(resolve(__dirname, './database.sqlite'))
    )
  ),
  paths: {
    generators: './gens', // Store generator files in gens folder
    seeders: './seeders',
    models: './models',
    commands: './cmds', // Store command files in cmds folder
  },
  typescript: {
    enabled: true, // Enable typescript support
    src: './src',
    dist: './dist',
  },
};
```

> If typescript is enabled `paths` must be relative

### Loading Configuration

You can also load your `mega.config.js` file from anywhere in your project. This is very useful because it provides easy access to your `MegaCluster` and allows you to define custom options if needed.

Start by importing **MegaConfig** from `@megaorm/cli` into your project:

```js
import { MegaConfig } from '@megaorm/cli';
```

Now you can load `mega.config.js` from anywhere in your project using the `MegaConfig.load()` method. This method will return a promise that resolves with the configuration object.

```js
MegaConfig.load().then((config) => console.log(config));
```

- The `load` method:
  - Loads the configuration from the `mega.config.js` file.
  - Caches the configuration after the first load for better performance.
  - Runs registered validators to ensure the configuration is valid.

### Loading Other Configurations

If you need to load a custom configuration file, you can extend [@megaorm/config](https://github.com/megaorm/megaorm-config) to create your own configuration loader. For example:

```js
// Import Config
const { Config } = require('@megaorm/config');

// Extend Config
class NodeJSConfig extends Config {
  static file = 'package.json'; // Load package.json
  static default = { version: '1.0.0' }; // Default package.json config
}

// Export NodeJSConfig
module.exports = { NodeJsConfig };

// Now you can use `NodeJSConfig` to load package.json anywhere you like
NodeJSConfig.load().then((config) => console.log(config));

// Get the project root from any sub-folder
NodeJSConfig.resolveSync();

// Load any JSON config
NodeJSConfig.loadJSON(path);

// Load any JS config
NodeJSConfig.loadJS(path);
```

## MegaORM Executor

Once your `mega.config.js` file is set up, you can start executing commands. Here's how:

1. Create a `mega.js` file in your root folder:

```bash
touch mega.js
```

2. Import `execute()` from `@megaorm/cli`:

```js
const { execute } = require('@megaorm/cli');
```

3. Call the `execute` method and handle errors:

```js
execute()
  .then(() => process.exit()) // Stop the process
  .catch((error) => console.error(error.message));
```

This setup allows you to interact with MegaORM via commands. For example:

```bash
node mega version
```

or

```bash
node mega v
```

Both commands will output the current version of MegaORM.

## Built-in Commands

Below is the full list of built-in commands:

| **Command**                           | **Description**                                 |
| ------------------------------------- | ----------------------------------------------- |
| `node mega add:command <!name>`       | Adds a command file.                            |
| `node mega add:cmd <!name>`           | Shortcut for `add:command`.                     |
| `node mega add:model <!table>`        | Adds a model file for a table.                  |
| `node mega add:seeder <!table>`       | Adds a seeder file for a table.                 |
| `node mega add:generator <!table>`    | Adds a generator file for a table.              |
| `node mega add:gen <!table>`          | Shortcut for `add:generator`.                   |
| `node mega add:for <!table>`          | Adds generator, seeder, and model files.        |
| `node mega remove:command <!name>`    | Removes a command file.                         |
| `node mega remove:cmd <!name>`        | Shortcut for `remove:command`.                  |
| `node mega remove:model <!table>`     | Removes a model file.                           |
| `node mega remove:seeder <!table>`    | Removes a seeder file.                          |
| `node mega remove:generator <!table>` | Removes a generator file.                       |
| `node mega remove:gen <!table>`       | Shortcut for `remove:generator`.                |
| `node mega remove:for <!table>`       | Removes generator, seeder, and model files.     |
| `node mega generate`                  | Executes generators and creates tables.         |
| `node mega gen`                       | Shortcut for `generate`.                        |
| `node mega rollback`                  | Executes generators and drops tables.           |
| `node mega roll`                      | Shortcut for `rollback`.                        |
| `node mega reset`                     | Drops all your tables.                          |
| `node mega seed <?table>`             | Seeds all tables or a specific table.           |
| `node mega clear <?table>`            | Clears all tables or a specific table.          |
| `node mega fetch <!table> <?id>`      | Fetches data from a table, with an optional ID. |
| `node mega version`                   | Outputs MegaORM's current version.              |
| `node mega v`                         | Shortcut for `version`.                         |

## Custom Commands

You can extend `MegaCommand` to create custom commands for your application. Here's a simple step-by-step guide to define custom commands like a pro:

### Adding New Command

To create a new command, run the following in your terminal:

```bash
node mega add:command GreetCommand
```

This creates a new file at: `./commands/GreetCommand.js`

### Template Overview

When you open the `GreetCommand.js` file, you'll see this:

```js
const { MegaCommand } = require('@megaorm/cli');

class GreetCommand extends MegaCommand {
  static syntax = '';
  static exec() {
    // Your command logic here...
  }
}

module.exports = { GreetCommand };
```

This is a basic template for building a command. Let's break it down:

1. `syntax`: Define what arguments or options your command accepts.
2. `exec()`: Implement the logic that runs when the command is executed.

### Command Syntax

The `syntax` property lets you describe the inputs for your command. Inputs can be:

- Required arguments: `<! name>`
- Optional arguments: `<? name>`
- Options (flags): `<- name>`

For example, let’s make a command that says:

- `"Hello There!"` if no name is given.
- `"Hello Name!"` if a name is provided.

Since the name is optional, the syntax is:

```js
syntax = '<? name>';
```

### Command Logic

The `exec()` method contains the code that runs when the command is executed.  
Use `this.argument(name)` to get the value of arguments defined in the `syntax`. For example:

```js
exec() {
  // Fetch the optional argument 'name'
  const name = this.argument('name');

  // If a name is provided
  if (name) console.log(`Hello ${name}!`);

  // If no name is provided
  else console.log('Hello There!');
}
```

### Command Registration

To make your command executable, register it in the `mega.js` file in your project’s root:

1. Import the command:

```js
const { GreetCommand } = require('./commands/GreetCommand');
```

2. Register it with a name:

```js
register('greet', GreetCommand);
```

Your `mega.js` file will look like this:

```js
// Import modules
const { register, execute } = require('@megaorm/cli');
const { GreetCommand } = require('./commands/GreetCommand');

// Register commands
register('greet', GreetCommand);

// Execute commands
execute()
  .then(() => process.exit())
  .catch((error) => console.error(error.message));
```

### Command Execution

Run your command from the terminal:

```bash
node mega greet
# Outputs: "Hello There!"

node mega greet john
# Outputs: "Hello john!"
```

### Command Options

To add options (flags) to your command, include them in the syntax using `<- name>` and retrieve them with `this.option(name)`. Let’s add a `-lazy` option:

- If `-lazy` is used, the command says `"Hi!"` or `"Hi Name!"` instead of `"Hello"`.

```js
syntax = '<? name> <- lazy>';
```

```js
exec() {
  const name = this.argument('name');

  // Check if the -lazy option is used
  const lazy = this.option('lazy');

  if (lazy && name) console.log(`Hi ${name}!`);
  else if (lazy) console.log('Hi!');
  else if (name) console.log(`Hello ${name}!`);
  else console.log('Hello There!');
}
```

### Command Input and Casting

All command-line inputs are treated as **strings**. So you should convert them as needed.

```js
const age = Number(this.argument('age')); // Convert '23' to 23
```

### More Command Examples

Here’s a more advanced example of a command that inserts a user into a database:

- Required arguments: `email`, `password`
- Optional argument: `age`
- Option: `-male` (indicates gender)

```js
syntax = '<! email> <! password> <? age> <- male>';
```

```js
exec() {
  const email = this.argument('email');
  const password = this.argument('password');
  const gender = this.option('male') ? 'male' : 'female';
  const age = this.argument('age')
  ? Number(this.argument(age))
  : undefined;

  // Insert the user into the database (simplified example)
  console.log(
    `email: ${email}
     password: ${password}
     age: ${age}
     gender: ${gender}`
  );
}
```

Here’s a practical example of how to use `MegaCommand` to insert a user into a database.

```js
const { MegaCommand } = require('@megaorm/cli');
const { MegaConfig } = require('@megaorm/cli');

class InsertUserCommand extends MegaCommand {
  /**
   * Define the command syntax, as the following:
   * - `<! name>`: required argument
   * - `<? name>`: optional argument
   * - `<- name>`: option
   */
  static syntax = '<! email> <! password> <? age> <- male>';

  /**
   * This method is called when the command is executed.
   *
   * @returns No return value is required.
   */
  static async exec() {
    // Reference arguments and options
    const row = {
      email: this.argument('email'),
      password: this.argument('password'),
      age: this.argument('age') ? Number(this.argument('age')) : undefined,
      gender: this.option('male') ? 'male' : 'female',
    };

    // Build query
    const keys = Object.keys(row).filter((k) => row[k] !== undefined);
    const values = keys.map((k) => row[k]);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    const query = `INSERT INTO users (${columns}) VALUES (${placeholders});`;

    // Load MegaORM Config
    const config = await MegaConfig.load();

    // Request a Connection
    const connection = await config.cluster.request(config.default);

    // Execute an Insert Query
    await connection.query(query, values);

    // Log Success Message
    this.success(`User has been successfully created!`);
  }
}

module.exports = { InsertUserCommand };
```

Register this command in your `mega.js` file:

```js
// Import modules
const { register, execute } = require('@megaorm/cli');
const { GreetCommand } = require('./commands/GreetCommand');
const { InsertUserCommand } = require('./commands/InsertUserCommand');

// Register commands
register('greet', GreetCommand);
register('insert:user', InsertUserCommand);

// Execute commands
execute()
  .then(() => process.exit())
  .catch((error) => console.error(error.message));
```

You can now use the command to insert a user into the database:

```bash
# Insert a user with email, password, age, and gender
node mega insert:user user1@example.com password 25 -male

# Insert a user with only required fields
node mega insert:user user2@example.com password
```

- **MegaCommand** makes it easy to define and execute custom commands.
- Use `syntax` to describe inputs and `exec()` to write logic.
- Register your command and run it from the terminal.

Now you're ready to build powerful commands in your app! 🚀

## Output Methods

The `MegaCommand` class provides built-in methods for displaying messages in the terminal, each with a specific color to represent the message type:

1. `this.success(message)`: **Green** color is used for success messages, indicating that an operation has completed successfully.

```js
this.success('User created successfully!');
```

2. `this.info(message)`: **Blue** color is used for informational messages, providing helpful details or updates without indicating any issue.

```js
this.info('Current MegaORM version is 1.0.0');
```

3. `this.warning(message)`: **Yellow** color is used for warning messages, alerting the user to something that might require attention or could cause problems later.

```js
this.warning('Deprecated option, please update your configuration.');
```

4. `this.error(message)`: **Red** color is used for error messages, signaling that something went wrong and needs immediate attention.

```js
this.error('Invalid email address provided.');
```
