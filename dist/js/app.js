d3.json("headers.json", function(error, data) {
       // this is your data
        rowLabel = data['uni_name'];
        colLabel = data['field_name'];
        hcrow =data['uni_ind'];
        hccol = data['field_ind'];
        colgroup = data['field_dict'];
        var margin = { top: 250, right: 10, bottom: 50, left: 200 },
      cellSize=24;
      col_number=colLabel.length;
      row_number=rowLabel.length;
      width = cellSize*col_number; // - margin.left - margin.right,
      height = cellSize*row_number; // - margin.top - margin.bottom,
      //gridSize = Math.floor(width / 24),
      legendElementWidth = cellSize*1.25;
      colorBuckets = 21;
      colors = ['#005824','#1A693B','#347B53','#4F8D6B','#699F83','#83B09B','#9EC2B3','#B8D4CB','#D2E6E3','#EDF8FB','#FFFFFF','#F1EEF6','#E6D3E1','#DBB9CD','#D19EB9','#C684A4','#BB6990','#B14F7C','#A63467','#9B1A53','#91003F'];
      //hcrow = [49,11,30,4,18,6,12,20,19,33,32,26,44,35,38,3,23,41,22,10,2,15,16,36,8,25,29,7,27,34,48,31,45,43,14,9,39,1,37,47,42,21,40,5,28,46,50,17,24,13], // change to gene name or probe id
      //hccol = [6,5,41,12,42,21,58,56,14,16,43,15,17,46,47,48,54,49,37,38,25,22,7,8,2,45,9,20,24,44,23,19,13,40,11,1,39,53,10,52,3,26,27,60,50,51,59,18,31,32,30,4,55,28,29,57,36,34,33,35], // change to gene name or probe id
      //rowLabel = ['1759080_s_at','1759302_s_at','1759502_s_at','1759540_s_at','1759781_s_at','1759828_s_at','1759829_s_at','1759906_s_at','1760088_s_at','1760164_s_at','1760453_s_at','1760516_s_at','1760594_s_at','1760894_s_at','1760951_s_at','1761030_s_at','1761128_at','1761145_s_at','1761160_s_at','1761189_s_at','1761222_s_at','1761245_s_at','1761277_s_at','1761434_s_at','1761553_s_at','1761620_s_at','1761873_s_at','1761884_s_at','1761944_s_at','1762105_s_at','1762118_s_at','1762151_s_at','1762388_s_at','1762401_s_at','1762633_s_at','1762701_s_at','1762787_s_at','1762819_s_at','1762880_s_at','1762945_s_at','1762983_s_at','1763132_s_at','1763138_s_at','1763146_s_at','1763198_s_at','1763383_at','1763410_s_at','1763426_s_at','1763490_s_at','1763491_s_at'], // change to gene name or probe id
      //colLabel = ['con1027','con1028','con1029','con103','con1030','con1031','con1032','con1033','con1034','con1035','con1036','con1037','con1038','con1039','con1040','con1041','con108','con109','con110','con111','con112','con125','con126','con127','con128','con129','con130','con131','con132','con133','con134','con135','con136','con137','con138','con139','con14','con15','con150','con151','con152','con153','con16','con17','con174','con184','con185','con186','con187','con188','con189','con191','con192','con193','con194','con199','con2','con200','con201','con21']; // change to contrast name
      var color_cols = d3.scale.category10();




    d3.tsv("full_rankings.tsv",

    function(d) {
      return {
        row:   +d.row_idx,
        col:   +d.col_idx,
        value: +d.log2ratio,
          ranking:+d.ranking,
          rank_2016:+d.y2016,
          rank_2015:+d.y2015,
          rank_2014:+d.y2014,
          rank_2013:+d.y2013,
          rank_2012:+d.y2012
      };
    },
    function(error, data) {

      var highlightlimit=10;
      var colorScale = d3.scale.linear()
          .domain([ 0,highlightlimit,highlightlimit+1,1000])
          .range([d3.rgb("lightskyblue"), d3.rgb('lightskyblue'),d3.rgb('white'),d3.rgb('white')]);

          //.range([d3.rgb("#007AFF"), d3.rgb('lightblue'),d3.rgb('#FFF')]);
          //.range(colors);

      // Get screen width & height
        var screenWidth = window.innerWidth;
        var screenHeight = window.innerHeight;

        // Define breakpoints
        var screenWidth = window.innerWidth;
        var isMobile = screenWidth < 768;  // Mobile (phones)
        var isTablet = screenWidth >= 768 && screenWidth < 1024; // Tablets
        var isDesktop = screenWidth >= 1024; // Desktop screens

        // Define font sizes based on screen type
        var mobileFont = "6pt";
        var tabletFont = "8pt";
        var desktopFont = "11pt";

        // Set max chart dimensions for large screens
        var maxWidth = 850;  // Default desktop width
        var maxHeight = 900; // Default desktop height
        var aspectRatio = maxHeight / maxWidth; // Maintain aspect ratio

        // Dynamically adjust width based on screen size
        var width = isMobile 
            ? Math.min(screenWidth * 0.9, maxWidth)  // 90% of screen width for mobile
            : isTablet 
            ? Math.min(screenWidth * 0.8, maxWidth)  // 80% for tablets
            : maxWidth;  // Default for large screens

        // Maintain aspect ratio for height
        var height = width * aspectRatio;

        // Adjust margins for different screen sizes
        var margin = { 
            top: isMobile ? 80 : isTablet ? 150 : 250, 
            right: 10, 
            bottom: 50, 
            left: isMobile ? 60 : isTablet ? 120 : 200 
        };

        // Dynamically adjust cell size
        var baseCellSize = 24; // Default desktop cell size
        var cellSize = isMobile 
            ? (width / col_number) * 0.6  // Smaller cells for mobile
            : isTablet
            ? (width / col_number) * 0.7  // Slightly smaller for tablets
            : baseCellSize;  // Default for large screens

        // Prevent chart from overflowing
        d3.select("#chart-container").style("overflow", "hidden");

        // Create the SVG with dynamically adjusted dimensions
        var svg = d3.select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        // Adjust text sizes for mobile readability
        // var fontSize = isMobile ? "8pt" : "11pt"; // Reduce font size for mobile
        // d3.selectAll(".rowLabel, .colLabel").style("font-size", fontSize);
    
      var rowSortOrder=false;
      var colSortOrder=false;

      var rowTopTenOrder = [];
      var rowTopTenList =[];
        var rankingOrder = function(d,cutoff){
          for(var i in d) {
              var rank = d[i].ranking;
              var uni_key = d[i].row;
              if(rowTopTenList.indexOf(d[i].row) === -1){
                  rowTopTenList.push(uni_key);
                  rowTopTenOrder.push({
                      key:uni_key,
                      total:rank,
                      value:1}
                      )
              }
              else{
                  if(Number(d[i].ranking)<cutoff){
                    rowTopTenOrder[rowTopTenList.indexOf(d[i].row)].total+=rank;
                    rowTopTenOrder[rowTopTenList.indexOf(d[i].row)].value+=1}


              }
          }

            // Create items array
            var items = Object.keys(rowTopTenOrder).map(function(key) {
                return [Number(key), rowTopTenOrder[key].value,rowTopTenOrder[key].total];
            });

            // Sort the array based on the second element


            items.sort(function(first, second) {
                return second[1] - first[1];
            });

            items.sort(function(a,b){
                if (a[1]!=b[1]){
              return (b[1]-a[1]);
             } else {
              return (a[2]-b[2]);
             }
             });
            // Create a new array with only the first 5 items
            //console.log(items.slice(0, 25));
            var sorted_array = []
            for (var j in items){
                sorted_array.push(items[j][0])
            }
          return sorted_array
            };


       var RankingTopFifteen = rankingOrder(data,highlightlimit);
       // when the input range changes update value



      var rowLabels = svg.append("g")
          .selectAll(".rowLabelg")
          .data(rowLabel)
          .enter()
          .append("text")
          .text(function (d) { return d; })
          .attr("x", 0)
          .attr("y", function (d, i) { return hcrow.indexOf(i+1) * cellSize; })
          .style("text-anchor", "end")
          .attr("transform", "translate(-6," + cellSize / 1.5 + ")")
          .attr("class", function (d,i) { return "rowLabel mono r"+i;} )
          .style("font-size", isMobile ? mobileFont : isTablet ? tabletFont : desktopFont)
          .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
          .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);})
          .on("click", function(d,i) {rowSortOrder=!rowSortOrder; sortbylabel("r",i,rowSortOrder,1500);
          d3.selectAll(".rowLabel").classed("row-click",false);
          d3.select(this).classed("row-click",true);
          d3.select("#order").property("selectedIndex", 0).node().focus();})
          ;

      var colLabels = svg.append("g")
          .selectAll(".colLabelg")
          .data(colLabel)
          .enter()
          .append("text")
          .text(function (d) { return d; })
          .style("fill", function(d) { return color_cols(colgroup[d]); })
          .attr("x", 0)
          .attr("y", function (d, i) { return hccol.indexOf(i+1) * cellSize; })
          .style("text-anchor", "left")
          .attr("transform", "translate("+cellSize/2 + ",-6) rotate (-90)")
          .attr("class",  function (d,i) { return "colLabel mono c"+i;} )
          .style("font-size", isMobile ? mobileFont : isTablet ? tabletFont : desktopFont)
          .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
          .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);})
          .on("click", function(d,i) {colSortOrder=!colSortOrder;  sortbylabel("c",i,colSortOrder,1500);
          d3.selectAll(".colLabel").classed("col-click",false);
          d3.select(this).classed("col-click",true);
          d3.select("#order").property("selectedIndex", 0).node().focus();}
          )
          ;



      var heatMap = svg.append("g").attr("class","g3")
            .selectAll(".cellg")
          .data(data,function(d){return d.row+":"+d.col;});
      var heatMapUpdate = heatMap;


            //.data(data,function(d){return d.row+":"+d.col;})
            var heatRect = heatMap.enter()
            .append("rect")

                heatRect
            .attr("x", function(d) { return hccol.indexOf(d.col) * cellSize; })
            .attr("y", function(d) { return hcrow.indexOf(d.row) * cellSize; })
            .attr("class", function(d){return "cell cell-border cr"+(d.row-1)+" cc"+(d.col-1);})
            .attr("width", cellSize)
            .attr("height", cellSize)
            .style("fill", function(d) { return colorScale(d.value); })
            .style("opacity",.9 );

              //svg.select('g .g3').selectAll(".cellg").data(data,function(d){return d.row+":"+d.col;}).enter()
             heatMap.enter().append("text")
            .attr("x", function(d) { return hccol.indexOf(d.col) * cellSize+cellSize/4; })
            .attr("y", function(d) { return hcrow.indexOf(d.row) * cellSize+cellSize*(3/4); })
                 .attr("class", function(d){return "cell cell-contents cr"+(d.row-1)+" cc"+(d.col-1);})
                 .style('text-align','center')
                 .style("font-size", function(d) {
                    if (isMobile) {
                        return mobileFont; // Further reduce for mobile
                    } else if (isTablet) {
                        return tabletFont; // Medium font for tablets
                    } else if (d.ranking <= highlightlimit) {
                        return "10pt";  // Larger for high-ranking items
                    } else if (d.ranking < 99) {
                        return "8pt";   // Medium size
                    }
                    return "7pt";  // Default size for low-ranking items
                })
                //.attr("dy", ".35em")
              .text(function(d){
                  if(d.ranking==999 ){return ""} return d.ranking})
            /* .on("click", function(d) {
                   var rowtext=d3.select(".r"+(d.row-1));
                   if(rowtext.classed("text-selected")==false){
                       rowtext.classed("text-selected",true);
                   }else{
                       rowtext.classed("text-selected",false);
                   }
            })*/
            .on("mouseover", function(d){
                   //highlight text
                   d3.select(this).classed("cell-hover",true);
                   d3.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ return ri==(d.row-1);});
                   d3.selectAll(".colLabel").classed("text-highlight",function(c,ci){ return ci==(d.col-1);});

                   //Update the tooltip position and value
                   d3.select("#tooltip")
                     .style("left", width+margin.left+50 + "px")
                     .style("top", '250px' )//(d3.event.pageY-10) + "px")
                     .select("#value")
                     .html("<p style='text-align:left;font-size:14pt;color:black'>"+rowLabel[d.row-1]+"</p>" +
                         "<p style='text-align:left;font-size:12pt;color:black'>"+colLabel[d.col-1]+"</p>"+
                         "<p style='text-align:left;font-size:11pt;color:black'>2016:&nbsp;&nbsp;"+d.rank_2016+"<br>" +
                         "2015:&nbsp;&nbsp;"+d.rank_2015+"<br>" +
                         "2014:&nbsp;&nbsp;"+d.rank_2014+"<br>" +
                         "2013:&nbsp;&nbsp;"+d.rank_2013+"<br>" +
                         "2012:&nbsp;&nbsp;"+d.rank_2012+"</p>");
                   //Show the tooltip
                   d3.select("#tooltip").classed("hidden", false);
            })
            .on("mouseout", function(){
                   d3.select(this).classed("cell-hover",false);
                   d3.selectAll(".rowLabel").classed("text-highlight",false);
                   d3.selectAll(".colLabel").classed("text-highlight",false);
                   d3.select("#tooltip").classed("hidden", true);
            })
            ;

      d3.select("#nValue").on("input", function() {
        update(+this.value);
      });

      function update(nvalue){
          var newhighlightlimit = nvalue;
          var newRanking =rankingOrder(data,newhighlightlimit)

          var newcolorScale = d3.scale.linear()
          .domain([ 0,newhighlightlimit,newhighlightlimit+1,1000])
          .range([d3.rgb("lightskyblue"), d3.rgb('lightskyblue'),d3.rgb('white'),d3.rgb('white')]);

          heatRect.style("fill", function(d) {return newcolorScale(d.value); });

          heatMap
          .style("font-size", function(d) {
                if (isMobile) {
                    return mobileFont; // Further reduce for mobile
                } else if (isTablet) {
                    return tabletFont; // Medium font for tablets
                } else if (d.ranking <= highlightlimit) {
                    return "10pt";  // Larger for high-ranking items
                } else if (d.ranking < 99) {
                    return "8pt";   // Medium size
                }
                return "7pt";  // Default size for low-ranking items
            })
            .text(function(d){
                  if(d.ranking==999 ){return ""} return d.ranking});
          d3.select("#order").property("selectedIndex", 2).node().focus();

          order('topten',500,newRanking);

          //sortbylabel("r",20,rowSortOrder,0)

      }

    // Change ordering of cells

      function sortbylabel(rORc,i,sortOrder,timevalue){

           var t = svg.transition().duration(timevalue);
           var sort_array=[];
           var sorted; // sorted is zero-based index
           d3.selectAll(".c"+rORc+i)
             .filter(function(ce){
                sort_array.push(ce.value);
              })
           ;
           if(rORc=="r"){ // sort sort_array of a gene
             sorted=d3.range(col_number).sort(function(a,b){ if(sortOrder){ return sort_array[b]-sort_array[a];}else{ return sort_array[a]-sort_array[b];}});
             t.selectAll(".cell")
               .attr("x", function(d) { return sorted.indexOf(d.col-1) * cellSize; })
               ;
             t.selectAll(".cell-contents")
                   .attr("x", function(d) { return sorted.indexOf(d.col-1) * cellSize+cellSize/4; });

             t.selectAll(".colLabel")
              .attr("y", function (d, i) { return sorted.indexOf(i) * cellSize; })
             ;
           }else{ // sort sort_array of a contrast
             sorted=d3.range(row_number).sort(function(a,b){if(sortOrder){ return sort_array[b]-sort_array[a];}else{ return sort_array[a]-sort_array[b];}});
             t.selectAll(".cell")
               .attr("y", function(d) { return sorted.indexOf(d.row-1) * cellSize; })
               ;
             t.selectAll(".cell-contents")
                   .attr("y", function(d) { return sorted.indexOf(d.row-1) * cellSize+cellSize*(3/4); });
             t.selectAll(".rowLabel")
              .attr("y", function (d, i) { return sorted.indexOf(i) * cellSize; })
             ;
           }
      }


      //sortbylabel("r",2,rowSortOrder,0);

      d3.select("#order").on("change",function(){
        order(this.value,1500,RankingTopFifteen);
      });

      function order(value,timelength,RankingTopFifteen){
       if(value=="hclust"){
        var t = svg.transition().duration(timelength);
        t.selectAll(".cell")
          .attr("x", function(d) { return hccol.indexOf(d.col) * cellSize; })
          //.attr("y", function(d) { return hcrow.indexOf(d.row) * cellSize; })
          ;
        t.selectAll(".cell-contents")
            .attr("x", function(d) { return hccol.indexOf(d.col) * cellSize+cellSize*(1/4); })
            //.attr("y", function(d) { return hcrow.indexOf(d.row) * cellSize+cellSize*(3/4); });


       // t.selectAll(".rowLabel")
        //  .attr("y", function (d, i) { return hcrow.indexOf(i+1) * cellSize; })
        //  ;

        t.selectAll(".colLabel")
          .attr("y", function (d, i) { return hccol.indexOf(i+1) * cellSize; })
          ;

       }else if (value=="probecontrast"){
        var t = svg.transition().duration(timelength);
        t.selectAll(".cell")
          .attr("x", function(d) { return (d.col - 1) * cellSize; })
          .attr("y", function(d) { return (d.row - 1) * cellSize; })
          ;
        t.selectAll(".cell-contents")
            .attr("x", function(d) { return (d.col-1) * cellSize+cellSize*(1/4); })
            .attr("y", function(d) { return (d.row-1) * cellSize+cellSize*(3/4); });

        t.selectAll(".rowLabel")
          .attr("y", function (d, i) { return i * cellSize; })
          ;

        t.selectAll(".colLabel")
          .attr("y", function (d, i) { return i * cellSize; })
          ;

       }else if (value=="probe"){
        var t = svg.transition().duration(timelength);
        t.selectAll(".cell")
          .attr("y", function(d) { return (d.row - 1) * cellSize; })
          ;
        t.selectAll(".cell-contents")
            .attr("y", function(d) { return (d.row-1) * cellSize+cellSize*(3/4); });

        t.selectAll(".rowLabel")
          .attr("y", function (d, i) { return i * cellSize; })
          ;
       }else if (value=="contrast"){
        var t = svg.transition().duration(timelength);
        t.selectAll(".cell")
          .attr("x", function(d) { return (d.col - 1) * cellSize; })
          ;
        t.selectAll(".cell-contents")
            .attr("x", function(d) { return (d.col-1) * cellSize+cellSize*(1/4); })
        t.selectAll(".colLabel")
          .attr("y", function (d, i) { return i * cellSize; })
          ;
       }
       else if (value=="topten"){
        var t = svg.transition().duration(timelength);
        t.selectAll(".cell")
          .attr("y", function(d) { return (RankingTopFifteen.indexOf(d.row - 1)) * cellSize; })
          ;
        t.selectAll(".cell-contents")
            .attr("y", function(d) { return (RankingTopFifteen.indexOf(d.row - 1)) * cellSize+cellSize*(3/4); })
        t.selectAll(".rowLabel")
          .attr("y", function (d, i) { return RankingTopFifteen.indexOf(i) * cellSize; })
          ;
       }
      }
      //
      var sa=d3.select(".g3")
          .on("mousedown", function() {
              if( !d3.event.altKey) {
                 d3.selectAll(".cell-selected").classed("cell-selected",false);
                 d3.selectAll(".rowLabel").classed("text-selected",false);
                 d3.selectAll(".colLabel").classed("text-selected",false);
              }
             var p = d3.mouse(this);
             sa.append("rect")
             .attr({
                 rx      : 0,
                 ry      : 0,
                 class   : "selection",
                 x       : p[0],
                 y       : p[1],
                 width   : 1,
                 height  : 1
             })
          })
          .on("mousemove", function() {
             var s = sa.select("rect.selection");

             if(!s.empty()) {
                 var p = d3.mouse(this),
                     d = {
                         x       : parseInt(s.attr("x"), 10),
                         y       : parseInt(s.attr("y"), 10),
                         width   : parseInt(s.attr("width"), 10),
                         height  : parseInt(s.attr("height"), 10)
                     },
                     move = {
                         x : p[0] - d.x,
                         y : p[1] - d.y
                     }
                 ;

                 if(move.x < 1 || (move.x*2<d.width)) {
                     d.x = p[0];
                     d.width -= move.x;
                 } else {
                     d.width = move.x;
                 }

                 if(move.y < 1 || (move.y*2<d.height)) {
                     d.y = p[1];
                     d.height -= move.y;
                 } else {
                     d.height = move.y;
                 }
                 s.attr(d);

                     // deselect all temporary selected state objects
                 d3.selectAll('.cell-selection.cell-selected').classed("cell-selected", false);
                 d3.selectAll(".text-selection.text-selected").classed("text-selected",false);

                 d3.selectAll('.cell').filter(function(cell_d, i) {
                     if(
                         !d3.select(this).classed("cell-selected") &&
                             // inner circle inside selection frame
                         (this.x.baseVal.value)+cellSize >= d.x && (this.x.baseVal.value)<=d.x+d.width &&
                         (this.y.baseVal.value)+cellSize >= d.y && (this.y.baseVal.value)<=d.y+d.height
                     ) {

                         d3.select(this)
                         .classed("cell-selection", true)
                         .classed("cell-selected", true);

                         d3.select(".r"+(cell_d.row-1))
                         .classed("text-selection",true)
                         .classed("text-selected",true);

                         d3.select(".c"+(cell_d.col-1))
                         .classed("text-selection",true)
                         .classed("text-selected",true);
                     }
                 });
             }
          })
          .on("mouseup", function() {
                // remove selection frame
             sa.selectAll("rect.selection").remove();

                 // remove temporary selection marker class
             d3.selectAll('.cell-selection').classed("cell-selection", false);
             d3.selectAll(".text-selection").classed("text-selection",false);
          })
          .on("mouseout", function() {
             if(d3.event.relatedTarget.tagName=='html') {
                     // remove selection frame
                 sa.selectAll("rect.selection").remove();
                     // remove temporary selection marker class
                 d3.selectAll('.cell-selection').classed("cell-selection", false);
                 d3.selectAll(".rowLabel").classed("text-selected",false);
                 d3.selectAll(".colLabel").classed("text-selected",false);
             }
          })
          ;
      //
      //sortbylabel("r",20,rowSortOrder,0)
      //
    });

    });
