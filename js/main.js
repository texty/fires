
d3.select("#grid").style("width", (Math.floor(wrapper/gridItem)) * gridItem + "px");


//Ukraine shape map
var map = d3.select("div#map")
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + gridItem + " " + gridItem/1.5)      
    .classed("svg-content", true);

var projection = d3.geoMercator().translate([gridItem/2, gridItem/2]).scale(600).center([31.8,46.5]);
var path = d3.geoPath().projection(projection);

d3.json("data/ukr_shape.geojson").then(function(values){    
    map.selectAll("path")
            .data(values.features)
            .enter()
            .append("path")
            .attr("class","admin0")
            .attr("d", path)            
    });


//heatmap chart
var margin = {top: 50, right: 40, bottom: 100, left: 40},
    width = wrapper - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

const svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")");


// scale X  
var xScale = d3.scaleTime()
    .domain([new Date("2021-01-01"), new Date("2021-12-31")])
    .range([ 0, width ]);

svg.append("g")
    .attr("transform", "translate(0," + (-30) + ")")
    .call(d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(window.innerWidth > 800 ? formatMonth : formatShortMonth)
    );

// color scale  
var colorScale = d3.scaleSqrt()
    .range(["#311708","#fcbebe"])
    /* .range(["#311708","#371c10","#3d2115","#43261a","#4a2b1f","#503025","#57352a","#5d3a2f","#644035","#6b453b","#724a40",
        "#785046","#7f564c","#865b52","#8d6158","#94675f","#9c6d65","#a3736b","#aa7972","#b17f78","#b9857f","#c08b86",
        "#c7918c","#cf9793","#d69e9a","#dea4a1","#e5aba8","#edb1af","#f4b7b7","#fcbebe"
    ]) */

//drag triangle with week label
var focus_wrapper = svg.append('g'); 

var focus = focus_wrapper  
    .append('path')
    .attr("d", d3.symbol().type(d3.symbolTriangle).size(100))           
    .style("fill", "#fcccbe")
    .attr("stroke", "none") 
    .style("cursor", "pointer");    

var focusText = focus_wrapper
    .append('text')
    .attr("class", "week-label")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle");
    

