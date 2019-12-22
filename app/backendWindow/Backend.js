// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import { Daemon, WalletBackend } from 'turtlecoin-wallet-backend';

export default class Backend {
  daemon: Daemon;

  daemonHost: string;

  daemonPort: number;

  walletFile: string;

  walletPassword: string = '';

  wallet: any;

  constructor(config: any) {
    this.daemonHost = config.daemonHost;
    this.daemonPort = config.daemonPort;
    this.walletFile = config.walletFile;
    this.daemon = new Daemon(this.daemonHost, this.daemonPort);
  }

  openWallet(password: string) {
    this.walletPassword = password;
    const [openWallet, error] = WalletBackend.openWalletFromFile(
      this.daemon,
      this.walletFile,
      this.walletPassword
    );
    if (!error) {
      this.wallet = openWallet;
      this.wallet.start();
      console.log(this.wallet.getSyncStatus());
      console.log('wallet started.');
    } else {
      console.log(error);
    }
  }
}
