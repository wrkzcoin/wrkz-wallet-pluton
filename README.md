# THIS SOFTWARE IS STILL IN BETA AND IS NOT SAFE TO USE. PLEASE DO NOT USE IT AS A DAILY DRIVER WALLET.

# Proton Wallet - a TurtleCoin Wallet

<p>
  Proton Wallet is a TurtleCoin wallet that uses <a href="http://electron.atom.io/">Electron</a>, <a href="https://facebook.github.io/react/">React</a>, <a href="https://github.com/turtlecoin/turtlecoin-wallet-backend-js">Turtlecoin-Wallet-Backend-JS</a>, <a href="https://github.com/reactjs/redux">Redux</a>, <a href="https://github.com/reactjs/react-router">React Router</a>, <a href="http://webpack.github.io/docs/">Webpack</a> and <a href="https://github.com/gaearon/react-hot-loader">React Hot Loader</a>.
</p>

## Dependencies

* Node.JS installed 

https://nodejs.org/

* Yarn installed

https://yarnpkg.com/en/

## Install

First, clone the repo via git:

```bash
git clone https://github.com/ExtraHash/nova.git
```

And then install the dependencies with yarn.

```bash
$ cd nova
$ yarn
```

Run the wallet.

```bash
$ yarn start
```
To run the wallet in dev mode, use this command instead.

```bash
$ yarn dev
```

## Starting Development

Start the app in the `dev` environment. This starts the renderer process in [**hot-module-replacement**](https://webpack.js.org/guides/hmr-react/) mode and starts a webpack dev server that sends hot updates to the renderer process:

```bash
$ yarn dev
```

## Packaging for Production

First make sure you have the needed dependency `rpmbuild`. For example, on arch...

`yay -s rpm`

To package apps for the local platform

```bash
$ yarn package
```

## Todo

* make config writing and file restarting work for importing
* paginate data for transactions (infinite scroll?)
* move session class initialization out of index.js reducer
* change session from a class to a static factory function
* incoming transaction notification
* utilities: generate payment id and inegrated address
* Option to use system tray (on closing/minimizing wallet)
* Provides list of public nodes, fetch/updated daily from turtlecoin-nodes-json repo. (settings page)
* Allow to add custom node address.
* get save / open menus opening in focus
* add a splash screen
* center modals 
* make transaction hash on wallet page link to explorer


## License

MIT © [ExtraHash](https://github.com/ExtraHash)
MIT © [Electron React Boilerplate](https://github.com/electron-react-boilerplate)
