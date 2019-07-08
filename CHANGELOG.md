## Changelog

**v0.0.12:** this version brings automatic release building and deployment to both github releases and the snap store. also, it's the first non-beta release.

**v0.0.11-beta:** adds a rescan wallet item to settings, allowing users to rescan their wallet from a desired block height

**v0.0.10-beta:** checks on startup to see if there's an updated version and if so prompts to download it

**v0.0.9-beta:** adds mac support, so we have mac binaries being released for the first time, along with some other small (travis-related) fixes.

**v0.0.8-beta:** adds some enhancements to the send form, also fixes a bug in the payment ID field

**v0.0.7-beta:** fix a "bug" where I forgot to update the balance on the navbar on transactions

**v0.0.6-beta:** add some autosave logic, the wallet now saves to file any time you open a new wallet or close the application automatically

**v0.0.5-beta:** implement a splash screen when there's not a wallet defined to give the user a choice on what to do on startup rather than auto-creating a wallet

**v0.0.4-beta**: Initial beta release, has basic wallet functionality including:

* opening and saving wallets
* restoring wallets from keys and seed
* backing up private keys and seed
* viewing balance and transcations
* sending transactions
* changing the connected node
* changing the wallet password
