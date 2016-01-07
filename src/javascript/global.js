var $ = require('jquery');
// var material = require('material');

var modal = require('./modal.mdl');

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

$('#questions-embed-button').click(function () {
    modal.showDialog({
        title: 'Action',
        text: 'Embed this',
        negative: {
            title: 'Close'
        },
        positive: {
            title: 'Embed',
            onClick: function (e) {
                console.log("Embed action goes here");
            }
        }
    });
});

$('#questions-share-button').click(function () {
    modal.showDialog({
        title: 'Action',
        text: 'Share this',
        negative: {
            title: 'Close'
        },
        positive: {
            title: 'Share',
            onClick: function (e) {
                console.log("Share action goes here");
            }
        }
    });
});