// we are listening for an event that when the user first installs this extension, we will open a new tab to display our welcome page
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        // https://www.youtube.com/watch?v=FN3r-k_EMgg
        chrome.tabs.create({ url: 'https://www.youtube.com/watch?v=FN3r-k_EMgg' });
    }
});

// Create Menu and sub menu on right click
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'saveImageAs',
        title: 'Save Image As',
        contexts: ['image']
    });

    const formats = ['jpeg', 'png', 'webp', 'pdf', 'gif'];

    formats.forEach(format => {
        chrome.contextMenus.create({
            id: `saveImageAs-${format}`,
            parentId: 'saveImageAs',
            title: format.toUpperCase(),
            contexts: ['image']
        });
    });
});

function getQualityFromStorage() {  
    return new Promise((resolve, reject) => {  
        chrome.storage.local.get('quality', function(result) {  
            if (result.quality) {  
                resolve(parseInt(result.quality.value))  
            } 
            else{  
                resolve(null)  
            }  
        });  
    });  
} 

chrome.contextMenus.onClicked.addListener(async (info, tab) => {

    const quality = await getQualityFromStorage()

    if (info.menuItemId.startsWith('saveImageAs-')) {
        const format = info.menuItemId.split('-')[1];
        const imageUrl = info.srcUrl;
        try{
            const form = new FormData()
            form.set("output_format", format)
            form.set("url", imageUrl)
            form.set("quality", quality)
            // 185.124.109.231:2000/api/
            const response =  await fetch("http://185.124.109.231:2000/api/convert", {
                method: "POST",
                body: form
            })
            
            if(!response.ok){
                throw new Error("failed to process. try again")
            }
    
            const blob = await response.blob()
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            chrome.downloads.download({
                url: base64Data,
                filename: `converted.${format}`
            }, (downloadItem) => {
                if (chrome.runtime.lastError) {
                    console.error('Error downloading the file:', chrome.runtime.lastError.message);
                } 
                else {
                    console.log('file download started:', downloadItem);
                }
            });
        }
        catch(error){
            console.error(error.message)
        }
    }
});

// Listening for expand action to open the extension in a new window
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'expand') {
        chrome.windows.create({
            url: chrome.runtime.getURL('wide.html'),
            type: 'popup',
            left: 80,
            top: 100,
            width: 1034,
            height: 614
        });
    }
});
