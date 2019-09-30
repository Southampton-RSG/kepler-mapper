// Height and width settings
var canvas_height = window.innerHeight - 5;
document.getElementById("canvas").style.height = canvas_height + "px";
var width = document.getElementById("canvas").offsetWidth;
var height = document.getElementById("canvas").offsetHeight;
var w = width;
var h = height;

var focus_node = null, highlight_node = null;
var text_center = false;
var outline = false;

// Size for zooming
var size = d3.scale.pow().exponent(1)
           .domain([1,100])
           .range([8,24]);


// Variety of variable inits
var highlight_color = "blue";
var highlight_trans = 0.1;
var default_node_color = "#ccc";
var default_node_color = "rgba(160,160,160, 0.5)";

var default_node_size = 5;  // 50 originally; km-gui
var charge_off = 0;  // 0 originally; km-gui
var charge_low = -1;  // -1 originally; km-gui
var charge_medium = -60;  // -600 originally; km-gui
var charge_high = -120;  // -1200 originally; km-gui
var gravity_off = 0;  // 0 originally; km-gui
var gravity_low = 0.07;  // 0.07 originally; km-gui
var gravity_medium = 0.2;  // 0.2 originally; km-gui
var gravity_high = 0.4;  // 0.4 originally; km-gui
var linkDistance_medium = 0.5;  // 5.0 originally; km-gui
var stdDeviation_medium = 1.2;  // 12.0 originally; km-gui

var default_link_color = "rgba(160,160,160, 0.5)";
var nominal_base_node_size = 8;
var nominal_text_size = 15;
var max_text_size = 24;
var nominal_stroke = 1.0;
var max_stroke = 4.5;
var max_base_node_size = 36;
var min_zoom = 0.1;
var max_zoom = 7;
var zoom = d3.behavior.zoom().scaleExtent([min_zoom,max_zoom]);

var tocolor = "fill";
var towhite = "stroke";
if (outline) {
  tocolor = "stroke";
  towhite = "fill";
}

// We draw the graph in SVG
var svg = d3.select("#canvas").append("svg")
          .attr("width", width)
          .attr("height", height)
          .on("contextmenu", function (d, i) {
            d3.event.preventDefault(); // Block right-clicks
           });

// Show/Hide Functionality
d3.select("#tooltip_control").on("click", function() {
  d3.select("#tooltip").style("display", "none");
});
d3.select("#meta_control").on("click", function() {
  d3.select("#meta").style("display", "none");
});

// Color settings: Ordinal Scale of ["0"-"30"] hot-to-cold
var color = d3.scale.ordinal()
            .domain(["0","1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
                     "11", "12", "13","14","15","16","17","18","19","20",
                     "21","22","23","24","25","26","27","28","29","30"])
            .range(["#FF0000","#FF1400","#FF2800","#FF3c00","#FF5000","#FF6400",
                    "#FF7800","#FF8c00","#FFa000","#FFb400","#FFc800","#FFdc00",
                    "#FFf000","#fdff00","#b0ff00","#65ff00","#17ff00","#00ff36",
                    "#00ff83","#00ffd0","#00e4ff","#00c4ff","#00a4ff","#00a4ff",
                    "#0084ff","#0064ff","#0044ff","#0022ff","#0002ff","#0100ff",
                    "#0300ff","#0500ff"]);

// Force settings
var force = d3.layout.force()
            .linkDistance(linkDistance_medium)
            .gravity(gravity_high)
            .charge(charge_high)
            .size([w, h]);

// Set variable to disable the keypress catching code when we're trying to type a filename
var lasso_active = false;

var g = svg.append("g");

// ========== JtD Lasso starts ==========
// Create the area where the lasso event can be triggered
var lasso_area = g.append("rect")
        .attr("width", w)
        .attr("height", h)
        .style('opacity', 0.0);
        // .style("stroke", 'red')
        // .style("stroke-width", 5)
        // .style("opacity", 0.25);

// Set-up lasso instance
var lasso = d3.lasso()
       .closePathDistance(999999) // max distance for the lasso loop to be closed
       .closePathSelect(true) // can items be selected by closing the path?
       .hoverSelect(true) // can items by selected by hovering over them?
       .area(lasso_area) // area where the lasso can be started
       .on("start", lasso_start) // lasso start function
       .on("draw", lasso_draw) // lasso draw function
       .on("end", lasso_end); // lasso end function


// Lasso functions to execute while lassoing
function lasso_start() {
  // Style the dots as all unselected, and disable the export button
  lasso.items()
  .classed({"not_possible":true, "selected":false, "excluded":false}); // style as not possible
}

