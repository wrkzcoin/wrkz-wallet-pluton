/* eslint-disable class-methods-use-this */
/* eslint-disable no-undef */
// @flow
import { app, Menu, shell, BrowserWindow, dialog } from 'electron';
import log from 'electron-log';
// import { session, config } from './index';

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

  handleSave() {
    this.mainWindow.webContents.send('handleSave');
  }

  handleOpen() {
    this.mainWindow.webContents.send('handleOpen');
  }

  handleSaveAs(showDialog: boolean) {
    this.mainWindow.webContents.send('handleSaveAs');
  }

  handleBackup() {
    this.mainWindow.webContents.send('handleBackup');
    /*

    const publicAddress = session.wallet.getPrimaryAddress();
    const [
      privateSpendKey,
      privateViewKey
    ] = session.wallet.getPrimaryAddressPrivateKeys();
    const [mnemonicSeed, err] = session.wallet.getMnemonicSeed();
    log.debug(err);

    const msg =
      // eslint-disable-next-line prefer-template
      publicAddress +
      `\n\nPrivate Spend Key:\n\n` +
      privateSpendKey +
      `\n\nPrivate View Key:\n\n` +
      privateViewKey +
      `\n\nMnemonic Seed:\n\n` +
      mnemonicSeed +
      `\n\nPlease save these keys safely and securely. \nIf you lose your keys, you will not be able to recover your funds.`;

    const userSelection = dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['Copy to Clipboard', 'Cancel'],
      title: 'Seed',
      message: msg
    });
    if (userSelection === 0) {
      clipboardy.writeSync(msg);
    }

    */
  }

  handleNew() {
    const userSelection = dialog.showMessageBox(null, {
      type: 'question',
      buttons: ['Cancel', 'OK'],
      title: 'New Wallet',
      message: 'Press OK to select a location for your new wallet.'
    });
    if (userSelection !== 1) {
      return;
    }
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
        message:
          'The wallet was not created successfully. Check your directory permissions and try again.'
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
    log.debug('Import menu selected.');
    // seed will be 0, keys will be 1
    const userSelection = dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['Cancel', 'Seed', 'Keys'],
      title: 'Seed',
      message: 'Would you like to restore from seed or keys?'
    });
    if (userSelection === 1) {
      log.debug('User selected to import from seed...');
      this.mainWindow.webContents.send('importSeed');
    } else if (userSelection === 2) {
      log.debug('User selected to import from keys...');
      this.mainWindow.webContents.send('importKey');
    }
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
              this.handleSave();
            }
          },
          {
            label: '&Save a Copy',
            click: () => {
              this.handleSaveAs();
            }
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.handleSave();
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
            label: '&Backup',
            click: () => {
              this.handleBackup();
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
      /*
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
      */
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
          }
        ]
      }
    ];

    return templateDefault;
  }
}
