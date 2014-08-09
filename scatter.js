/*sk_*/

var sk_margin = {t:30, r:20, b:30, l:50 },
	w = 600 - sk_margin.l - sk_margin.r,
	h = 450 - sk_margin.t - sk_margin.b;

var sk_trans = 1500;
	
var sk_color = d3.scale.ordinal()
    	.range(['#880000','#325C74']);
	
	sk_radius=6;

var sk_transparency = d3.scale.sqrt().range([1,1]);

var sk_svg = d3.select("#scatterChart").append("svg")
	.attr("width", w + sk_margin.l + sk_margin.r)
	.attr("height", h + sk_margin.t + sk_margin.b);


var sk_xAxis = d3.svg.axis()
	.ticks(6)
	.tickSubdivide(4)
	.tickSize(6, 4, 0)
	.orient("bottom");

var sk_yAxis = d3.svg.axis()
	.ticks(10)
	.tickSubdivide(4)
	.tickSize(6, 4, 0)
	.orient("left");

var plus = d3.format("+");
var comma = d3.format(",");
var percent = d3.format("+%f");

var sk_groups = sk_svg.append("g").attr("transform", "translate(" + sk_margin.l + "," + sk_margin.t + ")");

var scatter_data;
d3.csv("analysis.csv", function(data) {
	window.scatter_data=data;
	initialize(scatter_data);
});

var guide_data = [{	x_adjust:20,	y_adjust:1.99,	text:"+99%"},{	x_adjust:20,	y_adjust:1.95,	text:"+95%"},{	x_adjust:20,	y_adjust:1.9,	text:"+90%"},{	x_adjust:20,	y_adjust:1.8,	text:"+80%"},{	x_adjust:20,	y_adjust:1.6,	text:"+60%"},{	x_adjust:20,	y_adjust:1.4,	text:"+40%"},{	x_adjust:20,	y_adjust:1.2,	text:"+20%"},{	x_adjust:30,	y_adjust:1,	text:"+0%"},{	x_adjust:20,	y_adjust:.8,	text:"-20%"},{	x_adjust:20,	y_adjust:.6,	text:"-40%"},{	x_adjust:20,	y_adjust:.4,	text:"-60%"},{	x_adjust:20,	y_adjust:.2,	text:"-80%"},{	x_adjust:20,	y_adjust:.1,	text:"-90%"},{	x_adjust:20,	y_adjust:.05,	text:"-95%"},{	x_adjust:20,	y_adjust:.01,	text:"-99%"},];


