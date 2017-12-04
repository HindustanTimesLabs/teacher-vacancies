var colors = {
	red: "#e74c3c",
	green: "#45b29d",
	darkblue: "#334d5c",
	blue: "#2880b9",
	lightgrey: "#eee",
	darkgrey: "#888",
	lightred: "#ef8b80"
}

var total_posts = 64263,
	open = 25337,
	fulltime = total_posts - open,
	guest = 15000,
	vacant =  open - guest;

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
"The Delhi public school system has 64,263 full-time teacher positions available. Each square represents 100 full-time positions.",
"A bunch are full-time.",
"A bunch are part time.",
"The rest of the positions remain unfilled."
];
var highlights = [colors.lightgrey, colors.blue, colors.lightred, colors.red];
var chart_labels = ["Teaching positions", "Full-time teachers", "Part-time teachers", "Unfilled positions"];

var slides = data_arrays.map(function(d, i){
	return {
		data: d,
		text: texts[i],
		highlight: highlights[i],
		chart_label: chart_labels[i]
	}
});

slides.forEach(function(slide, i){

	$(".scroll-text").append("<div class='step step-" + i + "'><p>" + slide.text + "</p></div>");

});


var currdata = data_arrays[currslide];


function dataLoop(data, max, color){
	for (var i = 0; i < Math.floor(max / divisor); i++){
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
var dim = d3.min([window.innerWidth * .85, window.innerHeight * .85]);
var margin = {left: 1, right: 1, top: 1, bottom: 1};
var width = dim - margin.left - margin.right;
var height = dim - margin.top - margin.bottom;
var svg = d3.select(".chart").append("svg")
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

// center it
d3.select(".chart").select("svg")
		.attr("transform", "translate(" + ((window.innerWidth - width) / 2) + ", 0)")

redrawChart(slides[0].data, null, null);

function redrawChart(data, highlight, chart_label){

	var grid_data = data2grid.grid(data);

	var cell = svg.selectAll(".cell")
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
	
		var lines = svg.selectAll(".line")
			.data(point_data, function(d){ return d.id; })
	
		lines.exit().remove();
	
		lines.enter().append("line")
				.attr("class", "line")
				.attr("transform", "translate(" + (left_pad_error) + ", " + (-top_pad_error) + ")")
				.attr("x1", function(d){ return d.x; })
				.attr("y1", function(d){ return d.y; })
				.attr("x2", function(d){ return d.x; })
				.attr("y2", function(d){ return d.y; })
			.transition()
				// .delay(function(d, i){ return i * 25; })
				.attr("x2", function(d, i){ return i == point_data.length - 1 ? point_data[0].x : point_data[i + 1].x; })
				.attr("y2", function(d, i){ return i == point_data.length - 1 ? point_data[0].y : point_data[i + 1].y; });
	
		var c_label = svg.selectAll(".chart-label")
			.data([{txt: chart_label, id: jz.str.randomString()}], function(d){ return d.id; });
	
		c_label.exit().remove();
	
		var ext_y = d3.extent(point_data, function(d){ return d.y });

		var label_y = ext_y[0] + ((ext_y[1] - ext_y[0]) / 2);
		
		c_label.enter().append("text")
				.attr("class", "chart-label")
				.attr("x", width / 2)
				.attr("y", ext_y[0] + ((ext_y[1] - ext_y[0]) / 2))
				.attr("dy", -6)
				.text(function(d){ return d.txt; })
				.style("opacity", 1e-6)
			.transition().delay(500)
				.style("opacity", 1)
	}

}

// WAYPOINTS
var nav_height = 40;
var chart_height = height;
var window_height = window.innerHeight;
var top_listener = window_height - chart_height - ((window_height - chart_height) / 2) + (nav_height / 2);
var step_height = chart_height - (top_pad_error * 2);
var bottom_listener = top_listener + step_height - $(".step p").height();

$(".step").height(step_height * 1.25)

new Waypoint({
	element: $(".chart"),
	offset: top_listener,
	handler: function(direction){

		if (direction == "down"){
			$(".chart")
				.addClass("is-fixed")
				.css("top", top_listener);

			$(".step:first-of-type").css("margin-top", $(".chart").height() + 60);
		} else {
			$(".chart")
				.removeClass("is-fixed");

			$(".step:first-of-type").css("margin-top", 60);

		}

	}
})

function makeDebugLine(pos){
	d3.select("body").append("svg")
		.attr("height", 2)
		.attr("width", window.innerWidth)
		.style("position", "fixed")
		.style("top", pos + "px")
	.append("line")
		.attr("x1", 0)
		.attr("y1", 1)
		.attr("x2", window.innerWidth)
		.attr("y2", 1)
		.style("stroke", "red")
		.style("stroke-dasharray", "5, 5");
}

// makeDebugLine(top_listener);
// makeDebugLine(bottom_listener);

$(".step").each(function(step_index, step){

	var sel = ".step-" + step_index;

	// top waypoint
	new Waypoint({
	  element: $(this),
	  offset: top_listener,
	  handler: function(direction) {
	    
	    if (direction == "down"){
	    	$(sel).removeClass("is-active");

				// last slide
	  		if (step_index == slides.length - 1) {
	  			$(".chart")
		  			.removeClass("is-fixed")
		  			.addClass("is-bottom")
		  			.css("top", $(window).scrollTop() + top_listener);
	  		}


	    } else {
	    	$(sel).addClass("is-active");
	    	redrawChart(slides[step_index].data, slides[step_index].highlight, slides[step_index].chart_label);

	    	// last slide
	  		if (step_index == slides.length - 1) {
	  			$(".chart")
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