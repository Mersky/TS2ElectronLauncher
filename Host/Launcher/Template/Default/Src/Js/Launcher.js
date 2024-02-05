// Launcher.js
const launcher = document.querySelector('.Launcher')
const notice = document.querySelector('.Notice')
const iframe = document.querySelector('#Iframe')
const copyright = document.querySelector('.Copyright')
const version = document.querySelector('.Version')
const versionInfo = document.querySelector('#VersionInfo')
const versionProgress = document.querySelector('#VersionProgress')
const process = document.querySelector('.Process')
const processInfo = document.querySelector('#ProcessInfo')
const processProgress = document.querySelector('#ProcessProgress')
const homeButton = document.querySelector('#HomeButton')
const optionButton = document.querySelector('#OptionButton')
const startButton = document.querySelector('#StartButton')
const exitButton = document.querySelector('#ExitButton')

// Iframe adını main process'ten al
const iframeName = ipcRenderer.invoke('iframe')

// Ini dosyasının değerlerini döndür
function getIni(args){
    return ipcRenderer.invoke('getIni', args)
}

// Dil Fonksiyonu
async function Language() {
    
    // Dil kodunu çek
    const lang = await getIni(['Game', 'Language'])

    // Dil dosyasını çek
    const response = await fetch('./Src/Lang/' + lang + '/Launcher.json')
    const data = await response.json()
    
    // Objelere dil dosyasını aktar
    notice.innerHTML = data['notice']
    copyright.innerHTML = data['copyright']
    version.innerHTML = data['version']
    process.innerHTML = data['process']
    ipcRenderer.on('progressTitle', (val) => {
        if (val == 'syncMessage' || val == 'updateMessage'){
            ipcRenderer.on('updateTotalProgress', (progress) => {
                versionInfo.innerHTML = data[val]
                .replace('{totalDownloadedCount}', progress)
                .replace('{totalUpdateFileCount}', '100%');
            })
        }else {
            versionInfo.innerHTML = data[val]
        }
    })
    ipcRenderer.on('updateSizeStr', (val) => {
        if (val == 'updateNotFoundSecond' && data[val]) {
            processInfo.innerHTML = data[val];
        } else {
            processInfo.innerHTML = val;
        }
    })
    homeButton.innerHTML = data['home']
    optionButton.innerHTML = data['settings']
    startButton.innerHTML = data['start']
    exitButton.innerHTML = data['exit']

    isSettingsOpen((open) => {
        notice.innerHTML = data['notice']
        optionButton.innerHTML = data['settings']
        if (open == true) {
            notice.innerHTML = data['settings']
            optionButton.innerHTML = data['notice']
        }
    })

}

// Ana butonların fonksiyonu
function MainButtons(){
    let buttons = document.getElementsByClassName('MainButton')
    for (let i = 0; i < buttons.length; i++) {
        let button = buttons[i]
        button.addEventListener('click', () => {
            ipcRenderer.send('mainButton', button.value)
        })
    }
}

// Ayarlar durumu fonksiyonu
function isSettingsOpen(callback) {
    ipcRenderer.on('isOpenSettings', (val) => {
        callback(val)
    })
}

// Iframe ayarlama fonksiyonu
async function setIframe(){
    iframe.src = './' + await iframeName + '.html'
    isSettingsOpen(async (open) => {
        iframe.src = './' + await iframeName + '.html'
        if (open == true) {
            iframe.src = './Settings.html'
        }
    })
}

// Progressbar güncelleme
function progressBarUpdate(){

    ipcRenderer.on('updateTotalProgress', (val) => {
        versionProgress.value = val
    })

    ipcRenderer.on('updateProgress', (val) => {
        processProgress.value = val
    })

    ipcRenderer.on('updateFinish', (val) => {
        startButton.disabled = !val
    })

}

// Arkaplanı değiştir
function changeBg(){
    const randomNumber = Math.floor(Math.random() * 3) + 1
    launcher.style.backgroundImage = 'url("./Src/Img/' + randomNumber + '.png")'
}

// Ana fonksiyon
function Main() {
    changeBg()
    Language()
    MainButtons()
    setIframe()
    progressBarUpdate()
}

// Ana fonksiyonu çağır
Main()