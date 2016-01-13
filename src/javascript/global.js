var $           = require('jquery');
var modal       = require('./modal.mdl');
var popcorn     = require('./popcorn');
var videojs     = require('video.js');
var d3          = require('d3');
// var material = require('material');

// Data sets
var chapters    = require('./chapters.json').chapters;
var speech      = require('./speech.json').paragraphs;
var treemap     = require('./treemap.json');

var youtubeLink = "http://m.youtube.com/watch?v=UPFT4xlNE5g&t=";
var startingTime = new Date(1421787000000);

var currentChapter = 0;

// Helper function for converting time from seconds
String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0" + hours;}
    if (minutes < 10) {minutes = "0" + minutes;}
    if (seconds < 10) {seconds = "0" + seconds;}
    var time    = hours + 'h' + minutes + 'm' + seconds + 's';
    return time;
};

// Debounce function for intensive drawing operations
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

function updateQuestions() {
    $('#chapter-title').html(chapters[currentChapter].title);
    $('#chapter-question-list').removeClass();
    $('#chapter-question-list').addClass('mdl-color--' + chapters[currentChapter].color);
    $('#chapter-question-list li').each(function(i) {
        $(this).html(chapters[currentChapter].questions[i]);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    // Video update events
    var popcorn = Popcorn('video');

    $.each(speech, function(i, x) {
        popcorn.code({
            start: x.startTime,
            end: x.endTime,
            onStart: function(options) {
                $('#text-display').html(x.text);
            }
        });
    });

    var video = document.getElementById('video');
    video.textTracks[0].mode = "hidden";

    video.ontimeupdate = function() {
        var time = Math.floor(video.currentTime);
        // if (time > chapters[currentChapter].start) {
        //     currentChapter++;
        //     updateQuestions();
        // }

        $('#youtube-watch-link').click(function() {
            window.location = youtubeLink + String(time).toHHMMSS();
        });

        d3.select('.timeline')
            .attr('transform', 'translate(0, ' + x((time * 1000) + startingTime.getTime()) + ')');
    };

    var player = videojs('video', {
        inactivityTimeout: 0
    }, function() {
      // this.play(); // if you don't trust autoplay for some reason 
    });

    $('#youtube-watch-link').click(function() {
        window.location = youtubeLink;
    });

    $('#video-start-button').click(function(e) {
        e.preventDefault();
        video.play();
    });

    $('.embed-button').click(function () {
        modal.showDialog({
            title: 'Embed',
            text: 'Paste this into any webpage: <textarea readonly class="embed-dialog-textarea">&lt;iframe src="//googletrends.github.io/2016-state-of-the-union/embed/' + $(this).data('embed') + '.html" scrolling="no" frameBorder="0" width="460" height="460" &gt;&lt;/iframe&gt;</textarea>',
            negative: {
                title: 'Close'
            }
        });
    });

    $('.share-button').click(function () {
        modal.showDialog({
            title: 'Share',
            contentStyle: 'max-width: 250px;',
            text: '<ul class="embed-share-options"><li id="embed-share-facebook">Facebook</li><li id="embed-share-google">Google+</li><li id="embed-share-twitter">Twitter</li></ul>',
            negative: {
                title: 'Close'
            },
            onLoaded: function() {
                $('#embed-share-facebook').click(function(e) {
                    console.log('share on facebook');
                });
                $('#embed-share-google').click(function(e) {
                    console.log('share on google');
                });
                $('#embed-share-twitter').click(function(e) {
                    e.preventDefault();
                    var shareText = "Google Trends share text";
                    var url = "http://googletrends.github.io/2016-state-of-the-union/";
                    var w = 550;
                    var h = 300;
                    var top = (screen.height / 2) - (h / 2);
                    var left = (screen.width / 2) - (w / 2);
                    var href = "http://twitter.com/share?text=" + encodeURI(shareText) + "&url=" + encodeURI(url);
                    window.open(href, "tweet", "height=" + h + ",width=" + w + ",top=" + top + ",left=" + left + ",resizable=1");
                });
            }
        });
    });

}, false);

// Streamgraph visualization
colorrange = [
    "#ffccd1",
    "#f38eb0",
    "#cd92d7",
    "#8fc9f8",
    "#7fdde9",
    "#a4d5a6",
    "#e5ed9b",
    "#ffdf81",
    "#ffaa90"
];

strokecolor = "#dddddd";

var margin = {top: 20, right: 20, bottom: 20, left: 30};

var width;
var height = 800 - margin.top - margin.bottom;

var x;
var y;

var z = d3.scale.ordinal().range(colorrange);

var xAxis;
var yAxis;

var yAxisr = d3.svg.axis()
    .scale(y);

var stack = d3.layout.stack()
    .offset("silhouette")
    .values(function(d) { return d.values; })
    .x(function(d) { return d.date; })
    .y(function(d) { return d.value; });

var nest = d3.nest()
    .key(function(d) { return d.key; });

var area;

var svg;
var layers;
var streamgraphData;

var drawStreamGraph = debounce(function() {

    width = $(".streamgraph").width() - margin.left - margin.right;
    height = Math.floor(width)  - margin.top - margin.bottom;

    x = d3.time.scale().range([0, height]);
    y = d3.scale.linear().range([0, width]);

    var formatMinutes = function(d) {
        var diffMs = (d - startingTime);
        var diffMins = Math.round(diffMs / 60000);
        return diffMins;    
    };

    xAxis = d3.svg.axis().scale(x).orient("top").ticks(d3.time.minutes, 5).tickFormat(formatMinutes);
    yAxis = d3.svg.axis().scale(y);

    area = d3.svg.area()
        .interpolate("cardinal")
        .y(function(d) { return x(d.date); })
        .x0(function(d) { return y(d.y0); })
        .x1(function(d) { return y(d.y0 + d.y); });

    $('.streamgraph-holder').empty();

    x.domain(d3.extent(streamgraphData, function(d) { return d.date; }));
    y.domain([0, d3.max(streamgraphData, function(d) { return d.y0 + d.y; })]);

    svg = d3.select(".streamgraph-holder").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.selectAll(".layer")
        .data(layers)
        .enter().append("path")
        .attr("class", "layer")
        .attr("d", function(d) { return area(d.values); })
        .style("fill", function(d, i) { return z(i); });

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis.orient("left"));

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0, 0)")
        .call(yAxis.orient("top"));

    var timeline = svg.append("g")
        .append('line')
        .attr('x1', '0')
        .attr('x2', width)
        .attr('y1', '0')
        .attr('y2', '0')
        .attr('class', 'timeline');

}, 500);

