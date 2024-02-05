// Import the necessary Electron components.
const { contextBridge, ipcRenderer } = require('electron');

// White-listed channels.
const ipc = {
    'render': {
        // From render to main.
        'send': [
            'mainButton',
            'setIni',
            'closeSettings',
            'openExternalUrl'
        ],
        // From main to render.
        'on': [
            'isOpenSettings',
            'progressTitle',
            'updateTotalProgress',
            'updateSizeStr',
            'updateProgress',
            'updateFinish'
        ],
        // From render to main and back again.
        'invoke': [
            'launcherUrl',
            'jsonExt',
            'iframe',
            'getIni'
        ]
    }
};

// Exposed protected methods in the render process.
contextBridge.exposeInMainWorld(
    // Allowed 'ipcRenderer' methods.
    'ipcRenderer', {
        // From render to main.
        send: (channel, args) => {
            let validChannels = ipc.render.send;
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, args);
            }
        },
        // From main to render.
        on: (channel, listener) => {
            let validChannels = ipc.render.on;
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender`.
                const subs = (event, ...args) => listener(...args);
                ipcRenderer.on(channel, (event, ...args) => listener(...args));
                return () => {
                    ipcRenderer.removeListener(channel, subs);
                };
            }
        },
        // From main to render.
        once: (channel, listener) => {
            let validChannels = ipc.render.on;
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender`.
                const subs = (event, ...args) => listener(...args);
                ipcRenderer.once(channel, (event, ...args) => listener(...args));
                return () => {
                    ipcRenderer.removeListener(channel, subs);
                };
            }
        },
        // From render to main and back again.
        invoke: (channel, args) => {
            let validChannels = ipc.render.invoke;
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, args);
            }
        }
    }
);