/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
export const saveAs = (blob, fileName) => {
    let url = window.URL.createObjectURL(blob);
    let anchorElem = document.createElement("a");
    anchorElem.style = "display: none";
    anchorElem.href = url;
    anchorElem.download = fileName;
    document.body.appendChild(anchorElem);
    anchorElem.click();
    document.body.removeChild(anchorElem);
    setTimeout(function() {
        window.URL.revokeObjectURL(url);
    }, 1000);
};

