// Helper.js
import * as path from 'path'
import * as Settings from '../../../Settings.js'
import { app, dialog } from 'electron'
import { spawn } from 'child_process'

// JSON verilerini oku
export async function getJson(url, keys){

    try {

        const response = await fetch(Settings.launcherUrl + url + Settings.jsonExt)

        if (!response.ok) {
            throw new Error(`Error fetching data from the server: ${response.status}`)
        }

        const data = await response.json()

        // Keys dizisi içinde sırayla gezinerek değeri bul
        let nestedValue = data
        if (keys){
            for (const key of keys) {
                if (nestedValue.hasOwnProperty(key)) {
                    nestedValue = nestedValue[key]
                }else {
                    throw new Error(`Key '${key}' not found.`)
                }
            }
        }

        return nestedValue

    }catch (error) {
        console.error('Error fetching data from the server: ', error)
        throw error
    }

}

// Tema adresini çek
export async function getTemplateUrl() {
    return Settings.launcherUrl + Settings.templateDir + '/' + await getJson('Options', ['launcherTemplate'])
}

// Hata mesajı oluştur
export async function showErrorMessage(errorMessage) {
    dialog.showErrorBox(await getJson('Options', ['launcherTitle']), errorMessage)
    app.quit()
}

// Exe dosyasını başlat
export function runExeWithArgs(args) {
    return new Promise(async (resolve, reject) => {

        const exe = path.join(Settings.appPath, await getJson('Options', ['clientExe']))
        let parameters = await getJson('Options', ['clientFirstParameters'])
        for (const arg of args) {
            parameters += '/' + arg
        }
        parameters += await getJson('Options', ['clientLastParameters'])

        const child = spawn(exe, [parameters], {detached: true, stdio: 'ignore'})

        child.unref()

        child.on('close', (code) => {
            console.log(`Child process closed. Code: ${code}`)
            if (code === 0) {
                resolve(true)
            } else {
                reject(`Child process exited with code ${code}`)
            }
        })

    })
}