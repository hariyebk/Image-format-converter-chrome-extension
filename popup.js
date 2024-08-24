const FileInput = document.getElementById("fileInput")
const dropZone = document.getElementById("dropzone")
const dragAndDropContainer = document.getElementById("draganddrop")
const operationError = document.getElementById("operation-error")
const starContainer = document.getElementById("star-widget")
const stars = document.querySelectorAll(".star")
const openNewTab = document.getElementById("newtabBtn")
const fileFormat = document.getElementById("fileFormat")
const qualityRange = document.getElementById("qualityRange")
const qualityValue = document.getElementById("qualityValue")
const Quality = document.getElementById("quality")
const startButton = document.getElementById("start")

let files

dragAndDropContainer.addEventListener('click', () => {
    FileInput.click()
})

dragAndDropContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    dragAndDropContainer.classList.remove('border-secondary')
    dragAndDropContainer.classList.add('border-green-600')
})

dragAndDropContainer.addEventListener('dragleave', () => {
    dragAndDropContainer.classList.remove('border-green-600');
    dragAndDropContainer.classList.add('border-secondary')
})

dragAndDropContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    dragAndDropContainer.classList.remove('border-green-600');
    dragAndDropContainer.classList.add('border-secondary')
    const droppedFiles = e.dataTransfer.files;
    files = droppedFiles
    storeImage(files[0])
    main(files)
});

FileInput.addEventListener("change", async (event) => {
    files = event.target.files
    if(files.length > 0){
        storeImage(files[0])
        main(files)
    }
    else return
})

let currentRating = 0;

stars.forEach((star, index) => {
    // For each star we're listening for a hover event to fire , then we will remove any existing hover effects and add a new one for each star
    star.addEventListener('mouseover', () => {
        resetStars();
        for (let i = 0; i <= index; i++) {
            stars[i].classList.add('hovered');
        }
    });

    // During Mouse out event we remove any hover effects from all stars using the resetStars function , then if the current rating is greater than 0, we will add the hover effect for thise special stars.
    star.addEventListener('mouseout', () => {
        resetStars();
        if (currentRating > 0 && currentRating >= 4) {
            for (let i = 0; i < currentRating; i++) {
                stars[i].classList.add('hovered');
            }
        }
        if(currentRating > 0 && currentRating <= 3){
            for (let i = 0; i < currentRating; i++) {
                stars[i].classList.add('red');
            }
        }
    });
    

    // Lisening to the click event  to redirect the user based on the rating
    star.addEventListener('click', async () => {
        currentRating = index + 1;
        // store the rating to the local storage 
        chrome.storage.local.set({ rating: {
            status: true,
            currentRating
        }}, function(){
            console.log('current rating saved locally')
        });

        // hide the widget
        starContainer.classList.add('hidden')
        if (currentRating >= 4) {
            window.open("https://www.google.com/", "_blank");
        } 
        else if (currentRating <= 3) {
            for (let i = 0; i <= index; i++) {
                stars[i].classList.add('red');
            }
            window.open('https://www.youtube.com/hashtag/funnyvideo' , "_blank");
        }
    });
})

// A function that removes the hover and red property from each star by looping over them
function resetStars() {
    stars.forEach(star => {
        star.classList.remove('hovered');
        star.classList.remove('red')
    });
}

// Litsening for the user to open our extension , then we will load the data from the storage.
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get("rating", function(result){
        if(result.rating){
            // hide the rating section from the DOM
            starContainer.classList.add("hidden")

        }
        else{
            console.log("No previous rating found")
        }
    })
    chrome.storage.local.get('image', function(result){
        if(result.image){
            // display the start button
            startButton.classList.remove("hidden")
            startButton.classList.remove("pointer-events-none")
            // loading the stored image to the input field
            const base64Data = result.image.value;
            // extracting the MIME type from Base64 string
            const mimeType = base64Data.match(/^data:(.*?);base64,/)[1]
            const imageBlob = base64ToBlob(base64Data, mimeType);
            const imageFile = blobToFile(imageBlob, result.image.name);
            const returnedFileArray = setConvertedFileToVariable(imageFile)
            if(returnedFileArray.length > 0){
                files = returnedFileArray
                dropZone.innerHTML =  `<div class="flex justify-center gap-4 mt-4">
                    <p class="text-primary text-lg font-normal text-center"> ${returnedFileArray[0].name} </p>
                </div>
                `
            }
        }
        else{
            console.log("No stored image found")
        }
    })
    chrome.storage.local.get("format", function(result){
        if(result.format){
            fileFormat.value = result.format.value
            if(result.format.value === "png"){
                Quality.classList.add("hidden")
                Quality.classList.remove("flex")
            }
            else{
                Quality.classList.remove("hidden")
                Quality.classList.add("flex")
            }
        }
        else{
            console.log("No saved format")
        }
    })
    chrome.storage.local.get("quality", function(result){
        if(result.quality){
            qualityRange.value = result.quality.value
            qualityValue.value = `${result.quality.value}%`
        }
        else{
            console.log("No saved quality")
        }
    })
}) 

