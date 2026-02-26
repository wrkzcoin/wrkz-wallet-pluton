// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import fs from 'fs';
import log from 'electron-log';
import { config } from '../index';

export default class PlutonConfig {
  configPath;

  constructor(pConfig: any, configPath: string) {
    this.config = pConfig;
    this.configPath = configPath;
  }

  getConfigPath(): string {
    return this.configPath;
  }

  setConfigPath(path: string) {
    this.configPath = path;
  }

  modifyConfig(propertyName: string, value: any) {
    const programDirectory = this.getConfigPath();
    log.debug(`Config update: ${propertyName} set to ${String(value)}`);
    config[propertyName] = value;
    try {
      fs.writeFileSync(
        `${programDirectory}/config.json`,
        JSON.stringify(config, null, 4)
      );
    } catch (err) {
      log.error('Failed to write config file.', err);
      return false;
    }
    return true;
  }
}
