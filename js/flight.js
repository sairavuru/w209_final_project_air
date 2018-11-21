var flight_viz_lib = flight_viz_lib || {};
// Common variables across all tasks
flight_viz_lib = {
	routesData : [],
	airportData : [],
	airlineData : [],
	finalMergedRoutes:[],
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

flight_viz_lib.data = function(rd, pd, ad) {
	flight_viz_lib.routesData = rd;
	flight_viz_lib.airportData = pd;
	flight_viz_lib.airlineData = ad;

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
			if (isNaN(y.src_port_id) || isNaN(y.dest_port_id) || !(y.src_port_id in lookupIndex) || !(y.dest_port_id in lookupIndex)) {
				continue;
			}
			var src = lookupIndex[y.src_port_id];
			var dest = lookupIndex[y.dest_port_id];

			function distance(lat1, lon1, lat2, lon2, unit) {
				if ((lat1 == lat2) && (lon1 == lon2)) {
					return 0;
				} else {
					var radlat1 = Math.PI * lat1 / 180;
					var radlat2 = Math.PI * lat2 / 180;
					var theta = lon1 - lon2;
					var radtheta = Math.PI * theta / 180;
					var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
					if (dist > 1) {
						dist = 1;
					}
					dist = Math.acos(dist);
					dist = dist * 180 / Math.PI;
					dist = dist * 60 * 1.1515;
					if (unit == "K") {
						dist = dist * 1.609344
					}
					if (unit == "N") {
						dist = dist * 0.8684
					}
					return dist;
				}
			}

			function equipment_classification(equip) {
				var airplane_type = "";
				if (equip == null) {
					airplane_type = "None";
					return airplane_type;
				}
				if (equip.substring(0, 2) === "73" || equip.substring(0, 2) === "7M") {
					airplane_type = "Boeing single aisle";
				} else if (equip.substring(0, 2) === "31" || equip.substring(0, 2) === "32") {
					airplane_type = "Airbus single aisle";
				} else if (equip.substring(0, 2) === "74" || equip.substring(0, 2) === "75" || equip.substring(0, 2) === "76" || equip.substring(0, 2) === "77" || equip.substring(0, 2) === "78") {
					airplane_type = "Boeing twin aisle";
				} else if (equip.substring(0, 2) === "33" || equip.substring(0, 2) === "34" || equip.substring(0, 2) === "35" || equip.substring(0, 2) === "38") {
					airplane_type = "Airbus twin aisle";
				} else if (equip.substring(0, 2) === "AT") {
					airplane_type = "Aerospatiale Regional Jet";
				} else if (equip.substring(0, 1) === "E") {
					airplane_type = "Embraer Regional Jet";
				} else if (equip.substring(0, 2) === "CR") {
					airplane_type = "Canadair Regional Jet";
				} else if (equip.substring(0, 2) === "DH") {
					airplane_type = "De Havilland Canada Regional Jet";
				} else if (equip.substring(0, 2) === "M1" || equip.substring(0, 2) === "M8" || equip.substring(0, 2) === "M9" || equip.substring(0, 2) === "D1" || equip.substring(0, 2) === "D3" || equip.substring(0, 2) === "D6" || equip.substring(0, 2) === "D9") {
					airplane_type = "McDonnell Douglas (merged with Boeing)";
				} else {
					airplane_type = "Other";
				}
				return airplane_type;
			}

			var item = {
				airline_code: y.airline_code,
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
				equipment: y.equipment,
				airplane_type: equipment_classification(y.equipment)
			};
			output.push(item);
		} // end of loop routes
		return output;
	};

	flight_viz_lib.finalMergedRoutes = addLocations(pd, rd);
};

