/*
|  _  \____ | |  \/  |           (_) |   
| | | |   / / | .  . | __ _  __ _ _| | __
| | | |   \ \ | |\/| |/ _` |/ _` | | |/ /
| |/ /.___/ / | |  | | (_| | (_| | |   < 
|___/ \____/  \_|  |_/\__,_|\__, |_|_|\_\
                             __/ |       
                            |___/       
*/
/*Misc. helper functions to place drawn elements on top or bottom of others in canvas drawing order*/
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
d3.selection.prototype.moveToBack = function() { 
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    }); 
};


/*Define chart dimensions in px*/
var margin = {top:40,bottom:60,left:10,right:180},
    height = 400 - margin.top-margin.bottom,
    width = 400 - margin.left-margin.right;

/*
SCALES determine the ranges in pixels the data will be rendered in and can be ordinal or continuous (linear, log, etc.).

We will later define a DOMAIN which maps to the RANGE values.

For example, our data may have a domain of values between 0 and 100, but our range in pixels is from 0px - 350px. So something with a value of 50 in the data will be mapped to a point at 175px.

You can also definte color ranges, which we don't need in this case...
*/

var x = d3.scale.linear()
    .range([0, width])

var color = d3.scale.linear()
    .range(['#feb24c','#E3170D']);

/*
D3 automates most of the tedious drawing of axes in SVG.

Here we declare our axes, set their scale property to the 
scales we defined above, and say where we want them drawn relative 
to the chart canvas.
*/
var xAxis = d3.svg.axis()
    .scale(x)
    .ticks(6)
    .orient("top");