// A function that converts a Base64 data to blob data
function base64ToBlob(base64, mimeType) {
    // decoding the Base64 string
    const byteCharacters = atob(base64.split(',')[1])
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
}

// A function that stores the image in local storage as Base64 string
function storeImage(file) {
    const reader = new FileReader();
    // reads and coverts the image data as Base64 string
    reader.onload = function(event) {
        const base64string = event.target.result;
        chrome.storage.local.set({image: {
            value: base64string,
            name: file.name
        }}, function() {
            if (chrome.runtime.lastError) {
                console.error('Error storing image:', chrome.runtime.lastError);
            } else {
                console.log('Image stored successfully');
            }
        });
    };
    
    reader.onerror = function(error) {
        console.error('Error reading file:', error);
    };
    
    reader.readAsDataURL(file);
}

// A function that converts blob data into a file
function blobToFile(blob, fileName) {
    return new File([blob], fileName, { type: blob.type, lastModified: Date.now() });
}

function setConvertedFileToVariable(image){
    files = [image]
    return files
}

function storeResult(base64Data){
    chrome.storage.local.set({finalResult: {
        value: base64Data,
    }}, function() {
        if (chrome.runtime.lastError) {
            console.error('Error storing image:', chrome.runtime.lastError);
        } 
        else {
            console.log('result stored successfully');
        }
    });
}

function startDragging(e) {
    const onMouseMove = (e) => updateClip(e.clientX);
    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
};

openNewTab.addEventListener("click", () => {
    // send a message to open a new window
    chrome.runtime.sendMessage({action: 'expand'});
    // close the current popup
    window.close()
})

qualityRange.addEventListener("input", () => {
    qualityValue.value = `${qualityRange.value}%`
    chrome.storage.local.set({ quality: {
        value: qualityRange.value
    }}, function(){
        console.log('quality value saved locally')
    });
})

fileFormat.addEventListener("change", () => {
    chrome.storage.local.set({ format: {
        value: fileFormat.value
    }}, function(){
        console.log('file format saved locally')
    });
})

fileFormat.addEventListener("change", () => {
    operationError.innerHTML = ``
    if(fileFormat.value === "png"){
        Quality.classList.add("hidden")
        Quality.classList.remove("flex")
    }
    else {
        if(Quality.classList.contains("hidden")){
            Quality.classList.remove("hidden")
            Quality.classList.add("flex")
        }
    }
})

startButton.addEventListener("click", () => {
    main(files);
})

// main function
async function main(files){
    starContainer.classList.add("pointer-events-none")
    operationError.innerHTML = ``
    dropZone.innerHTML = `
        <div class="flex justify-center gap-4 mt-4">
            <p class="text-primary text-xl font-normal"> Converting </p>
            <div class="mt-1">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        </div>
    `
    fileFormat.disabled = true
    startButton.disabled = true
    qualityRange.disabled = true
    openNewTab.disabled = true
    dragAndDropContainer.classList.add("pointer-events-none")
    dragAndDropContainer.classList.add("cursor-not-allowed")
    const form = new FormData()
    form.set("file", files[0])
    form.set("output_format", fileFormat.value)
    form.set("quality", qualityRange.value)
    const out = `${files[0].name.split(".")[0]}.${fileFormat.value}`
    // create a job
    try{
        // 185.124.109.231:2000/api/
        // https://yegarabet.vercel.app/
        // http://localhost:3000
        const response =  await fetch("http://185.124.109.231:2000/api/convert", {
            method: "POST",
            body: form
        })

        if(response.ok){
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const contentType = response.headers.get('Content-Type')
            // show the start button
            startButton.classList.remove("hidden")
            startButton.classList.remove("pointer-events-none")
            if (contentType !== 'application/pdf' && contentType !== 'application/zip'){
                const reader = new FileReader();
                reader.onloadend = function() {
                    const base64data = reader.result
                    storeResult(base64data)
                };
                reader.readAsDataURL(blob);
            }
            chrome.downloads.download({
                url,
                filename: out
            }, (downloadItem) => {
                if (chrome.runtime.lastError) {
                    console.error('Error downloading the file:', chrome.runtime.lastError.message)
                } 
                else {
                    console.log('file download started:', downloadItem)
                }
            })
        }
        else{
            const data = await response.json()
            if(data.error){
                throw new Error(data.error)
            }
        }
    }
    catch(error){
        operationError.innerHTML = `
        <p class="text-red-500 text-sm font-semibold mt-3"> ${error || "something went wrong"} </p>
        `
    }
    finally {
        dropZone.innerHTML =  `<div class="flex justify-center gap-4 mt-4">
            <p class="text-primary text-lg font-normal"> ${files[0].name} </p>
        </div>
        `
        starContainer.classList.remove("pointer-events-none")
        fileFormat.disabled = false
        startButton.disabled = false
        qualityRange.disabled = false
        openNewTab.disabled = false
        dragAndDropContainer.classList.remove("pointer-events-none")
        dragAndDropContainer.classList.remove("cursor-not-allowed")
    }
}