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
        text: 'This dialog can be closed by pressing ESC or clicking outside of the dialog.<br/>Pressing "YAY" will fire the configured action.',
        negative: {
            title: 'Nope'
        },
        positive: {
            title: 'Yay',
            onClick: function (e) {
                alert('Action performed!');
            }
        }
    });
});

$('#questions-share-button').click(function () {
    modal.showDialog({
        title: 'Action',
        text: 'This dialog can be closed by pressing ESC or clicking outside of the dialog.<br/>Pressing "YAY" will fire the configured action.',
        negative: {
            title: 'Nope'
        },
        positive: {
            title: 'Yay',
            onClick: function (e) {
                alert('Action performed!');
            }
        }
    });
});