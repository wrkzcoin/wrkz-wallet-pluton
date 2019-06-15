/* eslint-disable class-methods-use-this */
/* eslint-disable no-undef */
// @flow
import { app, Menu, shell, BrowserWindow, dialog } from 'electron';
import clipboardy from 'clipboardy';
import log from 'electron-log';
import { session, config } from './reducers/index';

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.openDevTools();
    this.mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.inspectElement(x, y);
          }
        }
      ]).popup(this.mainWindow);
    });
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'Electron',
      submenu: [
        {
          label: 'About ElectronReact',
          selector: 'orderFrontStandardAboutPanel:'
        },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        {
          label: 'Hide ElectronReact',
          accelerator: 'Command+H',
          selector: 'hide:'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:'
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    };
    const subMenuEdit = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:'
        }
      ]
    };
    const subMenuViewDev = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.toggleDevTools();
          }
        }
      ]
    };
    const subMenuViewProd = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        }
      ]
    };
    const subMenuWindow = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:'
        },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' }
      ]
    };
    const subMenuHelp = {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click() {
            shell.openExternal('http://electron.atom.io');
          }
        },
        {
          label: 'Documentation',
          click() {
            shell.openExternal(
              'https://github.com/atom/electron/tree/master/docs#readme'
            );
          }
        },
        {
          label: 'Community Discussions',
          click() {
            shell.openExternal('https://discuss.atom.io/c/electron');
          }
        },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal('https://github.com/atom/electron/issues');
          }
        }
      ]
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ? subMenuViewDev : subMenuViewProd;

    return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
  }

  handleSave(showDialog: boolean) {
    session.saveWallet(config.walletFile);
    if (showDialog) {
      dialog.showMessageBox(null, {
        type: 'info',
        buttons: ['OK'],
        title: 'Saved!',
        message: 'Your wallet was saved successfully.'
      });
    }
  }

  handleOpen() {
    const getPaths = dialog.showOpenDialog();
    if (getPaths === undefined) {
      return;
    }
    const selectedPath = getPaths[0];
    const savedSuccessfully = session.handleWalletOpen(selectedPath);
    if (savedSuccessfully === true) {
      app.relaunch();
      app.exit();
    } else {
      dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: 'Error opening wallet!',
        message: 'The wallet was not opened successfully. Try again.'
      });
    }
  }

  handleSaveAs(showDialog: boolean) {
    const savePath = dialog.showSaveDialog();
    if (savePath === undefined) {
      return;
    }
    session.saveWallet(savePath);
    if (showDialog) {
      dialog.showMessageBox(null, {
        type: 'info',
        buttons: ['OK'],
        title: 'Saved!',
        message: 'Your wallet was saved successfully.'
      });
    }
  }

  handleSeed() {
    log.debug(session.wallet.getMnemonicSeed());
    dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['Copy to Clipboard', 'OK'],
      title: 'Seed',
      message:
        `Your wallet seed is:\n\n` +
        `${session.wallet.getMnemonicSeed()[0]}\n\n` +
        `Please save this seed safely and securely. If you lose your seed, you not will be able to recover your funds.`
    });
  }

  handlePrivateKeys() {
    const [
      privateSpendKey,
      privateViewKey
    ] = session.wallet.getPrimaryAddressPrivateKeys();

    const msg =
      // eslint-disable-next-line prefer-template
      `Private Spend Key:\n\n` +
      privateSpendKey +
      `\n\nPrivate View Key:\n\n` +
      privateViewKey +
      `\n\nPlease save these keys safely and securely. \nIf you lose your keys, you will not be able to recover your funds.`;

    dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['Copy to Clipboard', 'OK'],
      title: 'Seed',
      message: msg
    });
  }

  handleNew() {
    dialog.showMessageBox(null, {
      type: 'question',
      buttons: ['OK'],
      title: 'New Wallet',
      message: 'Press OK to select a location for your new wallet.'
    });
    const savePath = dialog.showSaveDialog();
    if (savePath === undefined) {
      return;
    }
    log.debug(savePath);
    const createdSuccessfuly = session.handleNewWallet(savePath);
    if (createdSuccessfuly === false) {
      dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: 'Error saving wallet!',
        message: 'The wallet was not created successfully. Check your directory permissions and try again.'
      });
    } else {
      dialog.showMessageBox(null, {
        type: 'info',
        buttons: ['OK'],
        title: 'Created!',
        message: 'Your new wallet was created successfully. Press OK to open...'
      });
      const savedSuccessfully = session.handleWalletOpen(savePath);
      if (savedSuccessfully === true) {
        app.relaunch();
        app.exit();
      } else {
        dialog.showMessageBox(null, {
          type: 'error',
          buttons: ['OK'],
          title: 'Error opening wallet!',
          message: 'The wallet was not opened successfully. Try again.'
        });
      }
    }
  }

  handleRestore() {
    log.debug('Reached!');
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&File',
        submenu: [
          {
            label: '&Open',
            accelerator: 'Ctrl+O',
            click: () => {
              this.handleOpen();
            }
          },
          {
            label: '&New',
            accelerator: 'Ctrl+N',
            click: () => {
              this.handleNew();
            }
          },
          {
            label: '&Restore',
            click: () => {
              this.handleRestore();
            }
          },
          {
            label: '&Save',
            accelerator: 'Ctrl+S',
            click: () => {
              this.handleSave(true);
            }
          },
          {
            label: '&Save a Copy',
            click: () => {
              this.handleSaveAs(true);
            }
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.handleSave(false);
              this.mainWindow.close();
            }
          }
        ]
      },
      {
        label: '&Wallet',
        submenu: [
          {
            label: '&Password'
          },
          {
            label: '&Seed',
            click: () => {
              this.handleSeed();
            }
          },
          {
            label: '&Private Keys',
            click: () => {
              this.handlePrivateKeys();
            }
          }
        ]
      },
      {
        label: '&View',
        submenu:
          process.env.NODE_ENV === 'development'
            ? [
                {
                  label: '&Reload',
                  accelerator: 'Ctrl+R',
                  click: () => {
                    this.mainWindow.webContents.reload();
                  }
                },
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  }
                },
                {
                  label: 'Toggle &Developer Tools',
                  accelerator: 'Alt+Ctrl+I',
                  click: () => {
                    this.mainWindow.toggleDevTools();
                  }
                }
              ]
            : [
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  }
                }
              ]
      },
      {
        label: '&Tools',
        submenu: [
          {
            label: '&Preferences'
          },
          {
            label: '&Pay to Many'
          },
          {
            label: '&Load Offline Transaction'
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click() {
              shell.openExternal('http://github.com/ExtraHash/proton');
            }
          },
          {
            label: 'Report Bug',
            click() {
              shell.openExternal('https://github.com/ExtraHash/proton/issues');
            }
          },
        ]
      }
    ];

    return templateDefault;
  }
}
