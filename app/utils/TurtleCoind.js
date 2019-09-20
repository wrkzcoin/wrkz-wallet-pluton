// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import * as child from 'child_process';
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

  turtleCoindPath: string;

  err: Error | null;

  constructor(turtleCoindPath: string) {
    this.path = turtleCoindPath;
    this.arguments = `--log-file ${path.resolve(
      directories[1],
      'TurtleCoind.log'
    )}`;
    this.err = null;
    this.child = child.exec(
      `${this.path} ${this.arguments}`,
      { maxBuffer: 1024 * 500, windowsHide: true },
      // eslint-disable-next-line no-unused-vars
      (err, stdout, stderr) => {
        // some stuff here
        if (err) {
          throw err;
        }
      }
    );
    this.quit = this.quit.bind(this);
  }

  quit = async () => {
    this.child.kill();
  };
}
