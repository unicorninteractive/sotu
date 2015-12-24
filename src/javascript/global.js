// var $ = require('jquery');
// var material = require('material');


document.addEventListener("DOMContentLoaded", function() {

    var track = document.getElementById("track1");

    track.addEventListener("cuechange", function() {
        var myTrack = this.track;
        var myCues = myTrack.activeCues;

        if (myCues.length > 0) {
            var disp = document.getElementById('cueDisplay');

            disp.innerText = myCues[0].text;
        }

    }, false);

}, false);