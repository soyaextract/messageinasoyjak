// ==UserScript==
// @name         Message-in-a-Soyjak
// @namespace    http://tampermonkey.net/
// @version      0.1.3
// @description  For reading and putting messages in soyjaks.
// @author       (You)
// @match        https://soyjak.party/*
// @icon         https://soyjak.party/static/favicon.png
// ==/UserScript==

(function () {
  function insert_after(new_node, ref_node) {
    ref_node.parentNode.insertBefore(new_node, ref_node.nextSibling);
  }

  function decode(pathtofile,msgzone) {

    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    let img = new Image();

    img.src = pathtofile;
    img.onload = start;
    function start(){
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      context.drawImage(img,0,0);


      let original = context.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
      let binaryMessage = "";
      let pixel = original.data;

      for (let i = 0, n = pixel.length; i < n; i += 4) {
        for (let offset =0; offset < 3; offset ++) {
          let value = 0;
          if(pixel[i + offset] %2 != 0) {
            value = 1;
          }
          binaryMessage += value;
        }
      }


      let output = "";
      for (let i = 0; i < binaryMessage.length; i += 8) {
        let c = 0;
        for (let j = 0; j < 8; j++) {
          c <<= 1;
          c |= parseInt(binaryMessage[i + j]);
        }

        let c2 = String.fromCharCode(c);
        if (c2 !== c2.replace(/[^\x20-\x7E]/g, '')){
            break;
        }
        else{
          output += c2;
        }

      }
      msgzone.innerHTML = "\n" + output;
    }
  }

  function add_buttons() {
    let img_nodes = document.querySelectorAll("a[title^='Save as original filename']")
    for(const node of img_nodes) {

      let button3 = document.createElement("a");
      let msgzone = document.createElement("div");
      let msgtxt = document.createTextNode("");
      msgzone.appendChild(msgtxt);
      button3.innerHTML = "👁";

      let opened = 0;
      let loaded = 0

      button3.onclick = function get_message(){
        if(!loaded){
          msgzone.innerHTML = "Checking for message..."
          decode(node,msgzone);
          loaded = 1;
          opened = 1;
          return;
        }
        if (opened){
          msgzone.style.display = "none";
          opened = 0;
        }
        else {
          msgzone.style.display = "block";
          opened = 1;
        }
      };
      insert_after(button3, node);
      insert_after(msgzone, button3.parentNode);
    }

  }
  add_buttons();
})();
