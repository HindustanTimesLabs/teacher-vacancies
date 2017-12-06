window.onbeforeunload = function () {
  window.scrollTo(0, 0);
}

var colors = {
	red: "#e74c3c",
	green: "#45b29d",
	darkblue: "#334d5c",
	blue: "#48a2d7",
	lightgrey: "#eee",
	darkgrey: "#888",
	lightred: "#ef8b80"
}

var breakpoint = 768;
var smallbreakpoint = 480;
var ww = $(window).width();

makeGrid();
makeLine();
$(window).smartresize(function(){
	if ($(window).width() != ww){
    makeLine();
    ww = $(window).width()
  } else {
    // do nothing
  }
});

function makeLine(){
	var ww = $(window).width();

	var chartpadding = 15;

	$("#line .chart").empty();

	var annotations_data = [{
		date: "2011-10-07",
		value: 54873,
		label: "11,651 new teacher positions created, for a total of 54,873 positions."
	},{
		date: "2016-01-18",
		value: 64093,
		label: "9,027 new teacher positions created, for a total of 64,093 positions."
	}];

	var margin = {top: 60, left: 40 + (ww <= 600 ? chartpadding : 0), bottom: 20, right: 10 + (ww <= 600 ? chartpadding : 0)},
		width = $("#line .chart").width() - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom,
		svg = d3.select("#line .chart").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
			.append("g")
				.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

	var x = d3.scaleTime()
		.range([0, width])
		.domain([parsetime("2010-01-01"), parsetime("2017-07-31")])

	var y = d3.scaleLinear()
		.range([height, 0])
		.domain([0, 70000]);

	var x_axis = d3.axisBottom(x);

	var y_axis = d3.axisLeft(y)
		// .tickFormat(function(d, i, ticks){ return i == ticks.length - 1 ? (d / 1000) + " thousand" : d / 1000; });
		// .tickFormat(function(d, i, ticks){ return i == ticks.length - 1 ? (d / 1000) + "k" : d / 1000; });
		.ticks(5)
		.tickFormat(function(d, i, ticks){ return jz.str.numberLakhs(d); });

	function parsetime(x){
		var date_split = x.split("-");
		return new Date(date_split[0], date_split[1], date_split[2]);
	}

	var line_gen = d3.line()
		.x(function(d){ return x(parsetime(d.date)); })
		.y(function(d){ return y(d.value); })
		.defined(function(d){ return d.value !== 0; });


	d3.json("data/line_data.json", function(error, data){

		// update scales
		var first_data = data[0].data;
		var x_domain = [first_data[0].date, first_data[first_data.length - 1].date]
		x.domain(x_domain.map(function(d){ return parsetime(d); }));

		// var y_domain = d3.extent(jz.arr.flatten(data.map(function(d){ return d.data; })), function(d){ return d.value; });
		// y.domain(y_domain);

		// axes
		svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0, " + height + ")")
				.call(x_axis);

		svg.append("g")
				.attr("class", "y axis")
				.call(y_axis);

		var line_g = svg.selectAll("#line .line-g")
				.data(data, function(d){ return d.id; })
			.enter().append("g")
				.attr("class", "line-g");

		var dotted_line = line_g.append("path")
			.datum(function(d){ return d.data.filter(line_gen.defined()); })
			.attr("class", "dotted-line")
			.attr("d", function(d){ return d[0].name == "fulltime" ? line_gen(d) : null; })
			.style("stroke", lineStroke);

		var line = line_g.append("path")
			.datum(function(d){ return d.data; })
			.attr("class", "line")
			.attr("d", line_gen.curve(d3.curveStepAfter))
			.style("stroke", lineStroke);

		var annotations = annotations_data.map(function(d, i){
			function fullDate(x){
				var spl = x.split("-");
				function makeMonth(y){
					var mos = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
					return mos[y - 1];
				}
				return makeMonth(spl[1]) + " " + (+spl[2]) + ", " + spl[0];
			}

			return {
				note: {
					label: d.label,
					title: fullDate(d.date),
					wrap: i == 0 ? 150 : 150,
					align: i == 0 ? "middle" : "middle"
				},
				className: i == 0 ? "middle" : "start",
				x: x(parsetime(d.date)),
				y: y(d.value),
				dy: i == 0 ? -10 : -10,
				dx: i == 0 ? 0 : 0,

			}
		});

		var annotations_generator = d3.annotation()
			  .type(d3.annotationCallout)
				.annotations(annotations);

		svg.append("g")
		  .attr("class", "annotation-group")
		  .call(annotations_generator);

		var dot_data = jz.arr.flatten(data.map(function(d){ return d.data; })).filter(function(d){ return d.value !== 0; })

		var dots = svg.selectAll("#line .dot")
				.data(dot_data)
			.enter().append("circle")
				.attr("class", "dot")
				.attr("cx", function(d){ return x(parsetime(d.date)); })
				.attr("cy", function(d){ return y(d.value); })
				.attr("r", ww <= breakpoint ? 2 : 2)
				.style("stroke", dotStroke)
				// .style("fill", dotFill);
				.style("fill", function(d){ return d.name == "fulltime" ? colors.blue: colors.red});

		function lineStroke(d){
			return d[0].name == "fulltime" ? colors.blue : colors.red;
		}
		function dotStroke(d){
			return d.name == "fulltime" ? colors.blue : colors.red;
		}
		function dotFill(d){
			// annotation lookup
			var f = annotations_data.filter(function(a){ return a.date == d.date; });
			return f == 0 ? "#fff" :
				colors.red;
		}

		// y axis label
		svg.append("text")
			.attr("class", "axis-label")
			.attr("x", -margin.left + (ww <= 600 ? chartpadding : 0))
			.attr("y", -10)
			.text("↑ Teachers");

		// y axis label
		svg.append("text")
			.attr("class", "axis-label")
			.attr("x", 8)
			.attr("y", height - 4)
			.text("Time →");

		// last text labels
		var dot_label_data = dot_data.filter(function(d){ 
			return x_domain.indexOf(d.date) != -1 
		});
		var dot_label = svg.selectAll(".dot-label")
				.data(dot_label_data)
			.enter().append("text")
				.attr("class", "dot-label")
				.attr("x", function(d){ return x(parsetime(d.date)); })
				.attr("y", function(d){ return y(d.value); })
				.attr("dy", function(d, i){ 
					return i == 0 ? -5 :
						i == 1 ? -5 :
						i == 2 ? 12 :
						12
				})
				.text(function(d){ return jz.str.numberCommas(d.value); })
				.style("text-anchor", function(d){ return d.date == x_domain[1] ? "end": "start"; })
				.style("fill", dotStroke)
		
		var line_label_data = [{
			value: 51500,
			text: "Sanctioned positions",
			name: "sanctioned"
		}, {
			value: 36500,
			text: "Full-time teachers",
			name: "fulltime"
		}];

		var line_label = svg.selectAll(".line-label")
				.data(line_label_data)
			.enter().append("text")
				.attr("class", "line-label")
				.attr("x", width / 2)
				.attr("y", function(d){ return y(d.value); })
				.style("text-anchor", "middle")
				.style("fill", dotStroke)
				.text(function(d){ return d.text; });



	});

}

