var flight_viz_lib = flight_viz_lib || {};

flight_viz_lib.planesData = function() {
  //fill this in

  //filter the correct data by airlines
  //join the data from the two different csv files
  //equipment ID and correct name from planes data
  //group by equipment ID to count the airplanes

  //create the bar chart based on the counts
  //clear bar chart
  var routesData = [];
  var planesData = [];

  var barChart = function(tally, pd) {
    //extract top 10 from the object
    //convert to array and sort by values
    //make an array only of the top 10 values
    var orderedPlaneCounts = Object.keys(tally).map(
      function (equip) {
        return [equip, tally[equip]];
      }
    ).sort(function (a, b) { return b[1] - a[1];}).slice(0, 10);

    //this part is attempting to extract the planes' names
    //using the equipment code
    /*
    var planeNames = orderedPlaneCounts.map(
      function (pair) {
        var planeObj = planesData.filter(
          function (plane) {
            return plane.iata_name === pair[0];
          }
        );
        console.log(planeObj);
        return pair.concat([planeObj[0].aircraft_name]);
      }
    );
    console.log(planeNames);
    */


    const margin = 60;
    const width = 1000 - 2 * margin;
    const height = 600 - 2 * margin;

    const svg = d3.select('svg');

    const chart = svg.append('g')
        .attr('transform', `translate(${margin}, ${margin})`);

    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0, orderedPlaneCounts[0][1] * 1.1]);

    chart.append('g')
        .call(d3.axisLeft(yScale));

    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(orderedPlaneCounts.map((s) => s[0]))
        .padding(0.2)

    chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));


    chart.selectAll()
        .data(orderedPlaneCounts)
        .enter()
        .append('rect')
        .attr('x', (s) => xScale(s[0]))
        .attr('y', (s) => yScale(s[1]))
        .attr('height', (s) => height - yScale(s[1]))
        .attr('width', xScale.bandwidth());

    chart.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom()
            .scale(xScale)
            .tickSize(-height, 0, 0)
            .tickFormat(''));


    chart.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft()
            .scale(yScale)
            .tickSize(-width, 0, 0)
            .tickFormat(''));

    chart.selectAll()
        .data(orderedPlaneCounts)
        .enter()
        .append('rect')
        .attr('x', (s) => xScale(s[0]))
        .attr('y', (s) => yScale(s[1]))
        .attr('height', (s) => height - yScale(s[1]))
        .attr('width', xScale.bandwidth());

    svg.append('text')
        .attr('x', -(height / 2) - margin)
        .attr('y', margin / 2.4)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text('Number of Routes')

    svg.append('text')
        .attr('x', width / 2 + margin)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .text('Type of Airplane')
  };


  var makeChart_ = function() {
    var airline = this.dataset.airline_code;
    console.log(airline);
    var tally = planesCount(airline);
    //first sort the planesCount object (keys and values)
    //chooose the top 10
    //
    barChart(tally);

  };

  //take the airline as an arguments
  //get the airline from the button click
  function planesCount(airline_code){
    let plane_counts = {};
    //like a dictionary in Python with key value pairs
    routesData.forEach(
      function (route) {
        //get the equipment id from routes, add this as key
        //to plane_counts if doesn't already exist
        //or update counts
        if (airline_code === route.airline_code){
          console.log(route.airline_code)
          route.equipment.split(" ").forEach(
            function (equip) {
              if (plane_counts[equip]  === undefined){
                plane_counts[equip] = 1;
              }
              else {
                plane_counts[equip]++;
              }
            }
          );
        }
      }
    );
    return plane_counts;
  };
  var data_ = function(rd, pd) {
    //csv files have already been parsed into arrays
    //arrays of objects with attributes
    routesData = rd;
    planesData = pd;
    console.log(planesData);
    console.log(routesData);
    //we are now entering this function
    console.log("data function");
  };

  //what does this part do?
  var publicObjs = {
    data: data_,
    makeChart: makeChart_
  };

  return publicObjs;
}

flight_viz_lib.routemapPlot = function() {

var width = 1000,
    height = 600;

var svg = d3.select("#routemap")
  .append("svg")
    .attr('width', width)
    .attr('height', height);

  //var projection = d3.geoEquirectangular();
  //var path = d3.geoPath().projection(projection);

var projection = d3.geoRobinson()
    .scale(180)
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection)
    .pointRadius(1);

  var g = svg.append("g");

  var routesData = [];
  var airportData = [];
  var routesWithLocations = [];

  var data_ = function(rd, pd) {
    var that = this;
    if (!arguments.length) return that;
    routesData = rd;
    airportData = pd;

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
				code_share: y.code_share,
				stops: y.stops,
				equipment: y.equipment};
            output.push(item);
        }
		console.log("output");
        return output;
    };
	routesWithLocations = addLocations(pd, rd);
    return that;
  };

  var worldmap_ = function() {
    d3.json("./Data/worldmap.json").then(function(topology) {
        g.selectAll("path")
        .data(topojson.feature(topology, topology.objects.countries).features)
        .enter()
        .append("path")
        .attr("d", path);
   });
  };

  var routemap_ = function() {

    d3.selectAll('button').style('background-color', '#f7f7f7');
    d3.select(this).style('background-color', '#ddd');
    d3.selectAll("#flights").remove();

    var airline_ID = parseInt(this.dataset.airlineid);

     var links = svg.append("g").attr("id", "flights")
     .selectAll("path.flight")
     .data(routesWithLocations)
     .enter()
     .append("path")
	 .filter(function(d) { return d.airline_ID === airline_ID })
     .attr("d", function(d) {
		 return path ({type:"LineString", coordinates: [ [d.src_long, d.src_lat], [d.dest_long, d.dest_lat] ]});
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
  };

  var publicObjs = {
    data: data_,
    plotworld: worldmap_,
    clearmap: clear_routes_,
    plotroutes: routemap_
  };

  return publicObjs;
};


// route map viz
var routes = flight_viz_lib.routemapPlot();

var planes = flight_viz_lib.planesData();

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

    planes.data(routesData, planesData);
    //planes.____;
	// Button listener
    //d3.selectAll('button.airline-select').on('mousedown', routes.plotroutes);
    //d3.select('#clear').on('mousedown', routes.clearmap);
    d3.selectAll('button.airline-select').on('mousedown', planes.makeChart);
    d3.select('#clear').on('mousedown', planes.clearChart);

}).catch(function(err) {
    // handle error here
})
