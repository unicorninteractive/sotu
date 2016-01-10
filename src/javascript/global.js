var $           = require('jquery');
var modal       = require('./modal.mdl');
var popcorn     = require('./popcorn');
var videojs     = require('video.js');
var d3          = require('d3');
// var material = require('material');

// Data sets
var chapters    = require('./chapters.json').chapters;
var speech      = require('./speech.json').paragraphs;

var youtubeLink = "http://m.youtube.com/watch?v=UPFT4xlNE5g&t=";

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

        $('#youtube-watch-link').attr('href', youtubeLink + String(time).toHHMMSS());

        d3.select('.timeline')
            .attr('transform', 'translate(0, ' + (time * 2) + ')');
    };

    var player = videojs('video', { /* Options */ }, function() {
      // this.play(); // if you don't trust autoplay for some reason 
    });

    $('#video-start-button').click(function(e) {
        e.preventDefault();
        video.play();
    });

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

var datearray = [];
var format = d3.time.format("%m/%d/%y");

var margin = {top: 20, right: 40, bottom: 30, left: 30};
var width = $(".streamgraph").width() - margin.left - margin.right;
var height = 800 - margin.top - margin.bottom;

var tooltip = d3.select("body")
    .append("div")
    .attr("class", "remove")
    .style("position", "absolute")
    .style("z-index", "20")
    .style("visibility", "hidden")
    .style("top", "30px")
    .style("left", "55px");

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height-10, 0]);

var z = d3.scale.ordinal()
    .range(colorrange);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top")
    .ticks(d3.time.weeks);

var yAxis = d3.svg.axis()
    .scale(y);

var yAxisr = d3.svg.axis()
    .scale(y);

var stack = d3.layout.stack()
    .offset("silhouette")
    .values(function(d) { return d.values; })
    .x(function(d) { return d.date; })
    .y(function(d) { return d.value; });

var nest = d3.nest()
    .key(function(d) { return d.key; });

var area = d3.svg.area()
    .interpolate("cardinal")
    .y(function(d) { return x(d.date); })
    .x0(function(d) { return y(d.y0); })
    .x1(function(d) { return y(d.y0 + d.y); });

var svg = d3.select(".streamgraph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var drawStreamGraph = debounce(function() {
    console.log('draw stream graph');
}, 500);

var graph = d3.csv("chart.csv", function(data) {
    data.forEach(function(d) {
        d.date = format.parse(d.date);
        d.value = +d.value;
    });

    var layers = stack(nest.entries(data));

    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.y0 + d.y; })]);

    svg.selectAll(".layer")
      .data(layers)
    .enter().append("path")
      .attr("class", "layer")
      .attr("d", function(d) { return area(d.values); })
      .style("fill", function(d, i) { return z(i); });

    svg.append("g")
      .attr("class", "x axis")
      // .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + width + ", 0)")
      .call(yAxis.orient("right"));

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis.orient("left"));

    svg.selectAll(".layer")
        .attr("opacity", 1)
        .on("mouseover", function(d, i) {
            svg.selectAll(".layer").transition()
                .duration(250)
                .attr("opacity", function(d, j) {
                return j != i ? 0.6 : 1;
    });})

    .on("mousemove", function(d, i) {
      mousex = d3.mouse(this);
      mousex = mousex[0];

      var invertedx = x.invert(mousex);
      invertedx = invertedx.getMonth() + invertedx.getDate();

      var selected = (d.values);
      for (var k = 0; k < selected.length; k++) {
        datearray[k] = selected[k].date;
        datearray[k] = datearray[k].getMonth() + datearray[k].getDate();
      }

      mousedate = datearray.indexOf(invertedx);
      pro = d.values[mousedate].value;

      d3.select(this)
      .classed("hover", true)
      .attr("stroke", strokecolor)
      .attr("stroke-width", "0.5px"), 
      tooltip.html( "<p>" + d.key + "<br>" + pro + "</p>" ).style("visibility", "visible");
      
    })

    .on("mouseout", function(d, i) {
        svg.selectAll(".layer")
            .transition()
            .duration(250)
            .attr("opacity", "1");

      d3.select(this)
        .classed("hover", false)
        .attr("stroke-width", "0px"), tooltip.html( "<p>" + d.key + "<br>" + pro + "</p>" ).style("visibility", "hidden");
  });
    
  var vertical = d3.select(".chart")
        .append("div")
        .attr("class", "remove");

  d3.select(".chart")
      .on("mousemove", function(){  
        mousex = d3.mouse(this);
        mousex = mousex[0] + 5;
        vertical.style("left", mousex + "px" );})

      .on("mouseover", function(){  
        mousex = d3.mouse(this);
        mousex = mousex[0] + 5;
        vertical.style("left", mousex + "px");});

    var timeline = svg.append("g")
        .append('line')
        .attr('x1', '0')
        .attr('x2', width)
        .attr('y1', '100')
        .attr('y2', '100')
        .attr('class', 'timeline');
});

window.addEventListener('resize', drawStreamGraph);