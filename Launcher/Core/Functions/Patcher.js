// Patcher.js
import fs from 'fs'
import crypto from 'crypto'
import ftp from 'basic-ftp'
import * as path from 'path'
import * as Settings from '../../../Settings.js'
import { getJson } from './Helper.js'

// Ftp serverine bağlan
async function connectToFtpServer() {
    const ftpServer = new ftp.Client()
    try {
        await ftpServer.access({
            host: Settings.ftpHost,
            user: Settings.ftpUser,
            password: Settings.ftpPass,
            secure: false
        })
        return ftpServer
    }catch (err) {
        console.error('Connect err: ', err)
        throw err
    }
}

// Hash değerini al
async function calculateHash(filePath) {
    if(fs.existsSync(filePath)){
        return crypto.createHash(Settings.patchHash).update(fs.readFileSync(filePath)).digest('hex')
    }
}

// FTP sunucudaki dosya listesini al
async function getFtpFiles(remoteFolderPath) {
    const ftpServer = await connectToFtpServer()
    const entries = await ftpServer.list(remoteFolderPath)

    const files = []

    for (const entry of entries) {
        if (entry.type === 2) {
            // Eğer klasörse, rekurisif olarak işle
            const folderPath = path.join(remoteFolderPath, entry.name)
            const subfolderFiles = await getFtpFiles(folderPath)
            files.push(...subfolderFiles.map(subfile => path.join(entry.name, subfile)))
        } else if (entry.type === 1) {
            // Eğer dosyaysa, dosyanın adını ekleyin
            files.push(entry.name)
        }
    }

    return files
}

// Toplam dosya boyutunu al
async function getTotalFileSize(remoteFolderPath = 'first') {
    if (remoteFolderPath = 'first'){
        remoteFolderPath = '/' + await getJson('Options', ['ftpClientDir'])
    }
    const ftpServer = await connectToFtpServer()
    let totalSize = 0

    async function processFiles(files, currentPath) {
        for (const file of files) {
            if (file.type === 2) {
                // Eğer klasörse, rekurisif olarak işle
                const subdirectoryPath = path.join(currentPath, file.name)
                const subdirectoryFiles = await ftpServer.list(subdirectoryPath)
                await processFiles(subdirectoryFiles, subdirectoryPath)
            } else if (file.type === 1) {
                const clientFilePath = path.join(currentPath, file.name)
                const localFilePath = path.join(Settings.appPath, clientFilePath.replace(new RegExp(`^[\\\\/]?${await getJson('Options', ['ftpClientDir'])}[\\\\/]`, 'i'), '\\'))
                const clientFileHash = await getJson(Settings.patchDir + '/' + await getJson('Options', ['ftpClientDir']), [clientFilePath])
                const localFileHash = await calculateHash(localFilePath)
                if (clientFileHash !== localFileHash) {
                    // Eğer hash değerleri eşleşmiyorsa, dosyanın boyutunu ekleyin
                    totalSize += file.size
                }
            }
        }
    }

    const files = await ftpServer.list(remoteFolderPath)
    await processFiles(files, remoteFolderPath)
    return totalSize
}

// Dosyaları indir
async function compareAndDownloadFiles(callback) {
    const localFolderPath = Settings.appPath
    const remoteFolderPath = '/' + await getJson('Options', ['ftpClientDir'])
    const maxParallelDownloads = Settings.patchMaxDownloads

    // Eğer yerel dizin yoksa oluştur
    if (!fs.existsSync(localFolderPath)) {
        fs.mkdirSync(localFolderPath, { recursive: true })
    }

    const clientFiles = await getFtpFiles(remoteFolderPath)
    const downloadPromises = clientFiles.map(async (file) => {
        const clientFilePath = path.join(remoteFolderPath, file)
        const localFilePath = path.join(localFolderPath, file)

        // Alt dizinleri oluştur
        const localFileDir = path.dirname(localFilePath)
        if (!fs.existsSync(localFileDir)) {
            fs.mkdirSync(localFileDir, { recursive: true })
        }
    
        return { localPath: localFilePath, remotePath: clientFilePath }
    })

    // Paralel olarak indirme işlemlerini başlat
    for (let i = 0; i < downloadPromises.length; i += maxParallelDownloads) {
        const chunk = downloadPromises.slice(i, i + maxParallelDownloads)
        const results = await Promise.all(chunk)

        // Sonuçları işleyerek callback fonksiyonunu çağır
        for (const result of results) {
            await callback(result.localPath, result.remotePath)
        }
    }
       
}

// Clienti Güncelleme Fonksiyonu
export async function updateClient(callback) {
    const totalSize = await getTotalFileSize()
    let totalTransferredBytes = 0
    let transferredBytes = 0
    let transferredOverallBytes = 0
    
    await compareAndDownloadFiles(async (localPath, remotePath) => {
        const ftpServer = await connectToFtpServer()
        if (fs.existsSync(localPath)) {
            const clientFileHash = await getJson(Settings.patchDir + '/' + await getJson('Options', ['ftpClientDir']), [remotePath])
            
            const localFileHash = await calculateHash(localPath)
            if (clientFileHash === localFileHash) {
                callback(100, 100, totalSize, totalSize, 'finish')
            }else {
                ftpServer.trackProgress(info => {
                    totalTransferredBytes += info.bytes
                    transferredBytes = info.bytes
                    transferredOverallBytes = info.bytesOverall
                    
                })

                // Dosyayı indir
                const downloadFile = await ftpServer.downloadTo(localPath, remotePath)
                if (downloadFile.code == 226){
                    callback(totalSize, totalTransferredBytes, transferredBytes, transferredOverallBytes, 'sync')
                }
            }
        }else {
            ftpServer.trackProgress(info => {
                totalTransferredBytes += info.bytes
                transferredBytes = info.bytes
                transferredOverallBytes = info.bytesOverall
                
            })

            // Dosyayı indir
            const downloadFile = await ftpServer.downloadTo(localPath, remotePath)
            if (downloadFile.code == 226){
                callback(totalSize, totalTransferredBytes, transferredBytes, transferredOverallBytes, 'file')
            }
        }
        
    })

}

// Dosya boyu formatı fonksiyonu
export function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0){
        return '0 Byte'
    }
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
}