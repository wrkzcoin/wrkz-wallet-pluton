<img src="https://cdn.discordapp.com/attachments/595762657458651152/599842701978107904/unknown.png">

#### Master Build Status
[![Build Status](https://travis-ci.org/turtlecoin/turtle-wallet-proton.svg?branch=master)](https://travis-ci.org/turtlecoin/turtle-wallet-proton)

#### Development Build Status
[![Build Status](https://travis-ci.org/turtlecoin/turtle-wallet-proton.svg?branch=development)](https://travis-ci.org/turtlecoin/turtle-wallet-proton)

<p>
  Proton Wallet is a TurtleCoin wallet that uses <a href="http://electron.atom.io/">Electron</a>, <a href="https://facebook.github.io/react/">React</a>, <a href="https://github.com/turtlecoin/turtlecoin-wallet-backend-js">Turtlecoin-Wallet-Backend-JS</a>, <a href="https://github.com/reactjs/redux">Redux</a>, <a href="https://github.com/reactjs/react-router">React Router</a>, <a href="http://webpack.github.io/docs/">Webpack</a> and <a href="https://github.com/gaearon/react-hot-loader">React Hot Loader</a>.
</p>

## Installing

** Check out the full tutorial on how to install and use Proton at the [official TurtleCoin docs page](https://docs.turtlecoin.lol/guides/wallets/using-proton-wallet)! **

## Development Setup (All Platforms)

### Dependencies

* Node.JS (latest LTS version)

https://nodejs.org/

* Yarn

https://yarnpkg.com/en/

* Git

https://git-scm.com/downloads

First, clone the repo via git:

```bash
git clone https://github.com/turtlecoin/turtle-wallet-proton.git
```

And then install the dependencies with yarn.

```bash
$ cd turtle-wallet-proton
$ yarn
```

Run the wallet.

```bash
$ yarn start
```

### Starting Development

Start the app in the `dev` environment. This starts the renderer process in [**hot-module-replacement**](https://webpack.js.org/guides/hmr-react/) mode and starts a webpack dev server that sends hot updates to the renderer process:

```bash
$ yarn dev
```

### Packaging 

To package apps for the local platform:

```bash
$ yarn package
```

## License

MIT © [ExtraHash](https://github.com/ExtraHash)