function scatterplot(data,signal){

data = dataPrepare(data,signal);

if(signal ===1){
	var sk_x = d3.scale.sqrt().range([0, w]),
    	sk_y = d3.scale.sqrt().range([h - sk_margin.b - 10,0]);
	    sk_x.domain([0, d3.max(data, function(d) { return parseFloat(d.x_plot); })*1.15]);
		sk_y.domain([0, d3.max(data, function(d) { return parseFloat(d.y_plot); })*1.1]);
		sk_yAxis.scale(sk_y).tickFormat(comma);
}else{
	var sk_x = d3.scale.sqrt().range([0, w]),
    	sk_y = d3.scale.linear().range([h - sk_margin.b - 10,0]);
    	sk_x.domain([0, d3.max(data, function(d) { return parseFloat(d.x_plot); })*1.15]);
		sk_y.domain([-1,1]);
		sk_yAxis.scale(sk_y).tickFormat(percent);
}


var sk_expect_max = d3.max(data, function(d) { return parseFloat(d.x_plot); });

sk_xAxis.scale(sk_x);

sk_transparency.domain([d3.min(data, function(d) { return parseFloat(d.x_plot); }),d3.max(data, function(d) { return parseFloat(d.x_plot); })])

guides
	.transition().duration(sk_trans)
	.attr("class", function(d){return d.y_adjust ===1 ? "trendline guides" :"compline guides"})
	.attr('x1',sk_x(0) )
    .attr('x2',sk_x(sk_expect_max))
    .attr('y1',function(d){return signal===1 ? sk_y(0): sk_y((1-d.y_adjust)*-1) ;} )
    .attr('y2',function(d){ return signal===1 ?  sk_y(sk_expect_max * d.y_adjust) : sk_y((1-d.y_adjust)*-1) ; });


var guide_text = sk_svg.selectAll(".guide_text")
			.data(guide_data);
guide_text.enter().append("text")
	.attr("class","guide_text")
	.attr("x", function(d){return w+d.x_adjust})
	.text(function(d){return d.text;});
guide_text
	.transition().duration(sk_trans)
	.attr("y", function(d){ return sk_y(sk_expect_max * d.y_adjust)+30; }); 




sk_svg.selectAll(".guide_text.spare")
.transition().duration(sk_trans)
.attr("y",function(){return signal ===1 ? 10 :-1000 ;});

	// style the circles, set their locations based on data
	var sk_circles =
	sk_groups.selectAll("circle");

	sk_circles
		.transition().duration(sk_trans)
		.attr({
			cx: function(d) { return sk_x(+d.x_plot); },
	    	cy: function(d) { return sk_y(+d.y_plot); },
		})
		.style("fill", function(d) { return sk_color(d.union); })
		.style("opacity",function(d){
			if(signal ===1){
				return 1;
			}else{
				return sk_transparency(d.x_plot);
			} })
		;


	sk_circles.on("mouseover",mouseOn)
		.on("mouseout",mouseOff);
	
	// what to do when we mouse over a bubble
	function mouseOn() { 
		var sk_circle = d3.select(this);

	// transition to increase size/opacity of bubble
		sk_circle.transition()
		.duration(800).style("opacity", 1)
		.attr("r", 20).ease("elastic");

		// append lines to bubbles that will be used to show the precise data points.
		// translate their location based on margins
		sk_svg.append("g")
			.attr("class", "guide")
		.append("line")
			.attr("x1", sk_circle.attr("cx"))
			.attr("x2", sk_circle.attr("cx"))
			.attr("y1", +sk_circle.attr("cy") )
			.attr("y2", h-30)
			.attr("transform", "translate(50,20)")
			.style("stroke", sk_circle.style("fill"))
			.transition().delay(200).duration(400).styleTween("opacity", 
						function() { return d3.interpolate(0, .5); });

		sk_svg.append("g")
			.data(data)
			.attr("class", "guide")
		.append("line")
			.attr("x1", +sk_circle.attr("cx") )
			.attr("x2", 0)
			.attr("y1", sk_circle.attr("cy"))
			.attr("y2", sk_circle.attr("cy"))
			.attr("transform", "translate(50,30)")
			.style("stroke", sk_circle.style("fill"))
			.transition().delay(200).duration(400).styleTween("opacity", 
						function() { return d3.interpolate(0, .5); });


	// function to move mouseover item to front of SVG stage, in case
	// another bubble overlaps it
		d3.selection.prototype.moveToFront = function() { 
		  return this.each(function() { 
			this.parentNode.appendChild(this); 
		  }); 
		};
	// skip this functionality for IE9, which doesn't like it
		if (!$.browser.msie) {
			sk_circle.moveToFront();	
			}
	};

	// what happens when we leave a bubble?
	function mouseOff() {
		var sk_circle = d3.select(this);

		// go back to original size and opacity
		sk_circle.transition()
		.duration(800)
		.style("opacity",function(d){
			if(scatterClicker ===1){
				return 1;
			}else{
				return sk_transparency(d.x_plot);
			} })
		.attr("r", sk_radius).ease("elastic");

		// fade out guide lines, then remove them
		d3.selectAll(".guide").transition().duration(100).styleTween("opacity", 
						function() { return d3.interpolate(.5, 0); })
			.remove()
	};


	// tooltips (using jQuery plugin tipsy)
	sk_circles;

	$(".circles").tipsy({ 
		gravity: 's',
		html: 'true'
		});

	xxAxis.transition()
        .duration(sk_trans).call(sk_xAxis);
	yyAxis.transition()
        .duration(sk_trans).call(sk_yAxis);

	

};

function initialize(scatter_data){

var data=dataPrepare(scatter_data,1);

var sk_circles =
sk_groups.selectAll("circle")
	.data(data);

sk_circles.enter().append("circle")
  .attr({
  	class: function(d){return  "circles "+d.state;},
  	r: sk_radius,
    id: function(d) { return d.state; },
    cy:2000,
  })
	.append("title")
	.attr("class","tipsies")
	.text(function(d) { return '<font size="4px">'+d.state+'</font>' + '<br/>' +'Actual: '+ comma(d.y_plot)+ '<br/>' +"Expected: "+comma(d.x_plot) +'<br/>'+'<font size="2px"> <b>Rate: '+ plus(d3.round((1- (+d.perform))*-100,2))+'%'; });
	scatterplot(data,1);
}


function dataPrepare(data,signal){
if(signal ===1){
	for(d in data){
		data[d].x_plot = Math.round(data[d].expected_fatal);
		data[d].y_plot = data[d].actual_fatal;
		data[d].perform = Math.round(data[d].perform*100)/100;
	}
}else{
	for(d in data){
		data[d].x_plot = Math.round(data[d].expected_fatal);
		data[d].y_plot = data[d].perform-1;
		data[d].perform = Math.round(data[d].perform*100)/100;
	}
}
return data;
}


