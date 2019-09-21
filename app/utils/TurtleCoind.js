// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import child from 'child_process';
import os from 'os';
import path from 'path';
import log from 'electron-log';

const homedir = os.homedir();
const operatingSystem = os.platform();

const directories = [
  `${homedir}/.protonwallet`,
  `${homedir}/.protonwallet/logs`
];

export default class TurtleCoind {
  path: string;

  child: any;

  arguments: string;

  logPath: string;

  turtleCoindPath: string;

  err: Error | null;

  constructor(turtleCoindPath: string) {
    this.path = turtleCoindPath;
    this.arguments = `--log-file`;
    this.logPath = path.resolve(directories[1], 'TurtleCoind.log');
    this.err = null;
    this.child = child.spawn(this.path, [this.arguments, this.logPath], {
      maxBuffer: 1024 * 500,
      windowsHide: true
    });
    log.debug(this.child.pid);
    this.quit = this.quit.bind(this);
  }

  quit = async () => {
    if (operatingSystem === 'win32') {
      child.spawn('TASKKILL', ['/PID', this.child.pid]);
    } else {
      this.child.kill('SIGTERM');
    }
  };
}