function makeGrid(){

	var total_posts = 66736,
		open = 25337 + (66736 - 64263),
		fulltime = total_posts - open,
		guest = 15000,
		vacant = open - guest;

	var divisor = 100;

	function makeData_1(){
		var data = [];
		dataLoop(data, total_posts, colors.lightgrey);
		dataId(data);
		return data;
	}

	function makeData_2(){
		var data = [];

		dataLoop(data, open, colors.lightgrey);
		dataLoop(data, fulltime, colors.blue);
		dataId(data);

		return data;
	}

	function makeData_3(){
		var data = [];

		dataLoop(data, vacant, colors.lightgrey);
		dataLoop(data, guest, colors.lightred);
		dataLoop(data, fulltime, colors.blue);
		dataId(data);

		return data;
	}

	function makeData_4(){
		var data = [];

		dataLoop(data, vacant, colors.red);
		dataLoop(data, guest, colors.lightred);
		dataLoop(data, fulltime, colors.blue);
		dataId(data);

		return data;
	}

	var currslide = 0;
	var data_arrays = [makeData_1(), makeData_2(), makeData_3(), makeData_4()];
	var texts = [
	"The Delhi public school system had, as of August 17, the budget to employ <b>" + jz.str.numberCommas(total_posts) + "</b> full-time teachers to educate about 12.5 lakh students. Each square represents <b>" + divisor + "</b> full-time positions.",
	"Of those positions, the system actually employs <b>" + jz.str.numberCommas(fulltime) + "</b> full-time teachers. That&rsquo;s about <b>" + Math.round(fulltime / total_posts * 100) + "%</b> of the total positions.",
	"Another <b>" + jz.str.numberCommas(guest) + "</b> of the open positions have been filled with guest teachers, who work on daily wage contracts that must be renewed every year. It&rsquo;s easier to become a guest teacher than a full-time one.",
	"The rest of the positions, all <b>" + jz.str.numberCommas(vacant) + "</b> of them, remain unfilled. That amounts to a <b>" + Math.round(vacant / total_posts * 100) + "%</b> shortfall."
	];

	//, according to a letter sent this year from the Delhi Ministry of Education to the state&rsquo;s Lt. Gov. Anil Baijal

	var highlights = [colors.lightgrey, colors.blue, colors.lightred, colors.red];
	var chart_labels = ["Teaching positions", "Full-time teachers", "Guest teachers", "Unfilled positions"];

	var slides = data_arrays.map(function(d, i){
		return {
			data: d,
			text: texts[i],
			highlight: highlights[i],
			chart_label: chart_labels[i]
		}
	});

	slides.forEach(function(slide, i){

		$("#scroll .scroll-text").append("<div class='step step-" + i + "'><p>" + slide.text + "</p></div>");

	});


	var currdata = data_arrays[currslide];


	function dataLoop(data, max, color){
		for (var i = 0; i < Math.round(max / divisor); i++){
			data.push({
				color: color
			});
		}
	}

	function dataId(data){
		data.forEach(function(d, i){
			d.id = i;
			return d;
		});
	}

	// elements

	// SETUP THE CHART
	var dim = d3.min([ww * .85, $(window).height() * .85]);
	var margin = {left: 1, right: 2, top: 2, bottom: 1};
	var width = dim - margin.left - margin.right;
	var height = dim - margin.top - margin.bottom;
	var svg = d3.select("#scroll .chart").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

	var grid = data2grid.grid(currdata);
	var rows = d3.max(grid, function(d){ return d.row; });

	var x = d3.scaleBand()
		.rangeRound([0, width])
		.domain(d3.range(1, rows + 1));
		
	var y = d3.scaleBand()
		.rangeRound([0, height])
		.domain(d3.range(1, rows + 1));

	// for some reason, the top is not where it should be
	var top_pad_error = y(grid[0].row);	
	var left_pad_error = x(grid[0].column);

	function centerChart(){
		var mar = ww <= breakpoint ? (ww - width) / 2 :
			((ww / 2) - width) / 2;
		$("#scroll .chart").css("margin-left", mar);
	}
	centerChart();
	$(window).smartresize(centerChart);

	redrawChart(slides[0].data, null, null);

	function redrawChart(data, highlight, chart_label){

		var grid_data = data2grid.grid(data);

		var cell = svg.selectAll("#scroll .cell")
			.data(grid_data, function(d){ return d.id; })

		cell.transition()
			.delay(function(d, i){ return i * 1; })
				.style("fill", function(d){ return d.color; });

		cell.enter().append("rect")
				.attr("class", "cell")
				.attr("y", function(d){ return y(d.row) - top_pad_error; })
				.attr("x", function(d){ return x(d.column) + left_pad_error; })
				.attr("width", x.bandwidth())
				.attr("height", y.bandwidth())
				.style("fill", function(d){ return d.color; });

		if (highlight && chart_label){
			
			var h_data = grid_data.filter(function(d){
				return d.color == highlight;
			});
		
			var h_top_row = d3.min(h_data, function(d){ return d.row; });
			var h_top_row_data = h_data.filter(function(d){ return d.row == h_top_row; });
			var h_top_row_left_column = d3.min(h_top_row_data, function(d){ return d.column; });
		
			var h_left_column = d3.min(h_data, function(d){ return d.column; });
			
			var h_bottom_row = d3.max(h_data, function(d){ return d.row; });
			var h_bottom_row_data = h_data.filter(function(d){ return d.row == h_bottom_row; });
			var h_bottom_row_right_column = d3.max(h_bottom_row_data, function(d){ return d.column; });
		
			var h_right_column = d3.max(h_data, function(d){ return d.column; });
		
			var stroke_width = 4 / 2;
			// console.log(h_top_row, h_left_column, h_bottom_row, h_right_column);
			var point_data = [];
		
			// top left
			if (h_top_row_left_column != h_left_column){
				point_data.push({x: x(h_left_column), y: y(h_top_row + 1)});
				point_data.push({x: x(h_top_row_left_column), y: y(h_top_row + 1)});
				point_data.push({x: x(h_top_row_left_column), y: y(h_top_row)});
			} else {
				point_data.push({x: x(h_left_column), y: y(h_top_row)});	
			}
			
			// top right
			point_data.push({x: x(h_right_column) + x.bandwidth(), y: y(h_top_row)});
		
			// bottom right
			if (h_bottom_row_right_column != h_right_column){
				point_data.push({x: x(h_right_column) + x.bandwidth(), y: y(h_bottom_row - 1) + y.bandwidth()});
				point_data.push({x: x(h_bottom_row_right_column) + x.bandwidth(), y: y(h_bottom_row - 1) + y.bandwidth()});
				point_data.push({x: x(h_bottom_row_right_column) + x.bandwidth(), y: y(h_bottom_row) + y.bandwidth()});
			} else {
				point_data.push({x: x(h_right_column) + x.bandwidth(), y: y(h_bottom_row) + y.bandwidth()});	
			}
				
			// bottom left
			point_data.push({x: x(h_left_column), y: y(h_bottom_row) + y.bandwidth()});
		
		
			point_data.forEach(function(d){
				d.id = jz.str.randomString();
				return d;
			});
		
			var lines = svg.selectAll("#scroll .line")
				.data(point_data, function(d){ return d.id; })
		
			lines.exit().remove();
		
			lines.enter().append("line")
					.attr("class", "line")
					.attr("transform", "translate(" + (left_pad_error) + ", " + (-top_pad_error) + ")")
					.attr("x1", function(d){ return d.x; })
					.attr("y1", function(d){ return d.y; })
					.attr("x2", function(d){ return d.x; })
					.attr("y2", function(d){ return d.y; })
					.style("stroke-linecap", "butt")
				.transition().duration(150).delay(function(d, i){ return i * 150; })
					.attr("x2", function(d, i){ return i == point_data.length - 1 ? point_data[0].x : point_data[i + 1].x; })
					.attr("y2", function(d, i){ return i == point_data.length - 1 ? point_data[0].y : point_data[i + 1].y; })
					.style("stroke-linecap", "square");
		
			var c_label = svg.selectAll("#scroll .chart-label")
				.data([{txt: chart_label, id: jz.str.randomString()}], function(d){ return d.id; });
		
			c_label.exit().remove();
		
			var ext_y = d3.extent(point_data, function(d){ return d.y });

			var label_y = ext_y[0] + ((ext_y[1] - ext_y[0]) / 2);
			
			c_label.enter().append("text")
					.attr("class", "chart-label")
					.attr("x", width / 2)
					.attr("y", ext_y[0] + ((ext_y[1] - ext_y[0]) / 2))
					.attr("dy", ww <= smallbreakpoint ? 0 : -10)
					.text(function(d){ return d.txt; })
					// .style("fill", chart_label == "Unfilled positions" ? "#fff" : "#000")
					.style("opacity", 1e-6)
				.transition().delay(500)
					.style("opacity", 1)
		}

	}

	// WAYPOINTS
	var nav_height = 55;
	var chart_height = height;
	var window_height = $(window).height();
	var top_listener = window_height - chart_height - ((window_height - chart_height) / 2) + (nav_height / 2);
	var step_height = chart_height - (top_pad_error * 2);
	// var bottom_listener = window_height - 50;
	var bottom_listener = ww <= smallbreakpoint ? window_height - 50 : top_listener + height - (top_pad_error * 2);

	$("#scroll .step").height(step_height * (ww <= smallbreakpoint ? 2 : 1.1));
	$("#scroll .step:last-of-type").height(height);

	// how do we decide when to start the waypoints?
	// find the bottom of the scroll div
	var waypoints_started = false;

	dowaypoints();

	// decideWaypoints();
	// $(window).scroll(decideWaypoints);

	// function decideWaypoints(){

	// 	var window_pos = $(window).scrollTop();
	// 	dowaypoints();

	// 	if (!waypoints_started){ 
	// 		var scroll_pos = $("#scroll").position();
	// 		var scroll_top = scroll_pos.top;
	// 		var scroll_left = scroll_pos.left;
	// 		var scroll_offset = $("#scroll").offset().top;
	// 		console.log(window_pos, scroll_top, scroll_offset);
		
	// 		// we're starting at the top
	// 		if ("john" == "dave"){
	// 			console.log("Above scroll");
	
	// 			dowaypoints();
	// 		} 
	
	// 		// we're within the scroll
	// 		else if ("dave" == "john") {
	// 			// move the chart down
	// 			$("#scroll .chart")
	// 					.addClass("is-fixed")
	// 					.css("top", top_listener + 1);
				
	// 			dowaypoints();
	// 		} else {


	// 		}

	// 	} else {
	// 		// do nothing, cuz the waypoints have started
	// 	}
	// }


	function dowaypoints(){
		
		waypoints_started = true;

		new Waypoint({
			element: $("#scroll .chart"),
			offset: top_listener,
			handler: function(direction){

				if (direction == "down"){
					$("#scroll .chart")
						.addClass("is-fixed")
						.css("top", top_listener);

					$("#scroll .step:first-of-type").css("margin-top", $("#scroll .chart").height() + 60);
				} else {
					$("#scroll .chart")
						.removeClass("is-fixed");

					$("#scroll .step:first-of-type").css("margin-top", 60);

				}

			}
		})

		function makeDebugLine(pos){
			d3.select("body").append("svg")
				.attr("height", 2)
				.attr("width", ww)
				.style("position", "fixed")
				.style("top", pos + "px")
			.append("line")
				.attr("x1", 0)
				.attr("y1", 1)
				.attr("x2", ww)
				.attr("y2", 1)
				.style("stroke", "red")
				.style("stroke-dasharray", "5, 5");
		}

		// makeDebugLine(top_listener);
		// makeDebugLine(bottom_listener);

		$("#scroll .step").each(function(step_index, step){

			var sel = "#scroll .step-" + step_index;
			console.log()

			// top waypoint
			new Waypoint({
			  element: $(this),
			  offset: top_listener,
			  handler: function(direction) {
			    
			    if (direction == "down"){

			    	$(sel).removeClass("is-active");

						// last slide
			  		if (step_index == slides.length - 1) {
			  			$("#scroll .chart")
				  			.removeClass("is-fixed")
				  			.addClass("is-bottom")
				  			.css("top", $(window).scrollTop() + top_listener);
			  		}


			    } else {
			    	$(sel).addClass("is-active");
			    	redrawChart(slides[step_index].data, slides[step_index].highlight, slides[step_index].chart_label);

			    	// last slide
			  		if (step_index == slides.length - 1) {
			  			$("#scroll .chart")
				  			.addClass("is-fixed")
				  			.removeClass("is-bottom")
				  			.css("top", top_listener);
			  		}

			    }
			  }
			});

			// bottom waypoint
			new Waypoint({
			  element: $(this),
			  offset: bottom_listener,
			  handler: function(direction) {
			  	if (direction == "down"){
			  		$(sel).addClass("is-active");	
			  		redrawChart(slides[step_index].data, slides[step_index].highlight, slides[step_index].chart_label);
			  	} else {
			  		$(sel).removeClass("is-active");
			  	}
			  }
			});
		});		
	}

	
}