function lasso_draw() {
  // Style the possible dots
  lasso.items().filter(function(d) {return d.possible===true})
  .classed({"not_possible":false, "possible":true});

  // Style the not possible dot
  lasso.items().filter(function(d) {return d.possible===false})
  .classed({"not_possible":true, "possible":false});
}

function lasso_end() {

  // If the selection is nonzero
  if(!lasso.items().filter(function(d) {return d.selected===true}).empty()) {

    // Style the selected dots & nonselected dots, and enable export button
    lasso.items().filter(function(d) {return d.selected===true})
         .classed({"not_possible":false,"possible":false, "excluded":false});
    lasso.items().filter(function(d) {return d.selected===false})
         .classed({"not_possible":false, "possible":false, "excluded":true});

    // Retrieve the data for the selected points, and concatenate the names into a request string
    // Then send that request to the server
    lasso_active = true;
    let data = lasso.items().filter(function(d) {return d.selected===true}).data();
    let names = [];
    for (let i = 0; i < data.length; i++) {
      names.push(data[i].name);
    }
    let names_joined = names.join(',');
    // $('#lasso_save').load("save/"+names_joined+"/");
    window.open("save/"+names_joined+"/", "myWindow", "width=640,height=800")

  } else {
    // Reset everyone's style
    lasso.items().classed({"not_possible":false,"possible":false, "excluded":false});
  }
}
// ========== JtD Lasso Ends ==========

svg.style("cursor","move");

var graph = JSON.parse(document.getElementById("json_graph").dataset.graph);

force
  .nodes(graph.nodes)
  .links(graph.links)
  .start();

var link = g.selectAll(".link")
            .data(graph.links)
            .enter().append("line")
              .attr("class", "link")
              .style("stroke-width", function(d) { return d.w * nominal_stroke; })
              .style("stroke-width", function(d) { return d.w * nominal_stroke; })
              //.style("stroke", function(d) {
              //  if (isNumber(d.score) && d.score>=0) return color(d.score);
              //  else return default_link_color; })

var node = g.selectAll(".node")
            .data(graph.nodes)
            .enter().append("g")
              .attr("class", "node")
              .call(force.drag).append("path") // This section copied from 'circle' later on
                .attr("d", d3.svg.symbol()
                  .size(function(d) { return d.size * default_node_size; })
                  .type(function(d) { return d.type; }))
                .attr("class", "circle")
                .style(tocolor, function(d) {
                  return color(d.color);});


node.on("dblclick.zoom", function(d) { d3.event.stopPropagation();
  var dcx = (window.innerWidth/2-d.x*zoom.scale());
  var dcy = (window.innerHeight/2-d.y*zoom.scale());
  zoom.translate([dcx,dcy]);
  // g.attr("transform", "translate("+ dcx + "," + dcy  + ")scale(" + zoom.scale() + ")");
  g.attr("transform", "translate("+ dcx + "," + dcy  + ")scale(" + zoom.scale() + ")");

});



// Drop-shadow Filter
var svg = d3.select("svg");
var defs = svg.append("defs");
var dropShadowFilter = defs.append('svg:filter')
  .attr('id', 'drop-shadow')
  .attr('filterUnits', "userSpaceOnUse")
  .attr('width', '250%')
  .attr('height', '250%');
dropShadowFilter.append('svg:feGaussianBlur')
  .attr('in', 'SourceGraphic')
  .attr('stdDeviation', stdDeviation_medium)
  .attr('result', 'blur-out');
dropShadowFilter.append('svg:feColorMatrix')
  .attr('in', 'blur-out')
  .attr('type', 'hueRotate')
  .attr('values', 0)
  .attr('result', 'color-out');
dropShadowFilter.append('svg:feOffset')
  .attr('in', 'color-out')
  .attr('dx', 0)
  .attr('dy', 0)
  .attr('result', 'the-shadow');
dropShadowFilter.append('svg:feComponentTransfer')
  .attr('type', 'linear')
  .attr('slope', 0.2)
  .attr('result', 'shadow-opacity');
dropShadowFilter.append('svg:feBlend')
  .attr('in', 'SourceGraphic')
  .attr('in2', 'the-shadow')
  .attr('mode', 'normal');

// var circle = node.append("path")
//   .attr("d", d3.svg.symbol()
//     .size(function(d) { return d.size * 50; })
//     .type(function(d) { return d.type; }))
//   .attr("class", "circle")
//   .style(tocolor, function(d) {
//     return color(d.color);});
//.style("filter", "url(#drop-shadow)");


