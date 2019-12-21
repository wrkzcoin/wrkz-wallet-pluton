// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';

function CheckBuildsExist() {
  const mainPath = path.join(__dirname, '..', '..', 'app', 'main.prod.js');
  const rendererPath = getRendererPath('mainWindow');

  if (!fs.existsSync(mainPath)) {
    throw new Error(
      chalk.whiteBright.bgRed.bold(
        'The main process is not built yet. Build it by running "yarn build-main"'
      )
    );
  }

  if (!fs.existsSync(rendererPath)) {
    throw new Error(
      chalk.whiteBright.bgRed.bold(
        'The mainWindow renderer process is not built yet. Build it by running "yarn build-renderer"'
      )
    );
  }
}

function getRendererPath(name: string) {
  return path.join(
    __dirname,
    '..',
    '..',
    'app',
    'dist',
    `${name}.renderer.prod.js`
  );
}

CheckBuildsExist();
