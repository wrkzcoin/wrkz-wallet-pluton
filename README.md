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
git clone https://github.com/ExtraHash/proton.git
```

And then install the dependencies with yarn.

```bash
$ cd proton
$ yarn
```

Run the wallet.

```bash
$ yarn start
```

## Starting Development

Start the app in the `dev` environment. This starts the renderer process in [**hot-module-replacement**](https://webpack.js.org/guides/hmr-react/) mode and starts a webpack dev server that sends hot updates to the renderer process:

```bash
$ yarn dev
```

## Packaging for Production

First make sure you have the needed dependency `rpmbuild`. For example, on arch...

`yay -s rpm`

Then, to package apps for the local platform:

```bash
$ yarn package
```
## License

MIT © [ExtraHash](https://github.com/ExtraHash)
MIT © [Electron React Boilerplate](https://github.com/electron-react-boilerplate)