var text = g.selectAll(".text")
  .data(graph.nodes)
  .enter().append("text")
    .attr("dy", ".35em")
    .style("font-family", "Roboto")
    .style("font-weight", "400")
    .style("color", "#2C3E50")
    .style("font-size", nominal_text_size + "px");

if (text_center) {
  text.text(function(d) { return d.id; })
    .style("text-anchor", "middle");
} else {
  text.attr("dx", function(d) {return (size(d.size)||nominal_base_node_size);})
    .text(function(d) { return '\u2002'+d.id; });
}

// Mouse events
node.on("mouseover", function(d) {
  set_highlight(d);

  d3.select("#tooltip").style("display", "block");
  d3.select("#tooltip_content").html(d.tooltip + "<br/>");
  }).on("mousedown", function(d) {
    // d3.event.stopPropagation(); // Removed to allow zooming
    focus_node = d;
    if (highlight_node === null) set_highlight(d)
  }).on("mouseout", function(d) {
    exit_highlight();
  });

  d3.select(window).on("mouseup", function() {
    if (focus_node!==null){
      focus_node = null;
    }
    if (highlight_node === null) exit_highlight();
});

// Node highlighting logic
function exit_highlight(){
  highlight_node = null;
  if (focus_node===null){
    svg.style("cursor","move");
  }
}

function set_highlight(d){
  svg.style("cursor","pointer");
  if (focus_node!==null) d = focus_node;
}
// Zoom logic
zoom.on("zoom", function() {
  // Only pan on right-click!
  //console.log('Zoom button: '+d3.event.sourceEvent.button+', buttons: '+d3.event.sourceEvent.buttons)
  if(d3.event.sourceEvent.type === 'wheel' || (!d3.event.sourceEvent.buttons && d3.event.sourceEvent.button != 0) || (d3.event.sourceEvent.buttons == 2)){
    var stroke = nominal_stroke;
    var base_radius = nominal_base_node_size;
    if (nominal_base_node_size*zoom.scale()>max_base_node_size) {
      base_radius = max_base_node_size/zoom.scale();}
    node.attr("d", d3.svg.symbol() // Formerly circle
      .size(function(d) { return d.size * default_node_size; })
      .type(function(d) { return d.type; }))
    if (!text_center) text.attr("dx", function(d) {
      return (size(d.size)*base_radius/nominal_base_node_size||base_radius); });

    var text_size = nominal_text_size;
    if (nominal_text_size*zoom.scale()>max_text_size) {
      text_size = max_text_size/zoom.scale(); }
    text.style("font-size",text_size + "px");
    g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }
});

svg.call(zoom);
resize();
d3.select(window).on("resize", resize);

// Animation per tick
force.on("tick", function() {
  node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  text.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  link.attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });
  node.attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });
});

// Resizing window and redraws
function resize() {
  var width = window.innerWidth, height = window.innerHeight;
  svg.attr("width", width).attr("height", height);
  var width = document.getElementById("canvas").offsetWidth;
  var height = document.getElementById("canvas").offsetHeight;
  force.size([force.size()[0]+(width-w)/zoom.scale(),
              force.size()[1]+(height-h)/zoom.scale()]).resume();
    w = width;
    h = height;
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

// Key press events
window.addEventListener("keydown", function (event) {
  if (event.defaultPrevented || lasso_active) {
    return; // Do nothing if the event was already processed or we're trying to lasso something and
    // the user is typing the name out
  }
  switch (event.key) {
    case "s":
      // Do something for "s" key press.
      node.style("filter", "url(#drop-shadow)");
      break;
    case "c":
      // Do something for "s" key press.
      node.style("filter", null);
      break;
    case "p":
      // Do something for "p" key press.
      d3.select("body").attr('id', null).attr('id', "print")
      break;
    case "d":
      // Do something for "d" key press.
      d3.select("body").attr('id', null).attr('id', "display")
      break;
    case "z":
      force.gravity(gravity_off)
           .charge(charge_off);
      resize();
      break
    case "m":
      force.gravity(gravity_low)
           .charge(charge_low);
      resize();
      break
    case "e":
      force.gravity(gravity_medium)
           .charge(charge_medium);

      resize();
      break;
    default:
      return; // Quit when this doesn't handle the key event.
  }
  // Cancel the default action to avoid it being handled twice
  event.preventDefault();
}, true);

// ========== JtD Lasso Starts ==========
// Call the lasso
lasso.items(d3.selectAll(".node"));
g.call(lasso);
// ========== JtD Lasso Ends ==========


