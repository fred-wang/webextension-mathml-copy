/* -*- Mode: Java; tab-width: 2; indent-tabs-mode:nil; c-basic-offset: 2 -*- */
/* vim: set ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function copyToClipboard(text, mimeTypes) {
  function oncopy(event) {
    document.removeEventListener("copy", oncopy, true);

    // Hide the event from the page to prevent tampering.
    event.stopImmediatePropagation();

    // Overwrite the clipboard content.
    event.preventDefault();

    for (let i = 0; i < mimeTypes.length; i++) {
      event.clipboardData.setData(mimeTypes[i], text);
    }
  }
  document.addEventListener("copy", oncopy, true);
  document.execCommand("copy");
}

browser.runtime.onConnect.addListener((aPort) => {
  aPort.onMessage.addListener((aClipboardData) => {
    aPort.disconnect();
    copyToClipboard(aClipboardData.source, aClipboardData.mimeTypes);
  });
  aPort.postMessage("Send me the data to copy!");
});
