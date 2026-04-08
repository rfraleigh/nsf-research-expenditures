// app_2024.js — compact full-viewport layout, abbreviated col labels

var ABBREV_ROW = {
  "Johns Hopkins University":                                                         "Johns Hopkins",
  "University of Pennsylvania":                                                       "U. Pennsylvania",
  "University of California, San Francisco":                                          "UC San Francisco",
  "University of Michigan, Ann Arbor":                                                "U. Michigan",
  "University of Wisconsin-Madison":                                                  "U. Wisconsin",
  "University of California, Los Angeles":                                            "UC Los Angeles",
  "University of California, San Diego":                                              "UC San Diego",
  "University of Washington, Seattle":                                                "U. Washington",
  "Stanford University":                                                              "Stanford",
  "Cornell University":                                                               "Cornell",
  "University of North Carolina at Chapel Hill":                                      "UNC Chapel Hill",
  "Ohio State University":                                                            "Ohio State",
  "Duke University":                                                                  "Duke",
  "University of Maryland":                                                           "U. Maryland",
  "Georgia Institute of Technology":                                                  "Georgia Tech",
  "Yale University":                                                                  "Yale",
  "University of Pittsburgh, Pittsburgh":                                             "U. Pittsburgh",
  "New York University":                                                              "NYU",
  "Harvard University":                                                               "Harvard",
  "Columbia University":                                                              "Columbia",
  "University of Minnesota, Twin Cities":                                             "U. Minnesota",
  "Texas A&M University, College Station and Health Science Center":                  "Texas A&M",
  "University of Texas M. D. Anderson Cancer Center":                                 "UT MD Anderson",
  "Vanderbilt University and Vanderbilt University Medical Center":                   "Vanderbilt",
  "Pennsylvania State University, University Park and Hershey Medical Center":        "Penn State",
  "University of Florida":                                                            "U. Florida",
  "University of Southern California":                                                "USC",
  "Northwestern University":                                                          "Northwestern",
  "Emory University":                                                                 "Emory",
  "Washington University in St. Louis":                                               "Wash. U. St. Louis",
  "University of Texas at Austin":                                                    "UT Austin",
  "University of California, Berkeley":                                               "UC Berkeley",
  "Massachusetts Institute of Technology":                                            "MIT",
  "Icahn School of Medicine at Mount Sinai":                                          "Mt. Sinai (Icahn)",
  "University of Arizona":                                                            "U. Arizona",
  "University of California, Davis":                                                  "UC Davis",
  "Arizona State University":                                                         "Arizona State",
  "Michigan State University":                                                        "Michigan State",
  "Purdue University, West Lafayette":                                                "Purdue",
  "University of Illinois":                                                           "U. Illinois (UIUC)",
  "Indiana University, Bloomington":                                                  "Indiana U.",
  "Baylor College of Medicine":                                                       "Baylor (Med)",
  "University of Texas Southwestern Medical Center":                                  "UT Southwestern",
  "University of Alabama at Birmingham":                                              "U. Alabama (UAB)",
  "Rutgers State University of New Jersey, New Brunswick":                            "Rutgers",
  "University of Virginia, Charlottesville":                                          "U. Virginia",
  "University of Utah":                                                               "U. Utah",
  "Boston University":                                                                "Boston U.",
  "University of Colorado Anschutz Medical Campus":                                   "CU Anschutz",
  "University of Cincinnati":                                                         "U. Cincinnati"
};