flight_viz_lib.filterControl = function(){
	const no_airline_selected = -1;
	const no_src_port_selected = "ZZZ"

	var airline_id_filter = no_airline_selected;
	var origin_airport_filter = no_src_port_selected;
	var max_dist_filter = 10000;

    var routemapcb = function() {};
    var routemapcb_ = function(_) {
        var that = this;
        if (!arguments.length) return routemapcb;
        routemapcb = _;
        return that;
    };

    var barchartcb = function() {};
    var barchartcb_ = function(_) {
        var that = this;
        if (!arguments.length) return barchartcb;
        barchartcb = _;
        return that;
    };

    var distmapcb = function() {};
    var distmapcb_ = function(_) {
        var that = this;
        if (!arguments.length) return distmapcb;
        distmapcb = _;
        return that;
    };

	var update_views_ = function() {
		d3.selectAll("#flights").remove();

		if ($('input:radio[name=routetype]:checked').val() === "Airline Routes") {
			if (airline_id_filter === no_airline_selected) {} else {
				if (origin_airport_filter === no_src_port_selected) { // no src port
					routemapcb.plotroutes(function(d) {return d.airline_ID === airline_id_filter && d.trip_dist <= max_dist_filter});
					barchartcb.makeChart(function(d) {return d.airline_ID === airline_id_filter && d.trip_dist <= max_dist_filter});
				} else { // has src port filter
					routemapcb.plotroutes(function(d) {return d.airline_ID === airline_id_filter && d.src_port_code === origin_airport_filter && d.trip_dist <= max_dist_filter});
					barchartcb.makeChart(function(d) {return d.airline_ID === airline_id_filter && d.src_port_code === origin_airport_filter && d.trip_dist <= max_dist_filter});
				}
			}
		} else { // airport routes mode

		}
	}

	var update_max_dist_ = function (d) {
		max_dist_filter = d;
		update_views_();
		showconf_();
	}

	var src_port_search_ = function (src) {
		origin_airport_filter = src;
		update_views_();
		showconf_();
	}

    var airline_button_ = function() {

      d3.selectAll('button').style('background-color', '#f7f7f7');
      d3.select(this).style('background-color', '#ddd');

      airline_id_filter = parseInt(this.dataset.airlineid);
      update_views_();
	  showconf_();
    };

    var airline_search_box_ = function(d){
        d3.selectAll('button').style('background-color', '#f7f7f7');
		airline_id_filter = d;
		update_views_();
		showconf_();
    };

	var resetfilters_ = function(){
		airline_id_filter = no_airline_selected;
		origin_airport_filter = no_src_port_selected;
		max_dist_filter = 10000;
		$("#range-slider").slider('value', max_dist_filter);
		$("#range").val(max_dist_filter + " nautical miles.");
		showconf_();
	}

	var showconf_ = function(){
		$("#ctl-config").empty();
		conf = "Mode: " + $('input:radio[name=routetype]:checked').val() + "</br>";
		if (airline_id_filter === no_airline_selected) {
			conf = conf + "Airline: Not selected </br>";
		}
		else {
			const airline = flight_viz_lib.airlineData
			                .find( a => a.airline_ID === airline_id_filter);
			conf = conf + "Airline ID: " + airline.airline_name + "</br>";
		}
		if (origin_airport_filter === no_src_port_selected){
			conf = conf + "Originating airport: Not selected </br>";
		}
		else {
			conf = conf + "Originating airport: "+ origin_airport_filter + "</br>";
		}
		conf = conf + "Router distance within: " + max_dist_filter + " nautical miles</br>";
		$("#ctl-config").append( "<p>" + conf + "</p>" );
	}

    var publicObjs = {
		set_airline: airline_button_,
		airline_search_box: airline_search_box_,
		set_range: update_max_dist_,
		set_src_port: src_port_search_,
		barchart: barchartcb_,
		distmap: distmapcb_,
		routemap: routemapcb_,
		resetfilters: resetfilters_,
		showconf: showconf_
    };

    return publicObjs;
};

//end of common variables

