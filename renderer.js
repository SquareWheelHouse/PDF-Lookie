// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All APIs exposed by the context bridge are available here.

// Binds the buttons to the context bridge API.
/*
document.getElementById('open-in-browser').addEventListener('click', () => {
    shell.open();
});
*/


const urlDisplay = document.getElementById('launch-url')

window.electrontest.protocolHandler((event, value) => {
    urlDisplay.innerText = value
    event.sender.send('url-protocol', "aok")
})


// If absolute URL from the remote server is provided, configure the CORS
// header on that server.
var url = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';

