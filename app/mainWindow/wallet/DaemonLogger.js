// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import os from 'os';
import log from 'electron-log';
import { Tail } from 'tail';
import { eventEmitter } from '../index';

export default class DaemonLogger {
  daemonLog: string[];

  daemonLogPath: string;

  daemonLogTail: Tail;

  constructor(logPath: string) {
    this.daemonLog = [];
    this.daemonLogPath = logPath;

    const tailOptions = {
      separator: /[\r]{0,1}\n/,
      fromBeginning: false,
      fsWatchOptions: {},
      follow: true,
      useWatchFile: os.platform() === 'win32',
      logger: log
    };
    this.daemonLogTail = new Tail(this.daemonLogPath, tailOptions);
    this.pushToLog = this.pushToLog.bind(this);
    this.daemonLogTail.on('line', data => this.pushToLog(data));
  }

  stopTail() {
    this.daemonLogTail.unwatch();
  }

  pushToLog = (data: string) => {
    this.daemonLog.unshift(data);
    if (this.daemonLog.length > 1000) {
      this.daemonLog.pop();
    }
    eventEmitter.emit('refreshConsole');
  };
}
