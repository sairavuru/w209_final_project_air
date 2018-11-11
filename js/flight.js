var flight_viz_lib = flight_viz_lib || {};

flight_viz_lib = {
	routesData : [],
	airportData : [],
	routesWithLocations:[],
	width:1200,
	height:600
};

flight_viz_lib.svg = d3.select("#routemap")
  .append("svg")
  .attr('width', flight_viz_lib.width)
  .attr('height', flight_viz_lib.height);

flight_viz_lib.projection = d3.geoRobinson()
    .scale(180)
    .translate([flight_viz_lib.width / 2, flight_viz_lib.height / 2]);

flight_viz_lib.path = d3.geoPath()
    .projection(flight_viz_lib.projection)
    .pointRadius(1);

flight_viz_lib.distmapPlot = function(){

    var current_airline_id = -1;
    var current_max_dist = 5000;

    var update_current_airline_id_ = function(id){
		current_airline_id = id;
	};

    var update_max_dist_ = function(dist){
		current_max_dist = dist;
	};

	var routes_from_airport_ = function() {
			//var airline_distance = parseInt(this.dataset.)
		d3.selectAll("#flights").remove();
// the following code is temporary for proof-of concept
	     var links = flight_viz_lib.svg.append("g").attr("id", "flights")
	     .selectAll("path.flight")
	     .data(flight_viz_lib.routesWithLocations)
	     .enter()
	     .append("path")
		   .filter(function(d) { return d.airline_ID === current_airline_id })
	     .filter(function(d) { return d.trip_dist < current_max_dist })
	     .attr("d", function(d) {
			 return flight_viz_lib.path ({type:"LineString", coordinates: [ [d.src_long, d.src_lat], [d.dest_long, d.dest_lat] ]});
		  })
	     .style("fill", "none")
	     .style("stroke-width", 0.6)
		   .style("stroke", function(d) {
	  		 if (d.code_share === "Y") {
	               rt_col = "#377eb8";
	  		 }
	  		 else {
	               rt_col = "#e41a1c";
	  		 }
	  	     return rt_col;
	  	  })
	     .style("stroke-opacity", 0.2);
	};

    var publicObjs = {
		plot_airport_routes: routes_from_airport_,
		update_airline: update_current_airline_id_,
		update_distance: update_max_dist_
    };

    return publicObjs;
};

flight_viz_lib.routemapPlot = function() {

  var g = flight_viz_lib.svg.append("g");

  var data_ = function(rd, pd) {
    var that = this;
    if (!arguments.length) return that;
    flight_viz_lib.routesData = rd;
    flight_viz_lib.airportData = pd;

    function addLocations(airports, routes) {
        var l = airports.length,
            m = routes.length,
		    lookupIndex = {},
            output = [];
        for (var i = 0; i < l; i++) { // loop through airports
            var row = airports[i];
            lookupIndex[row.airport_ID] = row; // create an index for lookup table
        }
        for (var j = 0; j < m; j++) { // loop through routes
            var y = routes[j];
			if (isNaN(y.src_port_id)|| isNaN(y.dest_port_id) || !(y.src_port_id in lookupIndex) ||  !(y.dest_port_id in lookupIndex) ) { continue; }
            var src = lookupIndex[y.src_port_id];
			var dest = lookupIndex[y.dest_port_id];

      function distance(lat1, lon1, lat2, lon2, unit) {
        	if ((lat1 == lat2) && (lon1 == lon2)) {
        		return 0;
        	}
        	else {
        		var radlat1 = Math.PI * lat1/180;
        		var radlat2 = Math.PI * lat2/180;
        		var theta = lon1-lon2;
        		var radtheta = Math.PI * theta/180;
        		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        		if (dist > 1) {
        			dist = 1;
        		}
        		dist = Math.acos(dist);
        		dist = dist * 180/Math.PI;
        		dist = dist * 60 * 1.1515;
        		if (unit=="K") { dist = dist * 1.609344 }
        		if (unit=="N") { dist = dist * 0.8684 }
        		return dist;
        	}
        }

			var item = { airline_code: y.airline_code,
				airline_ID: y.airline_ID,
				src_port_code: y.src_port_code,
				src_port_id: y.src_port_id,
				src_lat: src.lat,
				src_long: src.long,
				dest_port_code: y.dest_port_code,
				dest_port_id: y.dest_port_id,
				dest_lat: dest.lat,
				dest_long: dest.long,
        trip_dist: distance(src.lat, src.long, dest.lat, dest.long, "N"),
				code_share: y.code_share,
				stops: y.stops,
				equipment: y.equipment};
            output.push(item);
        }
		console.log("output");
        return output;
    };
	flight_viz_lib.routesWithLocations = addLocations(pd, rd);
    return that;
  };

  var worldmap_ = function() {
    d3.json("./Data/worldmap.json").then(function(topology) {
        g.selectAll("path")
        .data(topojson.feature(topology, topology.objects.countries).features)
        .enter()
        .append("path")
        .attr("d", flight_viz_lib.path);
        //mouseover to change path opacity (in progress: display information)
		/*
        .on('mouseover', function(d, i) {
            var currentState = this;
            d3.select(this).style('fill-opacity', 1)})
        .on('mouseout', function(d, i) {
            d3.selectAll('path')
              .style({'fill-opacity':.1})
            });


        // add circles to origins
        g.selectAll("circle")
    		.data([item.src_lat,item.src_long]).enter()
    		.append("circle")
    		.attr("cx", function (d) { console.log(projection(d)); return projection(d)[0]; })
    		.attr("cy", function (d) { return projection(d)[1]; })
    		.attr("r", "5px")
    		.attr("fill", "red");

        // add circles to destinations
        g.selectAll("circle")
    		.data([item.dest_lat,item.dest_long]).enter()
    		.append("circle")
    		.attr("cx", function (d) { console.log(projection(d)); return projection(d)[0]; })
    		.attr("cy", function (d) { return projection(d)[1]; })
    		.attr("r", "5px")
    		.attr("fill", "red");*/
   });
  };

  var routemap_for_id_ = function (airlineID) {
      var links = flight_viz_lib.svg.append("g").attr("id", "flights")
      .selectAll("path.flight")
      .data(flight_viz_lib.routesWithLocations)
      .enter()
      .append("path")
 	 .filter(function(d) { return d.airline_ID === airlineID })
      .attr("d", function(d) {
 		 return flight_viz_lib.path ({type:"LineString", coordinates: [ [d.src_long, d.src_lat], [d.dest_long, d.dest_lat] ]});
 	  })
      .style("fill", "none")
      .style("stroke-width", 0.6)
 	 .style("stroke", function(d) {
 		 if (d.code_share === "Y") {
              rt_col = "#377eb8";
 		 }
 		 else {
              rt_col = "#e41a1c";
 		 }
 	     return rt_col;
 	  })
      .style("stroke-opacity", 0.2);
  };

  var routemap_ = function() {

    d3.selectAll('button').style('background-color', '#f7f7f7');
    d3.select(this).style('background-color', '#ddd');
    d3.selectAll("#flights").remove();

    var airline_ID = parseInt(this.dataset.airlineid);
	distmapcb.update_airline(airline_ID);
    routemap_for_id_(airline_ID);
   };

  var routemap_for_searched_ = function (id) {
	  d3.selectAll('button').style('background-color', '#f7f7f7');
	  d3.selectAll("#flights").remove();
	  routemap_for_id_ (id);
  };

  var clear_routes_ = function () {
	  d3.selectAll('button').style('background-color', '#f7f7f7');
	  d3.select(this).style('background-color', '#ddd');
      d3.selectAll("#flights").remove();
  };

  var distmapcb = function() {};
  var distmapcb_ = function(_) {
      var that = this;
      if (!arguments.length) return distmapcb;
      distmapcb = _;
      return that;
  };

  var publicObjs = {
    data: data_,
    plotworld: worldmap_,
    clearmap: clear_routes_,
	searched: routemap_for_searched_,
    plotroutes: routemap_,
	distmap: distmapcb_
  };

  return publicObjs;
};