var graph = d3.csv("chart.csv", function(data) {
    data.forEach(function(d) {
        d.date = new Date(parseInt(d.date, 10));
        d.value = +d.value;
    });

    streamgraphData = data;
    layers = stack(nest.entries(data));
    drawStreamGraph();
});

// Draw the treemap
var treemapWidth = $('.treemap').width(),
    treemapHeight = 300-40,
    color = d3.scale.category20c(),
    div = d3.select(".treemap").append("div").style("position", "relative");

var tree = d3.layout.treemap()
    .size([treemapWidth, treemapHeight])
    .sticky(true)
    .value(function(d) { return d.size; });

var node = div.datum(treemap).selectAll(".node")
        .data(tree.nodes)
        .enter()
        .append("div")
        .attr("class", "node")
        .call(position)
        .style("background-color", function(d) {
            return d.name == 'tree' ? '#fff' : d.color;
        })
        .append('div')
        .style("font-size", function(d) {
            return Math.max(16, 0.1 * Math.sqrt(d.area))+'px'; })
        .text(function(d) {
            return d.children ? null : d.name;
        })

$('.node').click(function(e) {
    currentChapter++;
    updateQuestions();
});

function position() {
  this.style("left", function(d) {return d.x + "px"; })
      .style("top", function(d) { return d.y + "px"; })
      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
}

window.addEventListener('resize', drawStreamGraph);

// // Draw the map of the states
// var mapWidth = 960,
//     mapHeight = 600;

// var projection = d3.geo.albersUsa()
//     .scale(1280)
//     .translate([mapWidth / 2, mapHeight / 2]);

// d3.json("usa.json", function(error, usaJson) {
//     var svg = d3.select("#usa-map").append("svg")
//         .attr("width", mapWidth)
//         .attr("height", mapHeight);

//     svg.append("path")
//         .datum(topojson.mesh(usaJson, usaJson.objects.states, function(a, b) { return a !== b; }))
//         .attr("class", "states")
//         .attr("d", path);
// });