/*Now we use D3 to append an SVG element to our DIV
which will serve as our drawing canvas.

D3 selections work the same as jquery ones. 

We also append a G element to group all the elements we're going to draw.
Using the SVG translate function, we move that group to the right and down 
to make the margins we want.
*/
var svg = d3.select("#barChart").append("svg")
    .attr("class","barChart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Define gradients for positive and negative numbers
var gradient = svg.append("svg:defs")
    .append("svg:linearGradient")
    .attr("id", "redgradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");
gradient.append("svg:stop")
    .attr("offset", "0%")
    .attr("stop-color", "#FFCCCC")
    .attr("stop-opacity", 1);
gradient.append("svg:stop")
    .attr("offset", "100%")
    .attr("stop-color", "#880000")
    .attr("stop-opacity", 1);

var gradient = svg.append("svg:defs")
    .append("svg:linearGradient")
    .attr("id", "bluegradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");
gradient.append("svg:stop")
    .attr("offset", "0%")
    .attr("stop-color", "#325C74")
    .attr("stop-opacity", 1);
gradient.append("svg:stop")
    .attr("offset", "100%")
    .attr("stop-color", "#E0EEEE")
    .attr("stop-opacity", 1);


/*Transition speed in ms*/
var trans = 1000;

/*Use d3 to populate options of state dropdown. You can add this to the chart function if you need to update these values. We don't... */
for(d in data){
    d3.select("#barSelect")
        .append("option")
        .attr("value",data[d].state)
        .text(data[d].state);
}   

/*Instantiate the x axis with a call. Grouping all individual elements with class name*/
svg.append("g")
  .attr("class", "x axis")
  .call(xAxis);

/*Drawing the Y axis by hand. This is just an intial state that will be updated when we draw the chart.*/
svg.append("g")
  .attr("class", "y axis")
  .append("line")
  .attr("class", "y axis")
  .attr("y1",-7)
  .attr("y2", height)
  .attr("x1", 0)
  .attr("x2", 0);



/*How we select our data based on dropdown*/
function stateSelect(element){
    return element.state === this.state;
}

$('#barSelect').change(function(){
    var check = { state : $(this).val() };
    var dataSelect = data.filter(stateSelect,check);
    /*Call chart function*/
    chart(dataSelect);   
});


/*Write Chart inside function.*/
function chart(data){

    /*Prepare data*/
    var data = data[0];    
    var sector_data = data.sectors;

    console.log(sector_data);

   
    
    /*Update SVG height and Y scale based on number of data elements*/
    var svg_height = sector_data.length*20,
        pad_height = (sector_data.length+1)*3;

    d3.select(".barChart")
        .transition().duration(trans)
        .attr("height",svg_height+pad_height+margin.top+margin.bottom);

    y = d3.scale.ordinal()
    .rangeRoundBands([0, svg_height+pad_height], 0,0);

  //Defining the domain for the x axis. We use the max and min data values, but because we have negative values, need to make sure 0 is always in the domain if both numbers are positive or negative.
  var x_extent = d3.extent(sector_data, function(d) { return +d.residual ; });
      if(x_extent[0]*x_extent[1]<0){
        //opposite signs
        x.domain(x_extent).nice();
      }else if(x_extent[0]<0){
        //both negative
        x.domain([d3.min(x_extent),0])
      }else{
        //both positive
        x.domain([0,d3.max(x_extent)])
      };

    /*Define Y domain (ordinal)*/
    y.domain(sector_data.map(function(d) { return d.sector; }));


/*This is the magic sauce. The bind, enter, update, exit pattern.*/

    /*BIND elements to data via D3 selection on element class*/
    var bars = svg.selectAll(".bar")
        .data(sector_data);

    /*ENTER elements with default start attributes,ie, unbound with data, and any attributes that won't change as a result of data manipulations, eg, css class, etc.*/
    bars.enter().append("rect")
        .attr("width",0)
        .attr("x", function(d) { return d.residual < 0 ? x(0) : x(Math.min(0, d.residual)); });

    /*UPDATE the elements with bound data. This is where you use the data to define those attributes that depend on it. Adding a transition makes d3 change the properties below via a */
    bars
      .attr("class", function(d) { return d.residual < 0 ? "bar negative "+d.naics_code : "bar positive "+d.naics_code; })
    .transition().duration(trans)
      .style("fill", function(d) { return d.residual < 0 ? "url(#bluegradient)" : 'url(#redgradient)'; })
      .attr("y", function(d) { return y(d.sector)+5; })
      .attr("height", 20)
      .attr("x", function(d) { return x(Math.min(0, d.residual)); })
      .attr("width", function(d) { return Math.abs(x(d.residual) - x(0)); });

    /*REMOVE elements not bound with data. For example if we have fewer elements on the next data state.*/
    bars.exit()
      .remove();

    /*Rinse and repeat!*/
    var swims = svg.selectAll(".swim")
        .data(sector_data);

    swims.enter().append("rect")
        .attr("width",width)
        .attr("x",0)
        .attr("height","24px");
    
    swims
        .attr("y",function(d) { return y(d.sector)+3; })
        .attr("class",function(d,i){return i % 2? "swim odd "+d.naics_code : "swim "+d.naics_code; })
        .moveToBack();

    swims.exit().remove();

    /*Here's an example of adding transition effects to enter and exit*/
    var labs = svg.selectAll(".lab")
        .data(sector_data);

    labs.enter().append("text")
        .attr("class","lab")
        /*Original values out of frame*/
        .attr("x",width)
        .attr("y",height);

    labs
        .text(function(d){return " "+d.sector;})
        .attr("transform",
            function(d){
            return "rotate(20 "+215+","+(y(d.sector)+20)+")" ;
        })
        .transition().duration(trans/2)
        .attr("x",215)
        .attr("y",function(d) { return y(d.sector)+20; });

    labs.exit()
    .transition().duration(trans)
    .attr("y",1000)
        .remove();


    /*Update axes. Notice the Y axis isn't using data to update, so we can skip the d3 pattern. The xaxis does use data, but it's getting that in the domain definitions above.*/
    svg.select(".x.axis")
        .transition()
        .duration(trans)
        .call(xAxis);

    svg.selectAll(".y.axis")
      .transition()
      .duration(trans)
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y2",svg_height+pad_height+2);

    d3.selectAll(".y.axis").moveToFront();

}


/*Initial State*/
$('#barSelect').val("Texas");
chart(data.filter(stateSelect,{ state : "Texas"}));