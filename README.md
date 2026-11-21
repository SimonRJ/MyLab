# Children of Time Universe Atlas

[Open the atlas on GitHub Pages](https://simonrj.github.io/MyLab/)

An unofficial illustrated companion to *Children of Time*, *Children of Ruin* and *Children of Memory*. The archive contains spoilers through the end of the third novel.

## Exploring the atlas

Choose a destination from the orbital explorer or star chart. Drag a globe or spacecraft to rotate it, use the zoom controls, and open a dossier to follow connections to worlds, characters and events. Keyboard users can focus a model and rotate it with the arrow keys. The slash key opens search. Book and history filters help distinguish the physical and simulated events on Imir.

The planet surfaces, orbital positions, spacecraft and portraits are interpretive. Individual life records identify known family relationships and outcomes, distinguish elapsed time from biological age, and mark missing dates and measurements. Chapter and source notes appear on the relevant records. The reference atlas also includes the 23 locations, narrative arcs, author commentary and reading refresher.

## Publishing

GitHub Pages serves the root of the main branch. This static site needs no build step or external JavaScript service. Keep the HTML, JavaScript, stylesheet and media together. The homepage opens the 3D explorer. Earlier hash links resolve to their reference entries, and the children-of-time directory retains its original forwarding page.

## Offline iPhone app

Open the [offline app setup](https://simonrj.github.io/MyLab/offline.html) in Safari. Choose Share, Add to Home Screen and Open as Web App, then launch the Home Screen icon while online. Once **Ready offline** appears, the entire atlas is available in Airplane Mode. The reference pages are included. External source websites need a connection.

Before publishing an atlas change, run `python3 tools/update-offline.py` in the checkout and commit the regenerated `offline-files.js` with the changed files. The service worker verifies each file before activating a release. An interrupted download can resume, and an installed release continues to work while its replacement downloads.
