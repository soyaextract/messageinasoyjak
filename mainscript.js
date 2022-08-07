// ==UserScript==
// @name         Message-in-a-Soyjak
// @namespace    http://tampermonkey.net/
// @version      0.1.3
// @description  For reading and putting messages inside soyjaks.
// @author       (You)
// @match        https://soyjak.party/*
// @icon         https://soyjak.party/static/favicon.png
// @downloadURL  https://github.com/soyaextract/messageinasoyjak/blob/main/mainscript.js
// @updateURL    https://github.com/soyaextract/messageinasoyjak/blob/main/mainscript.js

// ==/UserScript==

(function () {
  function insert_after(new_node, ref_node) {
    ref_node.parentNode.insertBefore(new_node, ref_node.nextSibling);
  }

  function encode(zone) {
    let basefile = document.querySelector("input[id=encfin]").files[0];
    let txtbx = document.querySelector("input[id=enctin]");

    let ocvs = document.querySelector("canvas[id=ocvs]");
    let octx = ocvs.getContext('2d');

    if (basefile == undefined) {
      txtbx.value = "No file selected.";
      return;
    }

    let fcvs = document.querySelector("canvas[id=fcvs]");
    let fctx = fcvs.getContext('2d');

    let reader = new FileReader();
    reader.readAsDataURL(basefile);

    reader.onloadend = function () {
      let eimgBase = new Image();
      eimgBase.src = URL.createObjectURL(basefile);
      eimgBase.onload = function() {

        // Convert the message to a binary string
        let msgtxt = document.querySelector("input[id=enctin]").value;
        let binaryMessage = "";
        for (i = 0; i < msgtxt.length; i++) {
          let binaryChar = msgtxt[i].charCodeAt(0).toString(2);

        // Pad with 0 until the binaryChar has a lenght of 8 (1 Byte)
          while(binaryChar.length < 8) {
            binaryChar = "0" + binaryChar;
          }

        binaryMessage += binaryChar;
        }

        //Draw the original image:
        ocvs.width = eimgBase.width;
        ocvs.height = eimgBase.height;
        octx.drawImage(eimgBase, 0, 0);

        fcvs.width = eimgBase.height;
        fcvs.height = eimgBase.height;

        //Image data:
        let original = octx.getImageData(0, 0, eimgBase.width, eimgBase.height);
        let pixel = original.data;

        // Normalize the original image
        for (let i = 0, n = pixel.length; i < n; i += 4) {
          for (let offset =0; offset < 3; offset ++) {
            if(pixel[i + offset] %2 != 0) {
              pixel[i + offset]--;
            }
          }
        }

        // Apply the binary string to the normalized image and draw it
       let counter = 0;
       for (var i = 0, n = pixel.length; i < n; i += 4) {
         for (var offset =0; offset < 3; offset ++) {
           if (counter < binaryMessage.length) {
             pixel[i + offset] += parseInt(binaryMessage[counter]);
             counter++;
           }
         else {
           break;
         }
       }
     }
     fctx.putImageData(original, 0, 0);

      };
    }

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
    let postform = document.querySelector("form[name='post']");
    postform.style['margin-bottom'] = '2em';
    //Add decoding buttons:
    let img_nodes = document.querySelectorAll("a[title^='Save as original filename']")
    for(const node of img_nodes) {

      let decodeButton = document.createElement("a");
      let msgzone = document.createElement("div");
      let msgtxt = document.createTextNode("");
      msgzone.appendChild(msgtxt);
      decodeButton.innerHTML = "👁";

      let opened = 0;
      let loaded = 0
      decodeButton.onclick = function get_message(){
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
      insert_after(decodeButton, node);
      insert_after(msgzone, decodeButton.parentNode);
    }
    //Add encoding zone:
    let postform_nodes = document.getElementsByName("post");
    let node = postform_nodes[0];
    let encodeZone = document.createElement("div");
    insert_after(encodeZone, node)
    let encodeButton = document.createElement("button");
    encodeButton.innerHTML = "Fuse";
    let finput = document.createElement("input");
    finput.type = "file";
    finput.id = "encfin";
    let tinput = document.createElement("input");
    tinput.type = "text";
    tinput.id = "enctin";
    encodeZone.align = "center";
    encodeZone.innerHTML += "Fuse message into image: ";
    encodeZone.appendChild(tinput);
    encodeZone.appendChild(finput);
    encodeZone.appendChild(encodeButton);
    //Canvases for images:
    //Original canvas:
    let origCvs = document.createElement("canvas");
    origCvs.id = "ocvs";
    origCvs.style.display = "none";
    encodeZone.appendChild(origCvs);

    //Fused canvas:
    let fuseCvs = document.createElement("canvas")
    fuseCvs.id = "fcvs";
    encodeZone.appendChild(fuseCvs);
    fuseCvs.style.display = "none"

    let encodeImgShown = 0;
    encodeButton.onclick = function startEcode(){
      if(encodeImgShown == 1){
        encodeImgShown = 0
        encodeButton.innerHTML = "Fuse"
        fuseCvs.style.display = "none"
        return;
      }
      else {
        encode(encodeZone);
        encodeButton.innerHTML = "Clear"
        encodeImgShown = 1;
        fuseCvs.style.display = "block"
      };

    };

  }
  add_buttons();
})();
