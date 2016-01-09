var $           = require('jquery');
var modal       = require('./modal.mdl');
var popcorn     = require('./popcorn');
// var material = require('material');

// Data sets
var chapters    = require('./chapters.json').chapters;
var speech      = require('./speech.json').paragraphs;

var currentChapter = 0;

document.addEventListener("DOMContentLoaded", function() {
    // Subtitle update logic
    // var track = document.getElementById("track1");

    // track.addEventListener("cuechange", function() {
    //     var myTrack = this.track;
    //     var myCues = myTrack.activeCues;

    //     if (myCues.length > 0) {
    //         var disp = document.getElementById('cueDisplay');
    //         disp.innerText = myCues[0].text;
    //     }
    // }, false);

    // Video update events
    var popcorn = Popcorn('video');

    for (var x in speech) {
        popcorn.code({
            start: speech[x].start,
            end: speech[x].end,
            onStart: function(options) {
                $('#text-display').html(speech[x].text);
            }
        });
    }

    var video = document.getElementById('video');

    function updateQuestions() {
        $('#chapter-title').html(chapters[currentChapter].title);
        $('#chapter-question-list').removeClass();
        $('#chapter-question-list').addClass('mdl-color--' + chapters[currentChapter].color);
        $('#chapter-question-list li').each(function(i) {
            $(this).html(chapters[currentChapter].questions[i]);
        });
    }

    video.ontimeupdate = function() {
        var time = Math.floor(video.currentTime);
        if (time > chapters[currentChapter].start) {
            currentChapter++;
            updateQuestions();
        }
    };

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