// route map viz
var routes = flight_viz_lib.routemapPlot();
var distmap = flight_viz_lib.distmapPlot();
routes.distmap(distmap);

Promise.all([
    d3.text("./Data/routes.csv"),
    d3.text("./Data/airlines.csv"),
    d3.text("./Data/airports.csv"),
    d3.text("./Data/planes.csv")
]).then(function(files) {
    //get all data
    var routesData = d3.csvParseRows(files[0], function(d, i) {
        return {
        airline_code: d[0],
        airline_ID: +d[1],
        src_port_code: d[2],
        src_port_id: +d[3],
        dest_port_code: d[4],
        dest_port_id: +d[5],
        code_share: d[6],
        stops: +d[7],
        equipment: d[8]};
    });

    var airlineData = d3.csvParseRows(files[1], function(d, i) {
        return {
        airline_ID: +d[0],
        airline_name: d[1],
        alias: d[2],
        iata: d[3],
        airline_code: d[4],
        call_sign: d[5],
        country: d[6],
        active: d[7]};
    });

    var airportData = d3.csvParseRows(files[2], function(d, i) {
        return {
        airport_ID: +d[0],
        airport_name: d[1],
        city_name: d[2],
        country_name: d[3],
        iata_code: d[4],
        icao_code: d[5],
        lat: +d[6],
        long: +d[7],
        altitude: +d[8],
        tz_offset: +d[9],
        DST: d[10],
        tz_name: d[11],
        airport_type: d[12],
        source_data: d[13]};
    });

    var planesData = d3.csvParseRows(files[3], function(d, i) {
        return {
        aircraft_name: d[0],
        iata_name: d[1],
        icao_name: d[2]};
    });
    // route map plot
    routes.data(routesData, airportData);
    routes.plotworld();

	// Button listener
    d3.selectAll('button.airline-select').on('mousedown', routes.plotroutes);
    d3.select('#clear').on('mousedown', routes.clearmap);

    //input for distance filtering
    d3.select("#nValue").on("input", function() {
      distmap.update_distance(+this.value);
      distmap.plot_airport_routes();
    });

    //autofill for airlines
    $.getJSON('./Data/topairlines.json', function(data) {
      $( "#airlineName" ).autocomplete({
		  source: data,
      select: function(event, ui) {
			  console.log(ui.item.id);
			  distmap.update_airline(parseInt(ui.item.id));
			  routes.searched(parseInt(ui.item.id));
              $(this).val("");
              return false;
          }
      });

      $.ui.autocomplete.filter = function (array, term) {
          var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(term), "i");
          return $.grep(array, function (value) {
              return matcher.test(value.label || value.value || value);
          });
      };

    });

}).catch(function(err) {
    // handle error here
})