//data = scatter_data.sort(function(a,b) { return parseFloat(a.emplys) - parseFloat(b.emplys) } );


// draw axes and axis labels
var xxAxis = sk_svg.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(" + sk_margin.l  + "," + (h-10) + ")");
var yyAxis = sk_svg.append("g")
	.attr("class", "y axis")
	.attr("transform", "translate(" + sk_margin.l + "," + sk_margin.t + ")");

var guides = sk_svg.selectAll(".complines.guides")
				.data(guide_data);
guides.enter().append("line")
	.attr("transform", "translate(" + sk_margin.l + "," + sk_margin.t + ")");


sk_svg.append("text")
	.attr("class", "x label")
	.attr("text-anchor", "end")
	.attr("x", w + 50)
	.attr("y", h - 15)
	.text("Expected Deaths");
sk_svg.append("text")
	.attr("class", "y label")
	.attr("text-anchor", "end")
	.attr("x", -20)
	.attr("y", 55)
	.attr("dy", ".75em")
	.attr("transform", "rotate(-90)")
	.text("Actual Deaths");
sk_svg.append("text")
	.text("Below Expected")
	.attr("class","scatter_lab")
	.attr("x", 360)
	.attr("y", 300);
sk_svg.append("rect")
	.attr("class","rectback")
	.attr("transform", "translate(" + sk_margin.l + "," + sk_margin.t + ")")
	.attr("x", 100)
	.attr("y", 80)
	.attr("width",140)
	.attr("height",19)
	.style({
		fill:"white",
		opacity:.5
	});
sk_svg.append("text")
 	.text("Above Expected")
 	.attr("class","scatter_lab")
	.attr("x", 150)
	.attr("y", 125);
sk_svg.append("line")
	.attr("transform", "translate(" + sk_margin.l + "," + sk_margin.t + ")")
	.attr("class", "trendlinekey")
	.attr('x1',0)
    .attr('x2',30)
    .attr('y1',h-10)
    .attr('y2',h-10);
sk_svg.append("text")
	.attr("class","chartkey")
 	.text("Expected workplace deaths based on national averages.")
	.attr("transform", "translate(" + sk_margin.l + "," + sk_margin.t + ")")
	.attr("x", 32)
	.attr("y", h-6);

sk_svg.append("circle")
	.attr("class","chartkey")
	.attr("transform", "translate(" + sk_margin.l + "," + sk_margin.t + ")")
	.attr("cx", 10)
	.attr("cy", h+8)
	.attr("r",5)
	.style("fill","#880000")
	.style("stroke","black");
sk_svg.append("circle")
	.attr("class","chartkey")
	.attr("transform", "translate(" + sk_margin.l + "," + sk_margin.t + ")")
	.attr("cx", 140)
	.attr("cy", h+8)
	.attr("r",5)
	.style("fill","#325C74")
	.style("stroke","black");

sk_svg.append("text")
	.attr("class","chartkey")
 	.text("Right-to-work state")
	.attr("transform", "translate(" + sk_margin.l + "," + sk_margin.t + ")")
	.attr("x", 20)
	.attr("y", h+12);
sk_svg.append("text")
	.attr("class","chartkey")
 	.text("Closed-shop state")
	.attr("transform", "translate(" + sk_margin.l + "," + sk_margin.t + ")")
	.attr("x", 150)
	.attr("y", h+12);

/*Spares along the top*/
sk_svg.append("rect")

	.attr("x",400)
	.attr("y",0)
	.attr("width",150)
	.attr("height",12)
	.style("fill","white");
sk_svg.append("text")
	.attr("class","guide_text spare")
 	.text("+20%")
 	.style("font-size","11px")
	.attr("x", w);
sk_svg.append("text")
	.attr("class","guide_text spare")
 	.text("+40%")
 	.style("font-size","11px")
	.attr("x", w-37);
sk_svg.append("text")
	.attr("class","guide_text spare")
 	.text("+60%")
 	.style("font-size","11px")
	.attr("x", w-70);
sk_svg.append("text")
	.attr("class","guide_text spare")
 	.text("+99%")
	.attr("x", w-110)
	.style("font-size","10px");




var scatterClicker =1;
$('.scatterSelect').click(function(){
	if(scatterClicker===1){
		scatterplot(scatter_data,0);
		scatterClicker = 0;
		$('.scatterSelect').text("Chart as Real");
	}else{
		scatterplot(scatter_data,1);
		scatterClicker = 1;
		$('.scatterSelect').text("Chart as Rate");
	}

}	);
	

























	



