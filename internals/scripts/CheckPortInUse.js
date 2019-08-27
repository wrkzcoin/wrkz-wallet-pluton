// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import chalk from 'chalk';
import detectPort from 'detect-port';

(function CheckPortInUse() {
  const port: string = process.env.PORT || '1212';

  detectPort(port, (err: ?Error, availablePort: number) => {
    if (port !== String(availablePort)) {
      throw new Error(
        chalk.whiteBright.bgRed.bold(
          `Port "${port}" on "localhost" is already in use. Please use another port. ex: PORT=4343 yarn dev`
        )
      );
    } else {
      process.exit(0);
    }
  });
})();
