// Settings.js
const schemeSlug = 'SettingsScheme'
const launcherUrl = window.parent.ipcRenderer.invoke('launcherUrl')
const jsonExt = window.parent.ipcRenderer.invoke('jsonExt')

// Ini dosyasının değerlerini döndür
function getIni(args){
    return window.parent.ipcRenderer.invoke('getIni', args)
}

// Form yaratma fonksiyonu
async function createForm(){

    // JSON verisi
    const formDataUrl = await launcherUrl + schemeSlug + await jsonExt

    // JSON verisini al ve işle
    fetch(formDataUrl)
    .then(response => response.json())
    .then(async data => {
   
        // Dil kodunu çek
        const lang = await getIni(['Game', 'Language'])
        const settingsValue = JSON.parse(await getIni())
    
        // Dil dosyasını çek
        const res = await fetch('./Src/Lang/' + lang + '/Settings.json')
        const lng = await res.json()
    
        data.value = {
            // Dil Değişkenleri
            resolutionSettingsTitle: lng['resolutionSettingsTitle'],
            fullscreenLabel: lng['fullscreenLabel'],
            fullscreenMode: lng['fullscreenMode'],
            windowMode: lng['windowMode'],
            clientResolutionLabel: lng['clientResolutionLabel'],
            gameSettingsTitle: lng['gameSettingsTitle'],
            languageLabel: lng['languageLabel'],
            fpsLabel: lng['fpsLabel'],
            turkish: lng['turkish'],
            english: lng['english'],
            save: lng['save'],

            // Ini dosyasından gelen değişkenler
            fullscreenValue: settingsValue.Resolution.Fullscreen,
            clientResolutionValue: settingsValue.Resolution.Width + 'x' + settingsValue.Resolution.Height,
            languageValue: settingsValue.Game.Language,
            fpsValue: settingsValue.Game.Fps
        }
         // Form elemanlarını oluştur
        $('form').jsonForm(data)
   })
   .catch(error => console.error('Data fetching error: ', error))
}

// Form post edildiğinde
function postData(event) {
    event.preventDefault()
    var formData = {}
    var formElements = event.target.elements

    for (var i = 0; i < formElements.length; i++) {
        var element = formElements[i]

        // Sadece input, select ve textarea elemanlarını dikkate al
        if (element.tagName.toLowerCase() !== 'button' && element.type !== 'submit') {
            // Eğer özellik isminde bir nokta varsa, bu noktaya göre iç içe JSON oluştur
            if (element.name.includes('.')) {
                var keys = element.name.split('.')
                var currentObj = formData

                for (var j = 0; j < keys.length - 1; j++) {
                    currentObj[keys[j]] = currentObj[keys[j]] || {}
                    currentObj = currentObj[keys[j]]
                }

                // Özel durum: ClientResolution'ı işle
                if (keys[keys.length - 1] === 'ClientResolution') {
                    var resolutionArray = element.value.split('x')
                    currentObj['Width'] = resolutionArray[0]
                    currentObj['Height'] = resolutionArray[1]
                } else {
                    currentObj[keys[keys.length - 1]] = element.value
                }

            } else {
                formData[element.name] = element.value

                // Özel durum: ClientResolution'ı işle
                if (element.name === 'ClientResolution') {
                    var resolutionArray = element.value.split('x')
                    formData['Width'] = resolutionArray[0]
                    formData['Height'] = resolutionArray[1]
                    delete formData[element.name]
                }
            }
        }
    }

    window.parent.ipcRenderer.send('setIni', JSON.stringify(formData))
    window.parent.ipcRenderer.send('closeSettings', true)
}

// Ana fonksiyon
function main(){
    createForm()
}

// Ana fonksiyonu çağır
main()