// Short column labels — max ~12 chars so headers only need ~100px vertical space
var ABBREV_COL = {
  "Aerospace Eng":               "Aerospace Eng",
  "Bioengineering":              "Bioengineering",
  "Chemical Eng":                "Chemical Eng",
  "Civil Eng":                   "Civil Eng",
  "Electrical Eng":              "Electrical Eng",
  "Industrial & Mfg Eng":       "Industrial & Mfg",
  "Materials Eng":               "Materials Eng",
  "Mechanical Eng":              "Mechanical Eng",
  "Other Eng":                   "Other Eng",
  "Astronomy & Astrophysics":   "Astronomy & Astro",
  "Chemistry":                   "Chemistry",
  "Materials Science":           "Materials Science",
  "Other Physical Sci":         "Other Physical Sci",
  "Physics":                     "Physics",
  "Atmospheric Sci":             "Atmospheric Sci",
  "Geological & Earth Sci":     "Geological & Earth",
  "Ocean Sciences":              "Ocean Sciences",
  "Other Geosciences":          "Other Geosciences",
  "Mathematics & Statistics":   "Math & Statistics",
  "Computer & Info Sciences":   "Computer & Info Sci",
  "Agricultural Sciences":      "Agricultural Sci",
  "Biological & Biomedical Sci":"Bio & Biomedical",
  "Health Sciences":             "Health Sciences",
  "Natural Resources":           "Natural Resources",
  "Other Life Sciences":        "Other Life Sciences",
  "Psychology":                  "Psychology",
  "Anthropology":                "Anthropology",
  "Economics":                   "Economics",
  "Other Social Sciences":      "Other Social Sci",
  "Political Science":           "Political Science",
  "Sociology & Demography":     "Sociology & Demog",
  "Other Sciences":              "Other Sciences",
  "Non-S&E":                     "Non-S&E"
};

function abbrevRow(name) {
  return ABBREV_ROW[name] || name.replace(/^University of /, "U. ");
}
function abbrevCol(name) {
  return ABBREV_COL[name] || name;
}

