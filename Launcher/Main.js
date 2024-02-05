// Main.js
import * as path from 'path'
import * as Settings from '../Settings.js';
import * as Init from './Core/Init.js'
import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { exec } from 'child_process'

// Cache işlemini durdur
app.commandLine.appendSwitch ("disable-http-cache")

// Uygulama admin olarak açılmazsa hata ver
exec('NET SESSION', function(err,so,se) {
  if (se.length !== 0){
    Init.showErrorMessage('Required admin access!')
  }
})

// Aynı anda iki kez açmayı engelle
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit();
}else {

  // Uygulama hazır olduğunda başla
  app.on('ready', async () => {

    // Ini dosyası yoksa varsayılan verilere göre oluştur
    Init.genIni()

    // Ana pencereyi oluştur
    const launcher = new BrowserWindow({
      width: await Init.getJson('Options', ['launcherWidth']),
      height: await Init.getJson('Options', ['launcherHeight']),
      title: await Init.getJson('Options', ['launcherTitle']),
      icon: path.join(app.getAppPath(), './Launcher/Resource/Platform.ico'),
      transparent: await Init.getJson('Options', ['launcherTransparent']),
      frame: await Init.getJson('Options', ['launcherFrame']),
      resizable: await Init.getJson('Options', ['launcherResizable']),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(app.getAppPath(), './Launcher/Core/Preload.js')
      }
    });

    // URL'yi yükle
    launcher.loadURL(await Init.getTemplateUrl())

    // Renderer süreç hazır olduğunda veriyi gönder
    let progressTitle = 'updateChecking'
    launcher.webContents.on('did-finish-load', async() => {

      // Client'i güncelle
      progressTitle = 'updateChecking'
      launcher.webContents.send('progressTitle', progressTitle)
      await Init.updateClient((totalSize, totalTransferredBytes, transferredBytes, transferredOverallBytes, type) => {
        // TrackProgress fonksiyonunu kullanarak sürekli olarak ilerleme mesajlarını yazdır
        const updateTotalProgress = ((totalTransferredBytes / totalSize) * 100).toFixed(0);
        const updateProgress = ((transferredBytes / transferredOverallBytes) * 100).toFixed(0);

        launcher.webContents.send('updateTotalProgress', updateTotalProgress)

        if (transferredBytes == 0 && transferredOverallBytes == 0){
          launcher.webContents.send('updateProgress', 100)
          launcher.webContents.send('updateSizeStr', 'updateNotFoundSecond')
        }else {
          launcher.webContents.send('updateProgress', updateProgress)
          launcher.webContents.send('updateSizeStr', '(' + Init.formatBytes(totalTransferredBytes) + ' / ' + Init.formatBytes(totalSize) + ')')
        }

        if (type == 'file'){
          if (updateTotalProgress == 100){
            progressTitle = 'updateSuccess'
            launcher.webContents.send('updateFinish', true)
          }else {
            progressTitle = 'updateMessage'
          }
        }

        if (type == 'sync'){
          if (updateTotalProgress == 100){
            progressTitle = 'updateSuccess'
            launcher.webContents.send('updateFinish', true)
          }else {
            progressTitle = 'syncMessage'
          }
        }

        if (type == 'finish') {
          progressTitle = 'updateNotFound'
          launcher.webContents.send('updateFinish', true)
        }

        launcher.webContents.send('progressTitle', progressTitle)
      })

    });

    // Ini dosyasına post edilirse yeni verilerle kaydet
    ipcMain.on('setIni', (event, value) => {
      Init.setIni(value)
    })

    // Renderden gelen mainButton elemanlarını dinle ve ona göre işlem yap.
    let isSettingsOpen = false
    ipcMain.on('mainButton', async (event, value) => {

      // Home butonu işlevi
      if (value == "Home"){
        shell.openExternal(Settings.mainUrl)
      }

      // Option butonu işlevi
      if (value == "Option"){
        isSettingsOpen = !isSettingsOpen
        // Tersine çevrilen değeri renderer sürecine gönder
        launcher.webContents.send('isOpenSettings', isSettingsOpen)
        ipcMain.once('closeSettings', (event, value) => {
          if (value == true){
            launcher.webContents.send('isOpenSettings', !value)
            isSettingsOpen = false
            launcher.webContents.reload()
          }
        })
      }

      // Start butonu işlevi
      if (value == "Start"){
        const args = [
          Init.getIni('Resolution', 'Fullscreen'), 
          Init.getIni('Resolution', 'Width'), 
          Init.getIni('Resolution', 'Height')
        ]
        if (Init.runExeWithArgs(args)){
          setTimeout(() => {app.quit()}, 500)
        }
      }

      // Exit butonu işlevi
      if (value == "Exit"){
        app.quit()
      }

  })

  // Render sürece veri gönder
  ipcMain.handle('launcherUrl', () => {return Settings.launcherUrl})
  ipcMain.handle('jsonExt', () => {return Settings.jsonExt})
  ipcMain.handle('iframe', () => {return Settings.iframe})
  ipcMain.handle('getIni', (event, arg) => {return arg ? Init.getIni(arg[0], arg[1]) : Init.getIni()})
  ipcMain.on('openExternalUrl', (event, arg) => {shell.openExternal(arg)})

  })

}