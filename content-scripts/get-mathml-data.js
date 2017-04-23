/* -*- Mode: Java; tab-width: 2; indent-tabs-mode:nil; c-basic-offset: 2 -*- */
/* vim: set ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const MathMLNameSpace = "http://www.w3.org/1998/Math/MathML";

let port = browser.runtime.connect();

function getAnnotations(aSemantics) {
  let annotations = [];
  let serializer = new XMLSerializer();
  for (let child = aSemantics.firstElementChild; child;
       child = child.nextElementSibling) {
    if (child.namespaceURI === MathMLNameSpace) {
      if (child.localName === "annotation") {
        // Copy the text content of <annotation>.
        annotations.push({
          encoding: child.getAttribute("encoding"),
          source: child.textContent.trim()
        });
      } else if (child.localName === "annotation-xml" &&
                 child.childElementCount === 1) {
        // Copy the serialized unique child of <annotation-xml>.
        annotations.push({
          encoding: child.getAttribute("encoding"),
          source: serializer.serializeToString(child.firstElementChild)
        });
      }
    }
  }
  return annotations;
}

function getMathMLSourceAndAnnotations(aNode)
{
  let result = {};

  // Retrieve the annotations on the first <semantics> ancestor and the source
  // of the first <math> ancestor.
  while (aNode) {
    if (aNode.nodeType === Node.ELEMENT_NODE &&
        aNode.namespaceURI === MathMLNameSpace) {
      if (aNode.localName === "math") {
        result.source = (new XMLSerializer()).serializeToString(aNode);
        break;
      } else if (!result.annotations && aNode.localName === "semantics") {
        result.annotations = getAnnotations(aNode);
      }
    }
    aNode = aNode.parentNode;
  }
  return result;
}

document.addEventListener("contextmenu", function(event) {
  // Retrieve the <math> source and annotations and send that information to the
  // background script.
  port.postMessage(getMathMLSourceAndAnnotations(event.target));
}, true);
