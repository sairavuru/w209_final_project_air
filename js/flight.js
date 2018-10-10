var flight_viz_lib = flight_viz_lib || {};

flight_viz_lib.routemapPlot = function() {

  var svg = d3.select("#routemap")
  .append("svg")
  .attr("width", "100%");

  var projection = d3.geoEquirectangular()
    .center([50, 10]) //long and lat starting position
    .scale(150) //starting zoom position
    .rotate([10,0]); //where world split occurs
  var path = d3.geoPath().projection(projection);
  var g = svg.append("g");

  var worldmap_ = function() {
    d3.json("./Data/worldmap.json").then(function(topology) {
        g.selectAll("path")
        .data(topojson.feature(topology, topology.objects.countries).features)
        .enter()
        .append("path")
        .attr("d", path);
   });
  };

  var publicObjs = {
    plotworld: worldmap_
  };

  return publicObjs;
};

function sizeChange() {
    d3.select("g").attr("transform", "scale(" + $("#routemap").width()/900 + ")");
    $("svg").height($("#routemap").width()*0.618);
}

d3.select(window).on("resize", sizeChange);

var routes = flight_viz_lib.routemapPlot();
routes.plotworld();