// Start Task 3
flight_viz_lib.distmapPlot = function(){

	var routes_from_airport_ = function() {
			//var airline_distance = parseInt(this.dataset.)
			//console.log(current_origin_id)
		d3.selectAll("#flights").remove();
// the following code is temporary for proof-of concept
	     var links = flight_viz_lib.svg.append("g").attr("id", "flights")
	     .selectAll("path.flight")
	     .data(flight_viz_lib.finalMergedRoutes)
	     .enter()
	     .append("path")
		   .filter(function(d) { return d.airline_ID === current_airline_id })
			 .filter(function(d) { return d.src_port_code === current_origin_id })
			 //.filter(function(d) { return d.src_port_code === "JFK" })
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

    var filterctlcb = function() {};
    var filterctlcb_ = function(_) {
        var that = this;
        if (!arguments.length) return filterctlcb;
        filterctlcb = _;
        return that;
    };

    var publicObjs = {
		plot_airport_routes: routes_from_airport_,
		filterctl: filterctlcb_
    };

    return publicObjs;
};
// End of Task 3

// Start Task 2
flight_viz_lib.planesData = function() {
  //fill this in

  //filter the correct data by airlines
  //join the data from the two different csv files
  //equipment ID and correct name from planes data
  //group by equipment ID to count the airplanes
  var margin = {
	top: 10,
	bottom: 60,
	left: 75,
	right: 5
  };
  const width = 1200;
  const height = 600;
  var xScale = d3.scaleLinear().range([margin.left, width - margin.left - margin.right]);
  var yScale = d3.scaleBand().range([height - margin.bottom - margin.top, margin.top]);
  var colorScale = d3.scaleOrdinal(d3.schemeSet3);

  var svg = d3.select("#planeChart")
	.append("svg")
    .attr("id", "barchart-svg")
	.attr('width', width)
	.attr('height', height);

  var barChart = function(tally) {
	//tally has plane counts for 10 predefined categories by airline or airport
	$("#barchart-svg").empty();

    var orderedPlaneCounts = Object.keys(tally)
	    .map(function (equip) { return [equip, tally[equip]];})
		.sort(function (a, b) { return a[1] - b[1];});
    xScale.domain([0, d3.max(d3.values(tally))*1.1]);
    yScale.domain(orderedPlaneCounts.map((s) => s[0]));

	var xAxis = d3.axisBottom().scale(xScale).ticks(5);
	var yAxis = d3.axisLeft().scale(yScale);

    svg.append("g")
	   .attr("class", "axis")
	   .attr("transform", "translate(0," + (height - margin.bottom) + ")")
	   .call(xAxis);

    svg.append("text")
       .attr("transform", "translate(" + (width / 2) + " ," +
	        (height + margin.top - margin.bottom/2) + ")")
	   .style("text-anchor", "middle")
	   .text("Airplane Counts");

    var yaxisElements = svg.append("g")
	                       .attr("class", "axis")
	                       .attr("transform", "translate(" + margin.left + ", 0)")
	                       .call(yAxis);
    yaxisElements.selectAll("text").remove();

    svg.append("text")
       .attr("transform",
             "translate(" + (margin.left / 3) + " ," + (height / 2) + ")" + "rotate(270)")
	   .attr("dy", "1em")
	   .style("text-anchor", "middle")
	   .text("Airplane types");

	svg.selectAll()
	.data(orderedPlaneCounts)
	.enter()
	.append('rect')
	.attr('x', margin.left)
	.attr('y', (s) => yScale(s[0]))
	.attr('width', (s) => xScale(s[1]))
	.attr('height', yScale.bandwidth())
    .attr("fill", function(d, i) {return colorScale(i); });
};


  var makeChart_ = function(func) {
	var tally = planesCount(func);
	barChart(tally);
  };

  //take match function as an argument (match can be airline or source airport)
  //count airplanes in predefine categories upon match
  function planesCount(func) {
  	let plane_counts = {
  		boeing_single_aisle: 0,
  		boeing_twin_aisle: 0,
  		airbus_single_aisle: 0,
  		airbus_twin_aisle: 0,
  		aerospatiale_regional_jet: 0,
  		embraer_regional_jet: 0,
  		canadair_regional_jet: 0,
  		de_havilland_regional_jet: 0,
  		mcDonnell_douglas: 0,
  		other: 0,
  		notspecified: 0
  	};
  	//like a dictionary in Python with key value pairs
  	flight_viz_lib.finalMergedRoutes.forEach(
  		function(route) {
  			if (func(route)) {
  				switch (route.airplane_type) {
  					case 'Boeing single aisle':
  						plane_counts.boeing_single_aisle ++;
  						break;
  					case 'Airbus single aisle':
  						plane_counts.airbus_single_aisle ++;
  						break;
  					case 'Boeing twin aisle':
  						plane_counts.boeing_twin_aisle ++;
  						break;
  					case 'Airbus twin aisle':
  						plane_counts.airbus_twin_aisle ++;
  						break;
  					case 'Aerospatiale Regional Jet':
  						plane_counts.aerospatiale_regional_jet ++;
  						break;
  					case 'Embraer Regional Jet':
  						plane_counts.embraer_regional_jet ++;
  						break;
  					case 'Canadair Regional Jet':
  						plane_counts.canadair_regional_jet ++;
  						break;
  					case 'De Havilland Canada Regional Jet':
  						plane_counts.de_havilland_regional_jet ++;
  						break;
  					case 'McDonnell Douglas (merged with Boeing)':
  						plane_counts.mcDonnell_douglas ++;
  						break;
  					case 'Other':
  						plane_counts.other ++;
  						break;
  					case 'None':
  						plane_counts.notspecified ++;
  						break;
  					default:
  						console.log(route.airplane_type);
  				}

  			}
  		}
  	);

  	return plane_counts;
  };

  var filterctlcb = function() {};
  var filterctlcb_ = function(_) {
  	var that = this;
  	if (!arguments.length) return filterctlcb;
  	filterctlcb = _;
  	return that;
  };

  //what does this part do?
  var publicObjs = {
 	makeChart: makeChart_,
	filterctl: filterctlcb_
  };

  return publicObjs;
  }

// End of Task 2

// Start of Task 1
flight_viz_lib.routemapPlot = function() {

  var g = flight_viz_lib.svg.append("g");

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

  var routemap_plot_ = function (func) {
      var links = flight_viz_lib.svg.append("g").attr("id", "flights")
      .selectAll("path.flight")
      .data(flight_viz_lib.finalMergedRoutes)
      .enter()
      .append("path")
 	 .filter(func)
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

  var clear_routes_ = function () {
	  d3.selectAll('button').style('background-color', '#f7f7f7');
	  d3.select(this).style('background-color', '#ddd');
      d3.selectAll("#flights").remove();
	  $("#barchart-svg").empty();
	  filterctlcb.resetfilters();
  };

  var filterctlcb = function() {};
  var filterctlcb_ = function(_) {
      var that = this;
      if (!arguments.length) return filterctlcb;
      filterctlcb = _;
      return that;
  };

  var publicObjs = {
    plotworld: worldmap_,
    clearmap: clear_routes_,
    plotroutes: routemap_plot_,
	filterctl: filterctlcb_
  };

  return publicObjs;
};

// link all call back functions
var routes = flight_viz_lib.routemapPlot();
var distmap = flight_viz_lib.distmapPlot();
var barchart = flight_viz_lib.planesData();
var fc = flight_viz_lib.filterControl();
fc.routemap(routes).distmap(distmap).barchart(barchart);
routes.filterctl(fc);
barchart.filterctl(fc);
distmap.filterctl(fc);

// route map plot
routes.plotworld();
// initialize the default selction of route plot
$('input:radio[name=routetype]:nth(0)').attr('checked',true);
fc.showconf();

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
			equipment: d[8]
		};
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
			active: d[7]
		};
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
			source_data: d[13]
		};
	});

	var planesData = d3.csvParseRows(files[3], function(d, i) {
		return {
			aircraft_name: d[0],
			iata_name: d[1],
			icao_name: d[2]
		};
	});

	// Button listener
	d3.selectAll('button.airline-select').on('mousedown', fc.set_airline);
	d3.select('#clear').on('mousedown', routes.clearmap);

	//input for distance filtering
    $( function() {
      $("#range-slider").slider({
        value: 10000,
        min: 0,
        max: 10400,
		step: 200,
        slide: function( event, ui ) {
			fc.set_range(parseInt(ui.value));
			$("#range").val(ui.value + " nautical miles.");
        }
      });
	  $( "#range" ).val($( "#range-slider" ).slider( "value" ) + " nautical miles." );
    } );

	//autofill for airlines
	$.getJSON('./Data/topairlines.json', function(data) {
		$("#airlineName").autocomplete({
			source: data,
			select: function(event, ui) {
				console.log(ui.item.id);
				fc.airline_search_box(parseInt(ui.item.id));
				$(this).val("");
				return false;
			}
		});

		$.ui.autocomplete.filter = function(array, term) {
			var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(term), "i");
			return $.grep(array, function(value) {
				return matcher.test(value.label || value.value || value);
			});
		};

	});

	//autofill for origin
	$.getJSON('./Data/toproutes.json', function(data) {
		$("#originName").autocomplete({
			source: data,
			select: function(event, ui) {
				//console.log(ui.item.label);
				fc.set_src_port(ui.item.label);
				$(this).val("");
				return false;
			}
		});

		$.ui.autocomplete.filter = function(array, term) {
			var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(term), "i");
			return $.grep(array, function(value) {
				return matcher.test(value.label || value.value || value);
			});
		};

	});

	// merge and prepare data
	flight_viz_lib.data(routesData, airportData, airlineData);

}).catch(function(err) {
	// handle error here
})