//дані для heatmap
d3.json("http://airflow.backend-apps.com/api/v1/firestat/?format=json").then(function(mydata){
    
    var array = [];

    //transform data to array
    for(var i in mydata.Ukraine){
        let date = i.split(", ")            
        el = {"date": [parseDate(date[0]), parseDate(date[1])], "count": mydata.Ukraine[i].count}
        array.push(el)
    }

    //перший і останні роки для слайдера
    var maxDate_value = d3.max(array, function(d){ return d.date[1]});
    var maxDate = maxDate_value.getYear() + 1900;
    var minDate = d3.min(array, function(d){ return d.date[1].getYear()}) + 1900;

   
    /* --------------------------
    --- DRAW HEATMAP function ---
    ----------------------------- */
    
    function drawHeat(df, year) {  

        //filter data by selected year
        var filtered = array.filter(function(d){
            return d.date[0].getYear()+ 1900 === year
        })         

        //draw heatmap
        colorScale
            .domain(d3.extent(filtered, function(d){ return d.count}));

        xScale
            .domain([new Date(year.toString() +"-01-01"), new Date(year.toString()+ "-12-31")])
            .range([ 0, width ]);

        var rects = svg.selectAll("rect")
            .data(filtered)

        rects
            .exit().remove()
                
        rects
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
                    
        rects                          
            .transition()
            .duration(1000)
            .attr("x", function(d) { return xScale(d.date[0]) }) 
            .attr("width", function(d) { return xScale(d.date[1]) - xScale(d.date[0])  })                    
            .attr("fill", function(d){ return d.count < 10 ? "black" : colorScale(d.count)  })   





        //draw heatmap label (triangle with date, select year max fires by default)    
        let maxCount = d3.max(filtered, function(d){ return d.count })
        let xSelected = filtered.filter(function(d){ return d.count === maxCount })        
        let xval = xScale(xSelected[0].date[0]);

        //позиція трикутника
        focus
            .attr("transform", "translate(" + (xval + 10) + "," + (height + 20)  + ")");  
        
        //дата під трикутником
        focusText  
            .attr("x", 0)
            .attr("y", 0)
            .attr("transform", "translate(" + (xval + 10) + "," + (height + 40)  + ")")
            .text(triangleBottomLabel(xSelected[0])) 

        //к-ть пожеж у тексті над картою
        d3.select("#show_count").text(xSelected[0].count); 

        

        //точки на карту
        d3.json("http://airflow.backend-apps.com/api/v1/fires/?country=Ukraine&start_date="+ 
                d3.timeFormat("%Y-%m-%d")(xSelected[0].date[0]) +"&end_date="+ 
                d3.timeFormat("%Y-%m-%d")(xSelected[0].date[1])).then(function(points){   
        
            AddMarkersAndPictures(points)            
        });


        //drag triangle    
        var dragHandler = d3.drag()
            .on("drag", function () {
                d3.select(this)
                    .classed("dragging", true)
                    .attr('transform', function(d) { return 'translate(' + d3.event.x + ',' + (height + 20) + ')'; });

                d3.select(".week-label")
                    .attr('transform', function(d) { return 'translate(' + d3.event.x + ',' + (height + 40) + ')'; });                   
            })
            .on("end", function () {

                let dragged_x = xScale.invert(d3.event.x);

                //щоб не тягнулось далі останнього наявного тижня
                if(dragged_x.getTime() > maxDate_value.getTime()){
                    dragged_x = maxDate_value;
                } 
                 
                //фільтруємо день тижня в залежності від дати
                let dragged_week = filtered.filter(function(d){
                    return dragged_x.getTime() >= d.date[0].getTime() & 
                        dragged_x.getTime() <= d.date[1].getTime();            
                })
                
                clickOnHeat(dragged_week[0])
                
                         
            });
        
        focus.call(dragHandler)         
    }  


    drawHeat(array, maxDate)



    /* -----------------------------
    ------ YEAR SLIDER ABOVE  ------
    ------------------------------ */
    d3.select("#next").on("click", function(){
        let current = d3.select("#selected_years").text()
        if(current < maxDate){
            d3.select("#selected_years").text(parseInt(current) + 1)
        }    
        drawHeat(array, parseInt(d3.select("#selected_years").text()))
    }) 


    d3.select("#prev").on("click", function(){
        let current = d3.select("#selected_years").text()

        if(current <= maxDate & current > minDate){
            d3.select("#selected_years").text(parseInt(current) - 1)
        }  

        drawHeat(array, parseInt(d3.select("#selected_years").text()))     
    }) 

    
    /* ------------------------------
    ---- CLICK OR DRAG BEHAVIOR -----
    --------------------------------- */
    function clickOnHeat(d){
        /* console.log(d.date[0])
        console.log(d3.timeFormat("%Y-%m-%d")(d.date[0])) */

        //міняємо положення трикутника
        let xval = xScale(d.date[0]);
        d3.select("#show_count").text(d.count);

        focus            
            .attr("transform", "translate(" + (xval + 10) + "," + (height + 20)  + ")");

        focusText
            .attr("x", 0)
            .attr("y", 0)
            .attr("transform", "translate(" + (xval + 10) + "," + (height + 40)  + ")")
            .text(triangleBottomLabel(d))
        
        //точки на карту
        d3.json("http://airflow.backend-apps.com/api/v1/fires/?country=Ukraine&start_date="+ d3.timeFormat("%Y-%m-%d")(d.date[0]) +"&end_date="+ d3.timeFormat("%Y-%m-%d")(d.date[1])).then(function(points){   
                              
            // draw map
         AddMarkersAndPictures(points)           
                
         });        
    } 

    /* ------------------------------------------------------   
    ---- function to add map points and satelite pictures -----
    --------------------------------------------------------- */
    function AddMarkersAndPictures(df){
        // draw map
        map.selectAll("circle").remove();

        map.selectAll("circle")
            .data(df)
            .enter()
            .append("circle")
            .attr("class","circles")
            .attr("cx", function(k) {return projection([k.longitude, k.latitude])[0];})
            .attr("cy", function(k) {return projection([k.longitude, k.latitude])[1];})
            .attr("r", "1px")
            
        d3.select("#grid").selectAll(".pic-wrapper").remove();                
                    
        //draw satelite pictures
        var gridItem = d3.select("#grid")
            .selectAll("div.pic-wrapper")
            .data(df.length >=128 ? df.slice(0, 128) : df)
            .enter()
            .append("div")
            .attr("class", "pic-wrapper");
        
        gridItem.append("img")
            .attr("class", "tip")
            .attr("src", "img/test-pic.png")
            .attr("data-tippy-content", function(d){
                return "Дата:" + d + "<br>" +
                "Координати: " + d + "<br>" +
                "Тривалість: " + d;
            })
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