d3.json("dist/data/data_2024.json", function(error, payload) {
  if (error) { console.error("Failed to load data_2024.json:", error); return; }

  var headers = payload.headers;
  var allData  = payload.rankings;

  var FY2024_ROWS = 50;
  var SKIP_FIELDS = { "All R&D expenditures": true, "Rank": true };

  var y2024ColSet = {};
  allData.forEach(function(d) {
    if (d.row <= FY2024_ROWS && d.y2024 !== undefined && d.y2024 !== 999) {
      y2024ColSet[d.col] = true;
    }
  });
  var y2024Cols = Object.keys(y2024ColSet).map(Number).sort(function(a,b){ return a-b; });
  var fieldNames = headers.field_name;
  y2024Cols = y2024Cols.filter(function(c) { return !SKIP_FIELDS[fieldNames[c-1]]; });

  var rowLabelFull = headers.uni_name.slice(0, FY2024_ROWS);
  var rowLabel     = rowLabelFull.map(abbrevRow);
  var colLabelFull = y2024Cols.map(function(c) { return fieldNames[c-1]; });
  var colLabel     = colLabelFull.map(abbrevCol);
  var colgroup     = headers.field_dict;

  var hcrow = rowLabel.map(function(_,i){ return i+1; });
  var hccol = colLabel.map(function(_,i){ return i+1; });

  var colToPos = {};
  y2024Cols.forEach(function(origCol, posIdx) { colToPos[origCol] = posIdx + 1; });

  var data = [];
  allData.forEach(function(d) {
    if (d.row > FY2024_ROWS || !colToPos[d.col]) return;
    var rank = (d.y2024 !== undefined && d.y2024 !== 999) ? d.y2024 : 999;
    data.push({ row: d.row, col: colToPos[d.col], value: rank, ranking: rank });
  });

  var col_number = colLabel.length;
  var row_number = rowLabel.length;

  // ── Dimensions ─────────────────────────────────────────────────────────────
  var vw = window.innerWidth;
  var vh = window.innerHeight;

  // Topbar is ~56px, footer ~22px
  var TOPBAR_H   = 56;
  var FOOTER_H   = 22;
  var LEFT_MAR   = 132;   // fits "Wash. U. St. Louis" at 9pt mono
  var TOP_MAR    = 110;   // abbreviated col labels rotated → only ~100px needed
  var RIGHT_MAR  = 50;
  var BOT_MAR    = 6;

  var availH = vh - TOPBAR_H - FOOTER_H - TOP_MAR - BOT_MAR;
  var availW = vw - LEFT_MAR - RIGHT_MAR;

  var cellH = Math.floor(availH / row_number);
  var cellW = Math.floor(availW / col_number);
  var cellSize = Math.max(13, Math.min(22, cellH, cellW));

  var width  = cellSize * col_number;
  var height = cellSize * row_number;

  // Font sizes scale with cell
  var rowFont  = cellSize <= 14 ? "7pt"  : cellSize <= 17 ? "8pt"  : "9pt";
  var colFont  = cellSize <= 14 ? "7pt"  : cellSize <= 17 ? "8pt"  : "8.5pt";
  var numFontB = cellSize <= 14 ? "6pt"  : "8pt";   // highlighted (top-N)
  var numFontS = cellSize <= 14 ? "5pt"  : "6.5pt"; // non-highlighted

  // ── Colors ─────────────────────────────────────────────────────────────────
  var highlightlimit = 10;
  function makeColorScale(n) {
    return d3.scale.linear()
      .domain([0, n, n + 1, 1000])
      .range([d3.rgb("lightskyblue"), d3.rgb("lightskyblue"),
              d3.rgb("white"),        d3.rgb("white")]);
  }
  var colorScale = makeColorScale(highlightlimit);
  var color_cols = d3.scale.category10();

  // ── SVG ────────────────────────────────────────────────────────────────────
  var svg = d3.select("#chart")
    .append("svg")
    .attr("width",  width  + LEFT_MAR + RIGHT_MAR)
    .attr("height", height + TOP_MAR  + BOT_MAR)
    .append("g")
    .attr("transform", "translate(" + LEFT_MAR + "," + TOP_MAR + ")");

  // Track last-clicked index per axis; first click = ascending (rank 1 nearest label)
  var lastRowClick = -1, rowSortOrder = false;
  var lastColClick = -1, colSortOrder = false;

  // ── rankingOrder ────────────────────────────────────────────────────────────
  function rankingOrder(d, cutoff) {
    var list = [], ord = [];
    d.forEach(function(cell) {
      var idx = list.indexOf(cell.row);
      if (idx === -1) { list.push(cell.row); ord.push({ total: cell.ranking, value: 1 }); }
      else if (cell.ranking < cutoff) { ord[idx].total += cell.ranking; ord[idx].value += 1; }
    });
    var items = ord.map(function(o,i){ return [i, o.value, o.total]; });
    items.sort(function(a,b){ return a[1]!==b[1] ? b[1]-a[1] : a[2]-b[2]; });
    return items.map(function(x){ return x[0]; });
  }
  var RankingTopN = rankingOrder(data, highlightlimit);

  // ── Row labels ─────────────────────────────────────────────────────────────
  svg.append("g").selectAll(".rowLabelg")
    .data(rowLabel).enter().append("text")
    .text(function(d){ return d; })
    .attr("x", 0)
    .attr("y", function(d,i){ return hcrow.indexOf(i+1) * cellSize; })
    .style("text-anchor", "end")
    .attr("transform", "translate(-5," + cellSize * 0.68 + ")")
    .attr("class", function(d,i){ return "rowLabel mono r"+i; })
    .style("font-size", rowFont)
    .on("mouseover", function(){ d3.select(this).classed("text-hover",true); })
    .on("mouseout",  function(){ d3.select(this).classed("text-hover",false); })
    .on("click", function(d,i){
      rowSortOrder = (lastRowClick === i) ? !rowSortOrder : false;
      lastRowClick = i;
      sortbylabel("r", i, rowSortOrder, 1200);
      d3.selectAll(".rowLabel").classed("row-click", false);
      d3.select(this).classed("row-click", true);
      d3.select("#order").property("selectedIndex", 0).node().focus();
    });

  // ── Column labels ──────────────────────────────────────────────────────────
  function colTransform(i, colPos) {
    var px = colPos * cellSize + cellSize / 2;
    return "rotate(-50," + px + ",-6)";
  }

  svg.append("g").selectAll(".colLabelg")
    .data(colLabel).enter().append("text")
    .text(function(d){ return d; })
    .style("fill", function(d,i){ return color_cols(colgroup[colLabelFull[i]]); })
    .style("text-anchor", "start")
    .attr("x", function(d,i){ return hccol.indexOf(i+1) * cellSize + cellSize/2; })
    .attr("y", -6)
    .attr("transform", function(d,i){ return colTransform(i, hccol.indexOf(i+1)); })
    .attr("class", function(d,i){ return "colLabel mono c"+i; })
    .style("font-size", colFont)
    .on("mouseover", function(){ d3.select(this).classed("text-hover",true); })
    .on("mouseout",  function(){ d3.select(this).classed("text-hover",false); })
    .on("click", function(d,i){
      colSortOrder = (lastColClick === i) ? !colSortOrder : false;
      lastColClick = i;
      sortbylabel("c", i, colSortOrder, 1200);
      d3.selectAll(".colLabel").classed("col-click", false);
      d3.select(this).classed("col-click", true);
      d3.select("#order").property("selectedIndex", 0).node().focus();
    });

  // ── Cells ──────────────────────────────────────────────────────────────────
  var heatMap = svg.append("g").attr("class","g3")
    .selectAll(".cellg")
    .data(data, function(d){ return d.row+":"+d.col; });

  var heatRect = heatMap.enter().append("rect")
    .attr("x", function(d){ return hccol.indexOf(d.col)*cellSize; })
    .attr("y", function(d){ return hcrow.indexOf(d.row)*cellSize; })
    .attr("class", function(d){ return "cell cell-border cr"+(d.row-1)+" cc"+(d.col-1); })
    .attr("width", cellSize).attr("height", cellSize)
    .style("fill", function(d){ return colorScale(d.value); })
    .style("opacity", 0.9);

  var heatText = heatMap.enter().append("text")
    .attr("x", function(d){ return hccol.indexOf(d.col)*cellSize + cellSize*0.5; })
    .attr("y", function(d){ return hcrow.indexOf(d.row)*cellSize + cellSize*0.72; })
    .attr("text-anchor", "middle")
    .attr("class", function(d){ return "cell cell-contents cr"+(d.row-1)+" cc"+(d.col-1); })
    .style("font-size", function(d){ return d.value <= highlightlimit ? numFontB : numFontS; })
    .text(function(d){ return d.value===999 ? "" : d.value; })
    .on("mouseover", function(d){
      d3.select(this).classed("cell-hover", true);
      d3.selectAll(".rowLabel").classed("text-highlight", function(r,ri){ return ri===(d.row-1); });
      d3.selectAll(".colLabel").classed("text-highlight", function(c,ci){ return ci===(d.col-1); });
      d3.select("#tip-uni").text(rowLabelFull[d.row-1]);
      d3.select("#tip-field").text(colLabelFull[d.col-1]);
      d3.select("#tip-rank").text(d.value===999 ? "—" : "#" + d.value + " nationally");
      d3.select("#tooltip").classed("hidden", false);
    })
    .on("mouseout", function(){
      d3.select(this).classed("cell-hover", false);
      d3.selectAll(".rowLabel").classed("text-highlight", false);
      d3.selectAll(".colLabel").classed("text-highlight", false);
      d3.select("#tooltip").classed("hidden", true);
    });

  // ── N input ────────────────────────────────────────────────────────────────
  d3.select("#nValue").on("input", function(){ update(+this.value); });

  function update(nv) {
    var newRanking = rankingOrder(data, nv);
    var cs = makeColorScale(nv);
    heatRect.style("fill", function(d){ return cs(d.value); });
    heatText.style("font-size", function(d){ return d.value <= nv ? numFontB : numFontS; });
    d3.select("#order").property("selectedIndex", 2).node().focus();
    order("topten", 400, newRanking);
  }

  // ── Sort by label ──────────────────────────────────────────────────────────
  function sortbylabel(rORc, i, sortOrder, ms) {
    var t = svg.transition().duration(ms);
    var arr = [];
    d3.selectAll(".c"+rORc+i).filter(function(ce){ arr.push(ce.value); });
    if (rORc==="r") {
      var s = d3.range(col_number).sort(function(a,b){ return sortOrder?arr[b]-arr[a]:arr[a]-arr[b]; });
      t.selectAll(".cell")         .attr("x", function(d){ return s.indexOf(d.col-1)*cellSize; });
      t.selectAll(".cell-contents").attr("x", function(d){ return s.indexOf(d.col-1)*cellSize+cellSize*0.5; });
      t.selectAll(".colLabel")
        .attr("x", function(d,i){ return s.indexOf(i)*cellSize + cellSize/2; })
        .attr("transform", function(d,i){ return colTransform(i, s.indexOf(i)); });
    } else {
      var s = d3.range(row_number).sort(function(a,b){ return sortOrder?arr[b]-arr[a]:arr[a]-arr[b]; });
      t.selectAll(".cell")         .attr("y", function(d){ return s.indexOf(d.row-1)*cellSize; });
      t.selectAll(".cell-contents").attr("y", function(d){ return s.indexOf(d.row-1)*cellSize+cellSize*0.72; });
      t.selectAll(".rowLabel")     .attr("y", function(d,i){ return s.indexOf(i)*cellSize; });
    }
  }

  // ── Order dropdown ─────────────────────────────────────────────────────────
  d3.select("#order").on("change", function(){ order(this.value, 1200, RankingTopN); });

  function order(value, ms, topN) {
    var t = svg.transition().duration(ms);
    if (value==="contrast") {
      t.selectAll(".cell")         .attr("x", function(d){ return (d.col-1)*cellSize; });
      t.selectAll(".cell-contents").attr("x", function(d){ return (d.col-1)*cellSize+cellSize*0.5; });
      t.selectAll(".colLabel")
        .attr("x", function(d,i){ return i*cellSize + cellSize/2; })
        .attr("transform", function(d,i){ return colTransform(i, i); });
    } else if (value==="probe") {
      t.selectAll(".cell")         .attr("y", function(d){ return (d.row-1)*cellSize; });
      t.selectAll(".cell-contents").attr("y", function(d){ return (d.row-1)*cellSize+cellSize*0.72; });
      t.selectAll(".rowLabel")     .attr("y", function(d,i){ return i*cellSize; });
    } else if (value==="topten") {
      t.selectAll(".cell")         .attr("y", function(d){ return topN.indexOf(d.row-1)*cellSize; });
      t.selectAll(".cell-contents").attr("y", function(d){ return topN.indexOf(d.row-1)*cellSize+cellSize*0.72; });
      t.selectAll(".rowLabel")     .attr("y", function(d,i){ return topN.indexOf(i)*cellSize; });
    }
  }

  // ── Drag-to-select ─────────────────────────────────────────────────────────
  var sa = d3.select(".g3")
    .on("mousedown", function(){
      if (!d3.event.altKey) {
        d3.selectAll(".cell-selected").classed("cell-selected",false);
        d3.selectAll(".rowLabel").classed("text-selected",false);
        d3.selectAll(".colLabel").classed("text-selected",false);
      }
      var p = d3.mouse(this);
      sa.append("rect").attr({rx:0,ry:0,class:"selection",x:p[0],y:p[1],width:1,height:1});
    })
    .on("mousemove", function(){
      var s = sa.select("rect.selection");
      if (s.empty()) return;
      var p = d3.mouse(this);
      var dx = {x:+s.attr("x"),y:+s.attr("y"),width:+s.attr("width"),height:+s.attr("height")};
      var mx = p[0]-dx.x, my = p[1]-dx.y;
      if (mx<1||mx*2<dx.width){dx.x=p[0];dx.width-=mx;}else{dx.width=mx;}
      if (my<1||my*2<dx.height){dx.y=p[1];dx.height-=my;}else{dx.height=my;}
      s.attr(dx);
      d3.selectAll(".cell").filter(function(cd){
        return !d3.select(this).classed("cell-selected") &&
          this.x.baseVal.value+cellSize>=dx.x && this.x.baseVal.value<=dx.x+dx.width &&
          this.y.baseVal.value+cellSize>=dx.y && this.y.baseVal.value<=dx.y+dx.height;
      }).each(function(cd){
        d3.select(this).classed("cell-selection",true).classed("cell-selected",true);
        d3.select(".r"+(cd.row-1)).classed("text-selection",true).classed("text-selected",true);
        d3.select(".c"+(cd.col-1)).classed("text-selection",true).classed("text-selected",true);
      });
    })
    .on("mouseup", function(){
      sa.selectAll("rect.selection").remove();
      d3.selectAll(".cell-selection").classed("cell-selection",false);
      d3.selectAll(".text-selection").classed("text-selection",false);
    })
    .on("mouseout", function(){
      var rt = d3.event.relatedTarget;
      var tag = rt ? (rt.tagName||"").toLowerCase() : "";
      if (!rt||tag==="html"||tag==="body"||!d3.select(rt).classed("cell")) {
        sa.selectAll("rect.selection").remove();
        d3.selectAll(".cell-selection").classed("cell-selection",false);
        d3.selectAll(".rowLabel").classed("text-selected",false);
        d3.selectAll(".colLabel").classed("text-selected",false);
      }
    });

}); // end d3.json
