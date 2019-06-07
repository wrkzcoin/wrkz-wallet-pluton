"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var turtlecoin_wallet_backend_1 = require("turtlecoin-wallet-backend");
var WalletSession = /** @class */ (function () {
    function WalletSession(opts) {
        this.daemon = new turtlecoin_wallet_backend_1.BlockchainCacheApi('blockapi.turtlepay.io', true);
        var openWallet = turtlecoin_wallet_backend_1.WalletBackend.createWallet(this.daemon);
        this.wallet = openWallet;
        this.syncStatus = this.updateSyncStatus();
        this.address = this.wallet.getPrimaryAddress();
    }
    WalletSession.prototype.updateSyncStatus = function () {
        var _a = this.wallet.getSyncStatus(), walletHeight = _a[0], localHeight = _a[1], networkHeight = _a[2];
        /* Since we update the network height in intervals, and we update wallet
        height by syncing, occasionaly wallet height is > network height.
        Fix that here. */
        if (walletHeight > networkHeight && networkHeight !== 0 && networkHeight + 10 > walletHeight) {
            networkHeight = walletHeight;
        }
        /* if the wallet has been synced in the past, the wallet will sometimes display
        currentHeight / 0, so if networkHeight is 0 set it equal to block height */
        if (networkHeight === 0 && walletHeight !== 0) {
            networkHeight = walletHeight;
        }
        // Don't divide by zero
        var syncFill = networkHeight === 0 ? 0 : walletHeight / networkHeight;
        var percentSync = 100 * syncFill;
        // Prevent bar looking full when it's not
        if (syncFill > 0.97 && syncFill < 1) {
            syncFill = 0.97;
        }
        // Prevent 100% when just under
        if (percentSync > 99.99 && percentSync < 100) {
            percentSync = 99.99;
        }
        return this.roundToNearestHundredth(percentSync);
    };
    WalletSession.prototype.roundToNearestHundredth = function (x) {
        return Math.ceil(x * 100) / 100;
    };
    return WalletSession;
}());
exports.WalletSession = WalletSession;
