// Ini.js
import fs from 'fs'
import ini from 'ini'
import * as path from 'path'
import * as Settings from '../../../Settings.js'
import { getJson } from './Helper.js'

// INI dosyası yoksa oluştur
export async function genIni(){
    const filePath = path.join(Settings.appPath, Settings.iniFileName)
    if (!fs.existsSync(filePath)) {
        const values = JSON.stringify(await getJson('Settings'))
        setIni(values)
    }
}

// INI dosyasına veri yaz
export function setIni(data){
    const filePath = path.join(Settings.appPath, Settings.iniFileName)
    const jsonData = JSON.parse(data)

    // JSON verisini INI formatına çevir
    const iniData = ini.stringify(jsonData)

    // INI verisini dosyaya yaz
    try {
        fs.writeFileSync(filePath, iniData, 'utf-8')
        console.log(`The INI data has been successfully written to the file "${Settings.iniFileName}".`)
        return true
    }catch (error) {
        console.error('File write err:', error)
        return false
    }
}

// INI dosyasından veri oku
export function getIni(section, variable) {
    const filePath = path.join(Settings.appPath, Settings.iniFileName)

    if (fs.existsSync(filePath)) {
        try {
            // Ini dosyasını oku (senkron olarak)
            const iniContent = fs.readFileSync(filePath, 'utf-8')

            // Parse edilen ini içeriği
            const parsedIni = ini.parse(iniContent)

            // Değeri Döndür
            let retOption
            if(!section || !variable){
                retOption = JSON.stringify(parsedIni, null, 2)
            }else {
                retOption = parsedIni[section][variable]
            }
            return retOption
        } catch (err) {
            console.error('File read err: ' + err)
        }
    } else {
        console.error('Ini file not found.')
    }
}