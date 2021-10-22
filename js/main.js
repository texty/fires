var parseDate = d3.timeParse("%Y-%m-%d");
var formatDate = d3.timeFormat("%B");

var bisect = d3.bisector(function(d) { return d.x; }).left;

//виміряємо ширину контейнера з heatmap
var wrapper =  d3.select("#heatmap").node().getBoundingClientRect().width;  

//розмір одного знімку у гріді
let gridItem = 350;
  

d3.select("#grid").style("width", (Math.floor(wrapper/gridItem)) * gridItem + "px")

//визначаємо карту
var map = d3.select("div#map")
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + gridItem + " " + 220)      
    .classed("svg-content", true);

var projection = d3.geoMercator().translate([gridItem/2, 150]).scale(900).center([32,46.5]);
var path = d3.geoPath().projection(projection);

d3.json("data/ukr_shape.geojson").then(function(values){    
    // draw map
    map.selectAll("path")
            .data(values.features)
            .enter()
            .append("path")
            .attr("class","continent")
            .attr("d", path)
            .attr("stroke", "white");
    });


//малюємо основний графік
var margin = {top: 50, right: 50, bottom: 100, left: 50},
    width = wrapper - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

    
const svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")");

var colorScale = d3.scaleQuantize()
    .range(["#311708", "#3e2415", "#5c290e", "#a3481c", "#a3481c", "#fcbaaa", "#fcccbe"])

var xScale = d3.scaleTime()
    .domain([new Date("2021-01-01"), new Date("2021-12-31")])
    .range([ 0, width ]);

svg.append("g")
    .attr("transform", "translate(0," + (-30) + ")")
    .call(d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(multiFormat)
    );

var focus = svg.append('g')
    .append('path')
    .attr("d", d3.symbol().type(d3.symbolTriangle).size(100))           
    .style("fill", "#fcccbe")
    .attr("stroke", "black")
    .attr('r', 8.5);


var focusText = svg.append('g')
    .append('text')   
    .attr("text-anchor", "left")
    .attr("alignment-baseline", "middle") 
    .style("fill", "white");

d3.json("http://airflow.backend-apps.com/api/v1/firestat/?format=json").then(function(mydata){
    
    var array = [];

    //transform data to array
    for(var i in mydata.Ukraine){
        let date = i.split(", ")            
        el = {"date": [parseDate(date[0]), parseDate(date[1])], "count": mydata.Ukraine[i].count}
        array.push(el)
    }

   

    /* -------------------------
    ---draw Heatmap function----
    ---------------------------- */
    
    function drawHeat(df, year) {  

        //filter by selected year
        var filtered = array.filter(function(d){
            return d.date[0].getYear()+ 1900 === year
        })         

        colorScale
            .domain(d3.extent(filtered, function(d){ return d.count}));

        xScale
            .domain([new Date(year.toString() +"-01-01"), new Date(year.toString()+ "-12-31")])
            .range([ 0, width ]);


        var rectangles = svg.selectAll("rect")
            .data(filtered)

        rectangles
            .exit().remove()
                
        rectangles
            .enter()
            .append("rect")
            .attr("class", "heat-item")
            .on("click", clickOnHeat)               
            .transition().duration(100)
            .attr("x", function(d) { return xScale(d.date[0]) }) 
            .attr("y", 0)
            .attr("width", function(d) { return xScale(d.date[1]) - xScale(d.date[0])  })                   
            .attr("height", 50)
            .attr("fill", function(d){ return d.count < 10 ? "black" : colorScale(d.count)  }) 
                
             
        rectangles                          
            .transition()
            .duration(1000)
            .attr("x", function(d) { return xScale(d.date[0]) }) 
            .attr("width", function(d) { return xScale(d.date[1]) - xScale(d.date[0])  })                    
            .attr("fill", function(d){ return d.count < 10 ? "black" : colorScale(d.count)  })   



            
        //додаємо трикутник із датою (по дефолту до дня у році з найбільшою кількістю пожеж)   
        let maxCount = d3.max(filtered, function(d){ return d.count })
        let xSelected = filtered.filter(function(d){ return d.count === maxCount })        
        let xval = xScale(xSelected[0].date[0]);

        //к-ть пожеж у тексті над картою
        d3.select("#show_count").text(xSelected[0].count); 

        //позиція трикутника
        focus.attr("transform", "translate(" + (xval + 10) + "," + (height + 20)  + ")");  

        //дата під трикутником
        focusText           
            .attr("x", xval - 30)
            .attr("y", (height + 40))
            .text(triangleBottomLabel(xSelected[0])) 
           
            
              
        //додаємо дефолтні супутникові
            d3.select("#grid")
            .selectAll("div")
            .data([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])
            .enter()
            .append("div")
            .style("border", "1px solid #fcccbe")
            .append("img")
            .attr("src", "img/test-pic.png")
    }  



    drawHeat(array, 2021)



    // горталка по роках
    d3.select("#next").on("click", function(){
        let current = d3.select("#selected_years").text()
        if(current < 2021){
            d3.select("#selected_years").text(parseInt(current) + 1)
        }    
        drawHeat(array, parseInt(d3.select("#selected_years").text()))
    }) 


    d3.select("#prev").on("click", function(){
        let current = d3.select("#selected_years").text()

        if(current <= 2021 & current > 2012){
            d3.select("#selected_years").text(parseInt(current) - 1)
        }  

        drawHeat(array, parseInt(d3.select("#selected_years").text()))     
    }) 

    
    /* ----------------------------
    ----- додаткові функції ------
    ------------------------------ */

    //клік на тиждень
    function clickOnHeat(d){
        console.log(d.date[0])
        console.log(d3.timeFormat("%Y-%m-%d")(d.date[0]))

        //міняємо положення трикутника
        let xval = xScale(d.date[0]);
        d3.select("#show_count").text(d.count);

        focus
            .style("opacity", 1)
            .attr("transform", "translate(" + (xval + 10) + "," + (height + 20)  + ")");

        focusText
            .style("opacity", 1)
            .attr("x", xval - 30)
            .attr("y", (height + 40))
            .text(triangleBottomLabel(d))
        
        //точки на карту
        d3.json("http://airflow.backend-apps.com/api/v1/fires/?country=Ukraine&start_date="+ d3.timeFormat("%Y-%m-%d")(d.date[0]) +"&end_date="+ d3.timeFormat("%Y-%m-%d")(d.date[1])).then(function(points){    
                
                // draw map
                map.selectAll("circle").remove();

                map.selectAll("circle")
                    .data(points)
                    .enter()
                    .append("circle")
                    .attr("class","circles")
                    .attr("cx", function(d) {return projection([d.longitude, d.latitude])[0];})
                    .attr("cy", function(d) {return projection([d.longitude, d.latitude])[1];})
                    .attr("r", "1px")
                    .attr("fill", "red")       
            });



        //підвантажити супутникові знімки
        /* d3.select("#grid")
            .selectAll("div")
            .data()
            .enter()
            .append("div")
            .style("border", "1px solid #fcccbe")
            .append("img")
            .attr("src", "img/test-pic.png") */
        
    } 

    //форматуємо дату під трикутником
    function triangleBottomLabel(item){        
        let label = d3.timeFormat("%d")(item.date[0]) + 
                "." + d3.timeFormat("%m")(item.date[0])+
                " - " +d3.timeFormat("%d")(item.date[1]) + 
                "." + d3.timeFormat("%m")(item.date[1])
        return(label)
    }



 





    });