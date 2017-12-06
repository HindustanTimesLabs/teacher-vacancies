var io = require("indian-ocean"),
	jz = require("jeezy"),
	moment = require("moment");

var data = io.readDataSync("data/vacancies_line.csv");

var lines = data.columns;
lines.shift();

var out = lines.map(line => {
	var obj = {};
	obj.name = line;
	obj.data = data.map((d, i) => {

		var date = moment(d.date).format("YYYY-MM-DD");
		var val = +jz.str.removeAll(d[line], ",");

		if (line == "sanctioned"){
			while (val == 0){
				--i;
				val = +jz.str.removeAll(data[i][line], ",");
			}
		}
	
		return {
			name: line,
			date: date,
			value: val
		}

	});

	return obj;
});

io.writeDataSync("data/line_data.json", out);