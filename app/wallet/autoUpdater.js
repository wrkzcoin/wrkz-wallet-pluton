import request from 'request-promise';
import npmPackage from '../../package.json';
import log from 'electron-log';
import semver from 'semver';
import { eventEmitter } from '../index';
import os from 'os';

const operatingSystem = os.platform();

export default class AutoUpdater {

  getLatestVersion() {
    const options = { method: 'GET', url: 'http://68.183.53.229:3000/latest', json: true };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      if (semver.gt(body.latestVersion, npmPackage.version)) {
        log.debug('Update required! Local version: ' + npmPackage.version + ', latest version: ' + body.latestVersion)
        let updateFile;
        if (operatingSystem === 'linux') {
          updateFile = body.downloadLinux
        } else if (operatingSystem === 'win32') {
          updateFile = body.downloadWindows
        } else if (operatingSystem === 'darwin') {
          updateFile = body.downloadMac
        } else {
          log.debug('Unsupported operating system for automatic updates. Please see build instructions at https://github.com/turtlecoin/turtle-wallet-proton#readme');
        }
        eventEmitter.emit('updateRequired', updateFile);
      };
      return body;
    });
  }

}

