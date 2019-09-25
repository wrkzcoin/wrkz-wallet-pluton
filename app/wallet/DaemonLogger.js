// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import path from 'path';
import os from 'os';
import log from 'electron-log';
import { Tail } from 'tail';
import { directories, eventEmitter } from '../index';

export default class DaemonLogger {
  daemonLog: string[];

  daemonLogPath: string;

  daemonLogTail: Tail;

  constructor() {
    this.daemonLog = [];
    this.daemonLogPath = path.resolve(directories[1], 'TurtleCoind.log');

    const tailOptions = {
      separator: /[\r]{0,1}\n/,
      fromBeginning: true,
      fsWatchOptions: {},
      follow: true,
      useWatchFile: os.platform() === 'win32',
      logger: log
    };
    this.daemonLogTail = new Tail(this.daemonLogPath, tailOptions);
    this.pushToLog = this.pushToLog.bind(this);
    this.daemonLogTail.on('line', data => this.pushToLog(data));
  }

  pushToLog = (data: string) => {
    this.daemonLog.unshift(data);
    eventEmitter.emit('refreshConsole');
  };
}
