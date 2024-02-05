// Settings.js
import { app } from 'electron'

// Geliştirme ayarı
const development = false

// Hosting launcher ayarları
export const mainUrl = ''
export const launcherDir = 'Launcher'
export const launcherUrl = mainUrl + '/' + launcherDir + '/'
export const templateDir = 'Template'
export const patchDir = 'Patch'
export const iframe = 'News'

// Ftp server ayarları
export const ftpHost = ''
export const ftpUser = ''
export const ftpPass = ''

// Patcher ayarları
export const patchMaxDownloads = 5
export const patchHash = 'md5'

// Dosya ayarları
export const iniFileName = 'Option.INI'
export const jsonExt = '.json'

// Dizin ayarı
export const appPath = development ? app.getAppPath() : process.env.PORTABLE_EXECUTABLE_DIR