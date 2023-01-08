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
    event.sender.send('url-protocol', value)

    const urlSearchString = value.toString().substr(14)
    const urlParams = new URLSearchParams(urlSearchString);
    for (const [key, value] of urlParams) {
        console.log(`${key}:${value}`);
    }

    if ( urlParams.has('page') ) {
      queueRenderPage(parseInt(urlParams.get('page')));
    }
})


// If absolute URL from the remote server is provided, configure the CORS
// header on that server.
var url = '';

// Loaded via <script> tag, create shortcut to access PDF.js exports.
var pdfjsLib = window['pdfjs-dist/build/pdf'];

// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';

var pdfDoc = null,
  pageNum = 1,
  pageRendering = false,
  pageNumPending = null,
  scale = 1,
  canvas = document.getElementById('the-canvas'),
  ctx = canvas.getContext('2d');

  var container = document.getElementById("canvas-container")
  var zoomTimeoutHandler = null;
  var wheelTimeout = 250 //ms

/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */

function renderPage(num = -1) {
  pageRendering = true;
  // Using promise to fetch the page
  if (num === -1) {
    num = pageNum
  }

  pdfDoc.getPage(num).then(function(page) {
    canvas.width = page.view[2]*scale;
    canvas.height = page.view[3]*scale;
    
    canvasNew = document.getElementById('the-canvas');
    console.log("scale transform " + panzoom.getTransform().scale);

    //scale = ((canvasNew.width * panzoom.getTransform().scale) / page.view[2]);
    var viewport = page.getViewport({
      scale: scale
    });
    
    
    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);

    let dimensions = page.getViewport(1).viewBox.map(n => n / 72 * 300)

    console.log("dimensions " + dimensions)

    // Wait for rendering to finish
    renderTask.promise.then(function() {
      pageRendering = false;
      if (pageNumPending !== null) {
        // New page rendering is pending
        renderPage(pageNumPending);
        pageNumPending = null;
        //container.height = page.view[3] * scale;
        //container.width = document.body.clientWidth - document.body.clientLeft;
      }
    });
  });

  // Update page counters
  document.getElementById('page_num').textContent = num;
}

/**
 * If another page rendering in progress, waits until the rendering is
 * finised. Otherwise, executes rendering immediately.
 */
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
  panzoom.moveTo(0, 0);
}

/**
 * Displays previous page.
 */
function onPrevPage() {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
}
document.getElementById('prev').addEventListener('click', onPrevPage);

/**
 * Displays next page.
 */
function onNextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}
document.getElementById('next').addEventListener('click', onNextPage);

function onGoToCoord() {
  x = document.getElementById('xcoord').value
  y = document.getElementById('ycoord').value
  panzoom.smoothMoveTo(x, y);
}
document.getElementById('go-to-coord').addEventListener('click', onGoToCoord);

function onGoToZoom() {
  z = document.getElementById('zoom').value
  console.log(z)
  let canvasobj = document.getElementById('the-canvas')

  let cx = canvasobj.clientLeft + canvasobj.clientHeight/2;
  let cy = canvasobj.clientTop + canvasobj.clientHeight/2;

  scale = z;
  renderPage();
}
document.getElementById('go-to-zoom').addEventListener('click', onGoToZoom);

const pageNumSelect = document.getElementById('page-num-select')

function goToPage() {
  const pageSelect = parseInt(pageNumSelect.value)
  console.log(pageSelect)
  console.log('thereshould be something here')
  if (pageSelect > pdfDoc.numPages | pageSelect < 1) {
    return
  }
  pageNum = pageSelect
  queueRenderPage(pageSelect)
}

document.getElementById('gotopage').addEventListener('click', goToPage);



/**
 * Asynchronously downloads PDF.
 */
pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
  pdfDoc = pdfDoc_;
  document.getElementById('page_count').textContent = pdfDoc.numPages;

  container.width = document.body.clientWidth - document.body.clientLeft;

  // Initial/first page rendering
  renderPage(pageNum);
});

const btn = document.getElementById('btn')
const filePathElement = document.getElementById('filePath')

btn.addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile()
  filePathElement.innerText = filePath
  url = filePath
  pageNum = 1

  pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
    pdfDoc = pdfDoc_;
    document.getElementById('page_count').textContent = pdfDoc.numPages;
    
    // Initial/first page rendering
    renderPage(pageNum)

  });

})

var panzoom = panzoom(container, {
  smoothScroll: true,
  maxZoom: 1,
  minZoom: 1,
  initialZoom: scale,
  bounds: true,
  boundsPadding: 0.1,
  zoomDoubleClickSpeed: 1,
  autocenter: true,
  onDoubleClick: function(e) {
    // `e` - is current double click event.
    scale = scale * 1.20;
    renderPage();
    return false; // tells the library to not preventDefault, and not stop propagation
  }
})
//container.parentElement.addEventListener('wheel', zoomWithWheel)

panzoom.on('zoom', function(e) {
  clearTimeout(zoomTimeoutHandler);
  zoomTimeoutHandler = setTimeout(function() {
    //scale = panzoom.getTransform().scale
    //canvas.style.transform = "scale(" + 1 / scale + ")"
    //console.log(scale)
    if (pdfDoc)
      renderPage();
  }, wheelTimeout)
});

panzoom.on('zoomend', function(e) {
  console.log('ZOOM ZOOM ded', e)
});