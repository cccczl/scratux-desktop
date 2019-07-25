import {BrowserWindow, Menu, app, dialog} from 'electron';
import * as path from 'path';
import {format as formatUrl} from 'url';
import {getFilterForExtension} from './FileFilters';
import telemetry from './ScratchDesktopTelemetry';
import MacOSMenu from './MacOSMenu';

telemetry.appWasOpened();


// const defaultSize = {width: 1096, height: 715}; // minimum
const defaultSize = {width: 1280, height: 800}; // good for MAS screenshots

const isDevelopment = process.env.NODE_ENV !== 'production';

const createMainWindow = () => {
    const window = new BrowserWindow({
        width: defaultSize.width,
        height: defaultSize.height,
        useContentSize: true,
        show: false
    });
    const webContents = window.webContents;

    if (process.platform === 'darwin') {
        const osxMenu = Menu.buildFromTemplate(MacOSMenu(app));
        Menu.setApplicationMenu(osxMenu);
    }

    if (isDevelopment) {
        webContents.openDevTools();
        import('electron-devtools-installer').then(importedModule => {
            const {default: installExtension, REACT_DEVELOPER_TOOLS} = importedModule;
            installExtension(REACT_DEVELOPER_TOOLS);
            // TODO: add logging package and bring back the lines below
            // .then(name => console.log(`Added browser extension:  ${name}`))
            // .catch(err => console.log('An error occurred: ', err));
        });
    }

    webContents.on('devtools-opened', () => {
        window.focus();
        setImmediate(() => {
            window.focus();
        });
    });

    if (isDevelopment) {
        window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
    } else {
        window.loadURL(formatUrl({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file',
            slashes: true
        }));
    }

    webContents.session.on('will-download', (ev, item) => {
        const itemPath = item.getFilename();
        const baseName = path.basename(itemPath);
        const extName = path.extname(baseName);
        if (extName) {
            const extNameNoDot = extName.replace(/^\./, '');
            const options = {
                defaultPath: baseName,
                filters: [getFilterForExtension(extNameNoDot)]
            };
            const userChosenPath = dialog.showSaveDialog(window, options);
            if (userChosenPath) {
                item.setSavePath(userChosenPath);
                const newProjectTitle = path.basename(userChosenPath, extName);
                webContents.send('setTitleFromSave', {title: newProjectTitle});

                // "setTitleFromSave" will set the project title but GUI has already reported the telemetry event
                // using the old title. This call lets the telemetry client know that the save was actually completed
                // and the event should be committed to the event queue with this new title.
                telemetry.projectSaveCompleted(newProjectTitle);
            } else {
                item.cancel();
                telemetry.projectSaveCanceled();
            }
        }
    });

    webContents.on('will-prevent-unload', ev => {
        const choice = dialog.showMessageBox(window, {
            type: 'question',
            message: 'Leave Scratch?',
            detail: 'Any unsaved changes will be lost.',
            buttons: ['Stay', 'Leave'],
            cancelId: 0, // closing the dialog means "stay"
            defaultId: 0 // pressing enter or space without explicitly selecting something means "stay"
        });
        const shouldQuit = (choice === 1);
        if (shouldQuit) {
            ev.preventDefault();
        }
    });

    window.once('ready-to-show', () => {
        window.show();
    });

    return window;
};

// quit application when all windows are closed
app.on('window-all-closed', () => {
    app.quit();
});

app.on('will-quit', () => {
    telemetry.appWillClose();
});

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let _mainWindow;

// create main BrowserWindow when electron is ready
app.on('ready', () => {
    _mainWindow = createMainWindow();
    _mainWindow.on('closed', () => {
        _mainWindow = null;
    });
});
