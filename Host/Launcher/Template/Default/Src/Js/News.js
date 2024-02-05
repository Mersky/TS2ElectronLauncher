// News.js
const launcherUrl = window.parent.ipcRenderer.invoke('launcherUrl')
const jsonExt = window.parent.ipcRenderer.invoke('jsonExt')
const iframe = window.parent.ipcRenderer.invoke('iframe')

// Ini dosyasının değerlerini döndür
function getIni(args){
    return window.parent.ipcRenderer.invoke('getIni', args)
}

// HTML içeriğini oluşturma
async function newsList() {
    const iframeDataUrl = await launcherUrl + await iframe + '/' + await getIni(['Game', 'Language']) + await jsonExt
    const newsListContainer = document.getElementById('NewsList')
    try {
        const response = await fetch(iframeDataUrl)
        const data = await response.json();

        Object.values(data).forEach(newsItem => {
            const listItem = document.createElement('li')

            const contentDiv = document.createElement('div')
            const badgeSpan = document.createElement('span')
            badgeSpan.style.background = newsItem.badgeColor
            badgeSpan.innerHTML = `<p>${newsItem.badge}</p>`
            contentDiv.appendChild(badgeSpan)

            const titleLink = document.createElement('a')
            titleLink.href = 'javascript:void(0)'
            titleLink.onclick = () => {
                window.parent.ipcRenderer.send('openExternalUrl', newsItem.url)
            }
            titleLink.innerHTML = newsItem.title
            contentDiv.appendChild(titleLink)

            listItem.appendChild(contentDiv)

            const dateDiv = document.createElement('div')
            dateDiv.innerHTML = newsItem.date
            listItem.appendChild(dateDiv)

            newsListContainer.appendChild(listItem)
        });
    } catch (error) {
        console.error('Data fetching error:', error)
    }
}

// Ana fonksiyon
function main() {
    newsList()
}

// Ana fonksiyonu çağır
main()