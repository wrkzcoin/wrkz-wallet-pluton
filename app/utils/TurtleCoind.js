// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import * as child from 'child_process';
import log from 'electron-log';
import os from 'os';
import path from 'path';

const homedir = os.homedir();

const directories = [
  `${homedir}/.protonwallet`,
  `${homedir}/.protonwallet/logs`
];

export default class TurtleCoind {
  path: string;

  child: any;

  arguments: string;

  constructor() {
    this.path = 'TurtleCoind';
    this.arguments = `--log-file ${path.resolve(
      directories[1],
      'TurtleCoind.log'
    )}`;
    this.child = null;
    this.quit = this.quit.bind(this);
    this.init();
  }

  init = () => {
    this.child = child.exec(
      `${this.path} ${this.arguments}`,
      { maxBuffer: 1024 * 500, windowsHide: true },
      // eslint-disable-next-line no-unused-vars
      (err, stdout, stderr) => {
        // some stuff here
        log.debug(err);
      }
    );
  };

  quit = async () => {
    this.child.kill();
  };
}
