// This adds a new value to the chart whenever it's called
var updateCharts = function(seriesName, dojoSeries){
	// get the heart rate without an event
	var heartRateForChart = createHeartRateValue();
	
	// put the heart rate through an event filter if needed
	if (currentEvent) {
		heartRateForChart = currentEvent(heartRateForChart);
	}
	
	// update the chart
	dojoSeries.shift();
	dojoSeries.push(heartRateForChart);
	fetalChart.updateSeries(seriesName, dojoSeries);
	fetalChart.render();
};

// Does all of the heavy lifting for generating the current heart rate.
// It increments the timer by 1 and returns an (x,y) coordinate.
var createHeartRateValue = function(){
	// generate a random number between -1 and 1;
	var randomNumber = (Math.random() - 0.5) * 2;
	
	// determine the heartrate based on the previous value
	var heartRate = previousHeartRateValue + (maxFetalVolatility * randomNumber);
	
	// make sure it's not outside of the maximum variability range
	if (Math.abs(heartRate - fetalBaseline) > maxFetalVariability) {
		if (heartRate > fetalBaseline) {
			heartRate = fetalBaseline + maxFetalVariability;
		} else {
			heartRate = fetalBaseline - maxFetalVariability;
		}
	}
	
	// remember the previous value and return the results
	previousHeartRateValue = heartRate;
	return {x: ++timer, y: heartRate};
};

// a helper function to get the Variability and set it when needed.
var getFetalVariability = function() {
	// first set a new variability if it's time
	if (count % fetalVariabilityChangeRate == 0) {
		fetalVariability = randomFromTo(minFetalVariability, maxFetalVariability);
	}
	// then return the variability
	return fetalVariability;
};

// a helper function to get the Volatility and set it when needed.
var getFetalVolatility = function() {
	// first set a new volatility if it's time
	if (count % fetalVolatilityChangeRate == 0) {
		fetalVolatility = randomFromTo(minFetalVolatility, maxFetalVolatility);
	}
	return fetalVolatility;
};

// a helper function to generate a random number within in a specific range
var randomFromTo = function(from, to) {
	return Math.floor(Math.random() * (to - from + 1) + from);
}

// Fully populates the chart with data.
// This is only used when first showing the graph.
var makeSeries = function(len){
	var s = [];
	do{
		if (startWithPrefilledValues) {
			s.push(createHeartRateValue());
		} else {
			s.push({x: ++timer, y: 0});
		}
	} while(s.length < len);
	return s;
};

// Constructs the chart and sets its update interval
var makeObjects = function(){
	fetalChart = new dojox.charting.Chart("fetalDojoChart");
	var fetalChartTheme = dojox.charting.themes.Tufte;
	fetalChartTheme.axis.majorTick.color = "#ffc0b3";
	fetalChartTheme.axis.minorTick.color = "#ffeae5";
	fetalChart.setTheme(fetalChartTheme);
	
	fetalChart.addAxis("x", {
		natural: true,
		majorTickStep: 50, 
		minorTickStep: 10
	});
	fetalChart.addAxis("y", {
		vertical: true, 
		min: yAxisMin, 
		max: yAxisMax,
		minorLabels: false,
		majorTickStep: 30, 
		minorTickStep: 10
	});
	fetalChart.addPlot("default", {type: "Lines", tension: 2});
	seriesA = makeSeries(xAxisSize);
	fetalChart.addSeries("Series A", seriesA, {
		stroke: {
	        color: "red",
	        width: 1
	    }
	});
	
	fetalChart.addPlot("grid", {
		type: "Grid",
		hMinorLines: true,
		vMinorLines: true
	});
	fetalChart.render();
};

// Sets the speed that the chart generates new values.
// The newSpeed arguement is how many times faster than realtime.
// For example, a newSpeed of 5 would update every 200 miliseconds.
var setSpeed = function(newSpeed) {
	// clear out the old repeating chart updater if there is one
	if (intervalId) {
		clearInterval(intervalId);
	}
	
	// set a new chart updater
	var updateInterval = 1000 / newSpeed;
	intervalId = setInterval(function(){updateCharts("Series A", seriesA);}, updateInterval);
}


// ***************************************************************************************
// ***   These are the events that can be added to adjust the random heart rate        ***
// ***************************************************************************************
var startEvent = function(eventFunction) {
	eventStartTime = timer;
	currentEvent = eventFunction;
}

// This is an example event that drops the heart rate instantly
var dropHeartRateTestEvent = function(heartRateForChart) {
	// stop the event after 50 seconds
	if (timer - eventStartTime > 50) {
		currentEvent = null;
		return heartRateForChart;
	}
	
	// adjust the value by reducing the Y by 80
	var newY = heartRateForChart.y - 80;
	return {x: heartRateForChart.x, y: newY};
}

// This is an example event that drops the reart rate exponentially over time
var slowHeartRateTestEvent = function(heartRateForChart) {
	var elapsedEventTime = timer - eventStartTime;
	
	// stop the event after 100 seconds
	if (elapsedEventTime > 100) {
		currentEvent = null;
		return heartRateForChart;
	}
	
	// adjust the y value gradually at first and then keep it down.
	var newY;
	if (elapsedEventTime < 50) {
		// for the first 50 seconds slowly reduce the heartrate
		newY = heartRateForChart.y - (Math.pow(elapsedEventTime, 2)/50);
	} else {
		// for the second 50 seconds, just reduce the value by 50
		newY = heartRateForChart.y - 50;
	}
	
	// return the old X position with the new Y
	return {x: heartRateForChart.x, y: newY};
}