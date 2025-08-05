const {PDFDocument} = PDFLib;
const url = "./dummy.pdf"; 
let pdfDoc;
let curZoom = 1;
let totalNoOfPages = 0;
let currentPageNo = 1;

loadPDF().then((doc) => {
    pdfDoc = doc;
    renderPDF(doc);
});


async function loadPDF() {
    const url = "./dummy.pdf";
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    return await PDFDocument.load(existingPdfBytes);
}


window.addEventListener("scroll", () => {
    const canvases = document.querySelectorAll(".pdf-page");
    let closestPage = null;
    let minDistance = Infinity;
    
    canvases.forEach((canvas) => {
        const rect = canvas.getBoundingClientRect();
        const distance = Math.abs(rect.top - window.innerHeight);
        
        if (distance < minDistance) {
            minDistance = distance;
            closestPage = canvas;
        }
    });
    
    if (closestPage) {
        const currentPageNum = closestPage.dataset.pageNumber;
        document.querySelector(".pageNo").value = currentPageNum - 1;
    }
});

function goTo() {
    const pageNo = document.querySelector(".pageNo").value;
    const targetCanvas = document.querySelector(`.pdf-page[data-page-number="${pageNo}"]`);
    if (targetCanvas) {
        targetCanvas.scrollIntoView({ behavior: "smooth", block: "start" });
        currentPageNo = pageNo;
    }
}

function next() {
    if(currentPageNo <= totalNoOfPages - 1 && currentPageNo >= 1) {
        const targetCanvas = document.querySelector(`.pdf-page[data-page-number="${currentPageNo + 1}"]`);
        if (targetCanvas) {
            targetCanvas.scrollIntoView({ behavior: "smooth", block: "start" });
            currentPageNo++;
        }
    }
}

function previous() {
    if(currentPageNo <= totalNoOfPages && currentPageNo >= 2) {
        const targetCanvas = document.querySelector(`.pdf-page[data-page-number="${currentPageNo - 1}"]`);
        if (targetCanvas) {
            targetCanvas.scrollIntoView({ behavior: "smooth", block: "start" });
            currentPageNo--;
        }
    }
}


function zoomIn() {
    curZoom += 0.1;
    applyZoom();
}

function zoomOut() {
    curZoom = Math.max(0.1, curZoom - 0.1);
    applyZoom();
}

function applyZoom() {
    const container = document.getElementById("pdf-container");
    container.style.transform = `scale(${curZoom})`;
    container.style.transformOrigin = "top"; // Keeps zoom anchored
    let newZoom = Math.floor(curZoom * 100);
    document.querySelector(".zoomVal").value = ( newZoom % 5 == 0 ? newZoom : newZoom + 1);
}

function handleZoom(event) {
    if(event.key === "Enter") {
        curZoom = document.querySelector(".zoomVal").value/100;
        const container = document.getElementById("pdf-container");
        container.style.transform = `scale(${curZoom})`;
        container.style.transformOrigin = "top"; // Keeps zoom anchored
    }
}


async function renderPDF(doc) {
    const pdfBytes = await doc.save();
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const container = document.getElementById("pdf-container");
    container.innerHTML = ""; // Clear previous canvases

    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    totalNoOfPages = pdf.numPages;
    // document.querySelector(".total").innerHTML += "of "+totalNoOfPages;
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        canvas.classList.add("pdf-page");
        canvas.dataset.pageNumber = pageNum;
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        container.appendChild(canvas);
        await page.render({ canvasContext: context, viewport: viewport }).promise;
    }

    URL.revokeObjectURL(pdfUrl); 
}




async function addPage() {
    const {width , height} = pdfDoc.getPages()[0].getSize();
    const newPageNo = document.querySelector(".addAt").value;
    pdfDoc.insertPage(Number(newPageNo - 1), [width, height]);
    await renderPDF(pdfDoc);
}


// async function addPage() {
//     const pdfBytes = await pdfDoc.save();
//     const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
//     const pdfUrl = URL.createObjectURL(pdfBlob);
//     const container = document.getElementById("pdf-container");
//     container.innerHTML = ""; // Clear previous canvases
    
//     const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
//     totalNoOfPages = pdf.numPages;
//     // document.querySelector(".total").innerHTML += "of "+totalNoOfPages;
//     for (let pageNum = 1; pageNum <= pdf.numPages + 1; pageNum++) {
//         if(pageNum === newPageNo) 
//             pdfDoc.addPage();
//         else {
//             const page = await pdf.getPage(pageNum);
//             const viewport = page.getViewport({ scale: 1.5 });

//             const canvas = document.createElement("canvas");
//             canvas.classList.add("pdf-page");
//             canvas.dataset.pageNumber = pageNum;
//             const context = canvas.getContext("2d");
//             canvas.height = viewport.height;
//             canvas.width = viewport.width;

//             container.appendChild(canvas);
//             await page.render({ canvasContext: context, viewport: viewport }).promise;
//         }
//     }

//     URL.revokeObjectURL(pdfUrl); 
// }


async function removePage() {
    const delPageNo = document.querySelector(".removeAt").value;
    const total = pdfDoc.getPageCount();
    if(total > 1 && delPageNo >=1 && delPageNo <= total) {
        pdfDoc.removePage(delPageNo - 1);
        await renderPDF(pdfDoc);
    }
}


function downloadPDF() {
    pdfDoc.save().then((pdfBytes) => {
        download(pdfBytes, "modified.pdf", "application/pdf");
    });
}


/*async function renderPDF(doc) {
    const pdfBytes = await doc.save();
    const pdfDataUri = await doc.saveAsBase64({dataUri : true});
    document.getElementById("pdf").src = pdfDataUri;
}*/
