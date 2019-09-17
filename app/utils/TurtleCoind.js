// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import * as child from 'child_process';
import log from 'electron-log';

export default class TurtleCoind {
  path: string;

  child: any;

  constructor() {
    this.path = 'TurtleCoind';
    this.child;
    this.init();
  }

  init() {
    this.child = child.exec(
      this.path,
      { maxBuffer: 1024 * 500 },
      (err, stdout, stderr) => {
        log.debug(stdout);
        if (err) {
          log.debug(err);
        }
      }
    );
  }
}
