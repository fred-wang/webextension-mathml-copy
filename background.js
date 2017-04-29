/* -*- Mode: Java; tab-width: 2; indent-tabs-mode:nil; c-basic-offset: 2 -*- */
/* vim: set ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function copyToClipboard(tabID, source, mimeTypes) {
  // Early return if there is nothing to copy.
  if (!source) {
    return;
  }

  // Connect to the content script and send it the data to copy.
  let port = browser.tabs.connect(tabID);
  port.onMessage.addListener(function() {
    port.postMessage({source: source, mimeTypes: mimeTypes});
  });
}

let gMathMLData = {};

// FIXME: Only show the menu items when they are relevant?
// See https://github.com/fred-wang/webextension-mathml-copy/issues/1

// Add a menu item to copy the <math> source and element.
browser.contextMenus.create({
  id: "copy-mathml",
  type: "normal",
  title: browser.i18n.getMessage("copy_mathml")
});

// Add a submenu enumerating the annotations attached to a <semantics> element.
browser.contextMenus.create({
  id: "copy-annotation",
  type: "normal",
  title: browser.i18n.getMessage("copy_annotation")
});

browser.contextMenus.onClicked.addListener(function(info, tab) {
  // FIXME: Should we add more clipboard flavors?
  // See https://github.com/fred-wang/webextension-mathml-copy/issues/3
  if (info.menuItemId === "copy-mathml") {
    // Copy MathML as text and HTML so that it can be pasted in both text
    // editors or HTML5 applications (Thunderbird, MDN, etc).
    copyToClipboard(tab.id, gMathMLData.source,
                    ["text/plain", "text/html"]);
  } else if (gMathMLData.annotations) {
    let match = info.menuItemId.match(/annotation_(\d+)/);
    if (match) {
      // Copy annotation as text.
      let annotation = gMathMLData.annotations[parseInt(match[1])];
      copyToClipboard(tab.id, annotation.source, ["text/plain"]);
    }
  }
});

function updateAnnotationMenuItems(aOldAnnotations, aNewAnnotations) {
  // Interpret undefined annotations as an empty array.
  if (!aOldAnnotations) {
    aOldAnnotations = [];
  }
  if (!aNewAnnotations) {
    aNewAnnotations = [];
  }

  // Create, update or remove items to match the new annotations.
  for (let i = 0; i < aNewAnnotations.length; i++) {
    if (i >= aOldAnnotations.length) {
      browser.contextMenus.create({
        id: "annotation_" + i,
        parentId: "copy-annotation",
        type: "normal",
        title: aNewAnnotations[i].encoding
      });
    } else {
      browser.contextMenus.update("annotation_" + i, {
        title: aNewAnnotations[i].encoding
      });
    }
  }
  for (let i = 0; i < aOldAnnotations.length - aNewAnnotations.length; i++) {
    browser.contextMenus.remove("annotation_" + (aNewAnnotations.length + i));
  }
}

// Retrieve the MathML data sent by the get-mathml-data.js content script when
// context menu is opened.
// FIXME: Can we improve the retrieval
// See https://github.com/fred-wang/webextension-mathml-copy/issues/2
browser.runtime.onConnect.addListener((aPort) => {
  if (aPort.name == "get-mathml-data") {
    aPort.onMessage.addListener((aMathMLData) => {
      updateAnnotationMenuItems(gMathMLData.annotations,
                                aMathMLData.annotations);
      gMathMLData = aMathMLData;
    });
    aPort.postMessage("Listening for updates of MathML data...");
  }
});
