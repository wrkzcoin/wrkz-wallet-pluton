import { WalletBackend, BlockchainCacheApi } from 'turtlecoin-wallet-backend';
import log from 'electron-log';

export default class WalletSession {
  constructor(opts) {
    this.daemon = new BlockchainCacheApi('blockapi.turtlepay.io', true);
    const [
      programDirectory,
      logDirectory,
      walletDirectory
    ] = window.directories;
    let [openWallet, error] = WalletBackend.openWalletFromFile(
      this.daemon,
      `${walletDirectory}/proton.wallet`,
      'hunter2'
    );
    if (error) {
      log.debug(error);
      if (error.errorCode == 1) {
        log.debug('Didn\'t find default wallet file, creating...')
        openWallet = WalletBackend.createWallet(this.daemon);
      }
    }
    this.wallet = openWallet;
    this.syncStatus = this.updateSyncStatus();
    this.address = this.wallet.getPrimaryAddress();
  }

  updateSyncStatus() {
    let [
      walletHeight,
      localHeight,
      networkHeight
    ] = this.wallet.getSyncStatus();
    /* Since we update the network height in intervals, and we update wallet
        height by syncing, occasionaly wallet height is > network height.
        Fix that here. */
    if (
      walletHeight > networkHeight &&
      networkHeight !== 0 &&
      networkHeight + 10 > walletHeight
    ) {
      networkHeight = walletHeight;
    }
    /* if the wallet has been synced in the past, the wallet will sometimes display
        currentHeight / 0, so if networkHeight is 0 set it equal to block height */
    if (networkHeight === 0 && walletHeight !== 0) {
      networkHeight = walletHeight;
    }
    // Don't divide by zero
    let syncFill = networkHeight === 0 ? 0 : walletHeight / networkHeight;
    let percentSync = 100 * syncFill;
    // Prevent bar looking full when it's not
    if (syncFill > 0.97 && syncFill < 1) {
      syncFill = 0.97;
    }
    // Prevent 100% when just under
    if (percentSync > 99.99 && percentSync < 100) {
      percentSync = 99.99;
    }
    return this.roundToNearestHundredth(percentSync);
  }

  roundToNearestHundredth(x) {
    return Math.ceil(x * 100) / 100;
  }
}
