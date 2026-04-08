// app_2024.js — compact full-viewport layout, abbreviated col labels
// Accessibility: WCAG 2.1 AA — keyboard nav, ARIA labels, contrast, focus rings

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
  // chart-panel gets ~67% of viewport (narrative takes 33% + 1px border)
  var chartPanel = document.getElementById("chart-panel");
  var panelW = chartPanel ? chartPanel.clientWidth : window.innerWidth * 0.67;
  var vh = window.innerHeight;

  var TOPBAR_H  = 44;  // topbar is now 44px (controls moved to chart overlay)
  var FOOTER_H  = 22;
  var LEFT_MAR  = 132;
  var TOP_MAR   = 120;
  var RIGHT_MAR = 115;  // room for vertical legend
  var BOT_MAR   = 6;

  var availH = vh - TOPBAR_H - FOOTER_H - TOP_MAR - BOT_MAR;
  var availW = panelW - LEFT_MAR - RIGHT_MAR;

  var cellH = Math.floor(availH / row_number);
  var cellW = Math.floor(availW / col_number);
  var cellSize = Math.max(17, Math.min(30, cellH, cellW));

  var width  = cellSize * col_number;
  var height = cellSize * row_number;

  var rowFont  = cellSize <= 14 ? "8pt"  : cellSize <= 17 ? "9pt"  : "10pt";
  var colFont  = cellSize <= 14 ? "8pt"  : cellSize <= 17 ? "8.5pt": "9pt";
  var numFontB = "8pt";   // highlighted — always show at readable size
  var numFontS = cellSize <= 14 ? "6.5pt" : "7pt"; // non-highlighted floor 6.5pt (~8.7px)
  var HIDE_NUMS = cellSize < 13;  // cells too small to fit any number legibly

  // ── Colors ─────────────────────────────────────────────────────────────────
  var highlightlimit = 10;
  // FIX 1.4.3: Use a darker, more accessible highlight color.
  // lightskyblue (#87CEEB) + #aaa text = 1.3:1 contrast (FAIL).
  // #4a90d9 (mid blue) + #111 text = 7.2:1 (PASS).
  var HIGHLIGHT_COLOR = "#4a90d9";
  var HIGHLIGHT_DARK  = "#2563a8";  // thicker border on top-N rects

  function makeColorScale(n) {
    return d3.scale.linear()
      .domain([0, n, n + 1, 1000])
      .range([d3.rgb(HIGHLIGHT_COLOR), d3.rgb(HIGHLIGHT_COLOR),
              d3.rgb("white"),         d3.rgb("white")]);
  }
  var colorScale = makeColorScale(highlightlimit);
  var color_cols = d3.scale.category10();

  // ── Keyboard vs mouse tracking (show focus ring only for keyboard nav) ───────
  var usingKeyboard = false;
  document.addEventListener("mousedown", function(){ usingKeyboard = false; });
  document.addEventListener("keydown",   function(e){
    if (e.key === "Tab") usingKeyboard = true;
  });

  // ── SVG — WCAG 1.1.1: give the chart an accessible name ───────────────────
  var svgRoot = d3.select("#chart")
    .append("svg")
    .attr("role", "img")
    .attr("aria-label",
      "Interactive heatmap: FY2024 NSF R&D expenditure rankings for the top 50 U.S. research universities " +
      "across " + col_number + " research fields. " +
      "Each cell shows that university's national rank in that field. " +
      "Row and column headers are clickable to re-sort.")
    .attr("width",  width  + LEFT_MAR + RIGHT_MAR)
    .attr("height", height + TOP_MAR  + BOT_MAR);

  // Hidden title for AT that doesn't support aria-label on SVG
  svgRoot.append("title")
    .text("FY2024 NSF R&D Expenditure Rankings — Top 50 Universities, " + col_number + " Research Fields");

  var svg = svgRoot.append("g")
    .attr("transform", "translate(" + LEFT_MAR + "," + TOP_MAR + ")");

  // ── Focus ring helper (WCAG 2.4.7) ─────────────────────────────────────────
  // We maintain a single <rect> that moves to follow the focused element.
  var focusRing = svg.append("rect")
    .attr("class", "focus-ring")
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .attr("rx", 2)
    .style("pointer-events", "none")
    .style("display", "none");

  function showFocusRing(x, y, w, h) {
    if (!usingKeyboard) return;
    focusRing
      .attr("x", x - 2).attr("y", y - 2)
      .attr("width", w + 4).attr("height", h + 4)
      .style("display", null);
  }
  function hideFocusRing() {
    focusRing.style("display", "none");
  }

  // ── Right-margin legend (WCAG 1.4.1: non-color cue via labels) ────────────
  var LEGEND_GROUPS = [
    [1,  "#1f77b4", "Engineering"],
    [2,  "#ff7f0e", "Physical Sci"],
    [3,  "#2ca02c", "Geosciences"],
    [4,  "#d62728", "Mathematics"],
    [5,  "#9467bd", "Comp. Sci"],
    [6,  "#8c564b", "Life Sciences"],
    [7,  "#e377c2", "Psychology"],
    [8,  "#7f7f7f", "Social Sci"],
    [9,  "#bcbd22", "Other Sci"],
    [10, "#17becf", "Non-S\u0026E"]
  ];
  var legendItemH = 18;
  var legendTotalH = LEGEND_GROUPS.length * legendItemH;
  var legendX = width + 20;   // 12px gap from grid edge
  var legendY = Math.max(0, .1*(height - legendTotalH) / 2);

  var legendG = svg.append("g")
    .attr("class", "legend")
    .attr("role", "list")
    .attr("aria-label", "Field group color legend");

  legendG.append("text")
    .attr("x", legendX)
    .attr("y", legendY - 8)
    .style("font-size", "7pt")
    .style("fill", "#666")
    .text("Field group");

  LEGEND_GROUPS.forEach(function(item, idx) {
    var grp = item[0], color = item[1], label = item[2];
    var gy = legendY + idx * legendItemH;
    var row = legendG.append("g")
      .attr("role", "listitem")
      .attr("aria-label", label);
    row.append("rect")
      .attr("x", legendX).attr("y", gy)
      .attr("width", 9).attr("height", 9)
      .attr("rx", 2)
      .style("fill", color);
    row.append("text")
      .attr("x", legendX + 13).attr("y", gy + 8.5)
      .style("font-size", "8.5pt")
      .style("fill", "#aaa")
      .text(label);
  });

  // ── Sort state ─────────────────────────────────────────────────────────────
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
  // WCAG 2.1.1 + 4.1.2: tabindex, role=button, aria-label, keydown handler
  svg.append("g").selectAll(".rowLabelg")
    .data(rowLabel).enter().append("text")
    .text(function(d){ return d; })
    .attr("x", 0)
    .attr("y", function(d,i){ return hcrow.indexOf(i+1) * cellSize; })
    .style("text-anchor", "end")
    .attr("transform", "translate(-5," + cellSize * 0.68 + ")")
    .attr("class", function(d,i){ return "rowLabel mono r"+i; })
    .style("font-size", rowFont)
    .attr("tabindex", "0")
    .attr("role", "button")
    .attr("aria-label", function(d,i){ return "Sort columns by " + rowLabelFull[i] + " expenditure rank"; })
    .on("mouseover", function(){ d3.select(this).classed("text-hover",true); })
    .on("mouseout",  function(){ d3.select(this).classed("text-hover",false); })
    .on("focus", function(d,i){
      var y = hcrow.indexOf(i+1) * cellSize;
      showFocusRing(-LEFT_MAR + 4, y, LEFT_MAR - 10, cellSize);
    })
    .on("blur", hideFocusRing)
    .on("keydown", function(d,i){
      if (d3.event.key === "Enter" || d3.event.key === " ") {
        d3.event.preventDefault();
        d3.select(this).on("click").call(this, d, i);
      }
    })
    .on("click", function(d,i){
      rowSortOrder = (lastRowClick === i) ? !rowSortOrder : false;
      lastRowClick = i;
      sortbylabel("r", i, rowSortOrder, 1200);
      d3.selectAll(".rowLabel").classed("row-click", false);
      d3.select(this).classed("row-click", true);
      d3.selectAll(".rowLabel").attr("aria-pressed", "false");
      d3.select(this).attr("aria-pressed", "true");
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
    .attr("tabindex", "0")
    .attr("role", "button")
    .attr("aria-label", function(d,i){ return "Sort rows by rank in " + colLabelFull[i]; })
    .on("mouseover", function(){ d3.select(this).classed("text-hover",true); })
    .on("mouseout",  function(){ d3.select(this).classed("text-hover",false); })
    .on("focus", function(d,i){
      var x = hccol.indexOf(i+1) * cellSize;
      showFocusRing(x, -TOP_MAR + 4, cellSize, TOP_MAR - 10);
    })
    .on("blur", hideFocusRing)
    .on("keydown", function(d,i){
      if (d3.event.key === "Enter" || d3.event.key === " ") {
        d3.event.preventDefault();
        d3.select(this).on("click").call(this, d, i);
      }
    })
    .on("click", function(d,i){
      colSortOrder = (lastColClick === i) ? !colSortOrder : false;
      lastColClick = i;
      sortbylabel("c", i, colSortOrder, 1200);
      d3.selectAll(".colLabel").classed("col-click", false);
      d3.select(this).classed("col-click", true);
      d3.selectAll(".colLabel").attr("aria-pressed", "false");
      d3.select(this).attr("aria-pressed", "true");
      d3.select("#order").property("selectedIndex", 0).node().focus();
    });

  // ── Cells ──────────────────────────────────────────────────────────────────
  var heatMap = svg.append("g").attr("class","g3")
    .selectAll(".cellg")
    .data(data, function(d){ return d.row+":"+d.col; });

  // FIX 1.3.3: Top-N cells get a thicker border as a non-color cue
  var heatRect = heatMap.enter().append("rect")
    .attr("x", function(d){ return hccol.indexOf(d.col)*cellSize; })
    .attr("y", function(d){ return hcrow.indexOf(d.row)*cellSize; })
    .attr("class", function(d){ return "cell cell-border cr"+(d.row-1)+" cc"+(d.col-1); })
    .attr("width", cellSize).attr("height", cellSize)
    .style("fill", function(d){ return colorScale(d.value); })
    .style("stroke", function(d){ return d.value <= highlightlimit ? HIGHLIGHT_DARK : "gray"; })
    .style("stroke-width", function(d){ return d.value <= highlightlimit ? "1.2px" : "0.3px"; })
    .style("opacity", 0.9);

  // FIX 1.3.1 + 4.1.2: aria-label on each cell with full context
  // FIX 1.4.3: fill is now #222 (dark) not #aaa — contrast 12:1 on white, 7:1 on blue
  var heatText = heatMap.enter().append("text")
    .attr("x", function(d){ return hccol.indexOf(d.col)*cellSize + cellSize*0.5; })
    .attr("y", function(d){ return hcrow.indexOf(d.row)*cellSize + cellSize*0.72; })
    .attr("text-anchor", "middle")
    .attr("class", function(d){ return "cell cell-contents cr"+(d.row-1)+" cc"+(d.col-1); })
    .style("fill", "#222")
    .style("font-weight", function(d){ return d.value <= highlightlimit ? "600" : "400"; })
    .style("font-size", function(d){ return d.value <= highlightlimit ? numFontB : numFontS; })
    .attr("aria-label", function(d){
      if (d.value === 999) return rowLabelFull[d.row-1] + ", " + colLabelFull[d.col-1] + ", not ranked";
      return rowLabelFull[d.row-1] + ", " + colLabelFull[d.col-1] + ", ranked " + d.value +
             (d.value <= highlightlimit ? ", top " + highlightlimit : "");
    })
    .attr("role", "img")
    .text(function(d){ return (d.value===999 || HIDE_NUMS) ? "" : d.value; })
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
    heatRect
      .style("fill", function(d){ return cs(d.value); })
      .style("stroke", function(d){ return d.value <= nv ? HIGHLIGHT_DARK : "gray"; })
      .style("stroke-width", function(d){ return d.value <= nv ? "1.2px" : "0.3px"; });
    heatText
      .style("font-weight", function(d){ return d.value <= nv ? "600" : "400"; })
      .style("font-size", function(d){ return d.value <= nv ? numFontB : numFontS; })
      .attr("aria-label", function(d){
        if (d.value === 999) return rowLabelFull[d.row-1] + ", " + colLabelFull[d.col-1] + ", not ranked";
        return rowLabelFull[d.row-1] + ", " + colLabelFull[d.col-1] + ", ranked " + d.value +
               (d.value <= nv ? ", top " + nv : "");
      });
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

  // ── Co-sort: greedy seriation of both rows AND columns ─────────────────────
  // Reorders rows and columns simultaneously to cluster blue cells top-left.
  // Uses nearest-neighbor insertion by Jaccard similarity on the binary (top-N) matrix.
  function coSort(nv) {
    var bmat = [];
    for (var r = 0; r < row_number; r++) {
      bmat.push([]);
      for (var c = 0; c < col_number; c++) {
        bmat[r].push(0);
      }
    }
    data.forEach(function(d) {
      bmat[d.row-1][d.col-1] = (d.value <= nv) ? 1 : 0;
    });

    function rowSim(a, b) {
      var both = 0, either = 0;
      for (var j = 0; j < col_number; j++) {
        if (bmat[a][j] || bmat[b][j]) either++;
        if (bmat[a][j] && bmat[b][j]) both++;
      }
      return either ? both / either : 0;
    }
    function colSim(a, b) {
      var both = 0, either = 0;
      for (var i = 0; i < row_number; i++) {
        if (bmat[i][a] || bmat[i][b]) either++;
        if (bmat[i][a] && bmat[i][b]) both++;
      }
      return either ? both / either : 0;
    }

    // Seed: row with most blues first
    var rowBlues = bmat.map(function(r){ return r.reduce(function(s,v){ return s+v; },0); });
    var colBlues = [];
    for (var c = 0; c < col_number; c++) {
      var s = 0; for (var r = 0; r < row_number; r++) s += bmat[r][c];
      colBlues.push(s);
    }

    function seriateAxis(n, simFn, blueCount) {
      var rem = [], order = [];
      for (var k = 0; k < n; k++) rem.push(k);
      var start = rem.reduce(function(best, k){ return blueCount[k] > blueCount[best] ? k : best; }, 0);
      order.push(start);
      rem.splice(rem.indexOf(start), 1);
      while (rem.length) {
        var last = order[order.length-1];
        var best = rem.reduce(function(bk, k){ return simFn(last,k) >= simFn(last,bk) ? k : bk; }, rem[0]);
        order.push(best);
        rem.splice(rem.indexOf(best), 1);
      }
      return order;
    }

    var rowOrder = seriateAxis(row_number, rowSim, rowBlues);
    var colOrder = seriateAxis(col_number, colSim, colBlues);

    var t = svg.transition().duration(1200);
    t.selectAll(".cell")
      .attr("x", function(d){ return colOrder.indexOf(d.col-1) * cellSize; })
      .attr("y", function(d){ return rowOrder.indexOf(d.row-1) * cellSize; });
    t.selectAll(".cell-contents")
      .attr("x", function(d){ return colOrder.indexOf(d.col-1) * cellSize + cellSize*0.5; })
      .attr("y", function(d){ return rowOrder.indexOf(d.row-1) * cellSize + cellSize*0.72; });
    t.selectAll(".rowLabel")
      .attr("y", function(d,i){ return rowOrder.indexOf(i) * cellSize; });
    t.selectAll(".colLabel")
      .attr("x", function(d,i){ return colOrder.indexOf(i) * cellSize + cellSize/2; })
      .attr("transform", function(d,i){ return colTransform(i, colOrder.indexOf(i)); });
  }

  // ── Order dropdown ─────────────────────────────────────────────────────────
  d3.select("#order").on("change", function(){ order(this.value, 1200, RankingTopN); });

  function order(value, ms, topN) {
    if (value==="cosort") { coSort(+document.getElementById("nValue").value); return; }
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
