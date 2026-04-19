// app_all_years.js — multi-year heatmap; year dropdown switches the dataset
// Maintains all functionality from app_2024_v2.js, plus year-switching.
// Data source: dist/data/data_all_years.json  (built by build_all_years_json.py)

var ABBREV_ROW = {
  // ── Explicit top-50 overrides ──────────────────────────────────────────────
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
  "Washington University in St. Louis":                                               "WashU St. Louis",
  "University of Texas at Austin":                                                    "UT Austin",
  "University of California, Berkeley":                                               "UC Berkeley",
  "Massachusetts Institute of Technology":                                            "MIT",
  "Icahn School of Medicine at Mount Sinai":                                          "Mt. Sinai (Icahn)",
  "University of Arizona":                                                            "U. Arizona",
  "University of California, Davis":                                                  "UC Davis",
  "Arizona State University":                                                         "Arizona State",
  "Michigan State University":                                                        "Michigan State",
  "Purdue University, West Lafayette":                                                "Purdue",
  "University of Illinois":                                                           "U. Illinois",
  "Indiana University, Bloomington":                                                  "Indiana U.",
  "Baylor College of Medicine":                                                       "Baylor (Med)",
  "University of Texas Southwestern Medical Center":                                  "UT Southwestern",
  "University of Alabama at Birmingham":                                              "U. Alabama (UAB)",
  "Rutgers State University of New Jersey, New Brunswick":                            "Rutgers (NB)",
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
  if (ABBREV_ROW[name]) return ABBREV_ROW[name];
  var trunc = function(s) { return s.length > 17 ? s.slice(0, 16) + "\u2026" : s; };
  var m;

  // ── Well-known single-name overrides ───────────────────────────────────────
  if (name === "California Institute of Technology") return "Caltech";
  if (name === "Virginia Polytechnic Institute and State University") return "Virginia Tech";
  if (name === "New Jersey Institute of Technology") return "NJIT";
  if (/^Indiana University-Purdue University,?\s*Indianapolis/.test(name)) return "IUPUI";
  if (/^Indiana University-Purdue University,?\s*Fort Wayne/.test(name)) return "IPFW";
  if (/^North Carolina A&T|^North Carolina Agricultural and Technical/.test(name)) return "NC A&T";
  if (/^Icahn School of Medicine/.test(name)) return "Mt. Sinai (Icahn)";
  if (/^University of Texas Southwestern/.test(name)) return "UT Southwestern";

  // Columbia branches (main "Columbia University" handled by ABBREV_ROW)
  m = name.match(/^Columbia University,?\s*(.+)$/);
  if (m) return trunc("Columbia " + m[1].trim());

  // ── Multi-campus system prefixes ───────────────────────────────────────────

  // UC campuses → "UC Irvine", "UC Santa Barbara", etc.
  m = name.match(/^University of California,\s*(.+)$/);
  if (m) return trunc("UC " + m[1].replace(/ University$/, "").trim());

  // SUNY campuses → "SUNY Buffalo", "SUNY Stony Brook", etc.
  m = name.match(/^State University of New York[, ]+(.+)$/);
  if (m) {
    var c = m[1]
      .replace(/^University at /, "").replace(/^College of /, "")
      .replace(/^College at /, "").replace(/^College, /, "")
      .replace(/ University$/, "").replace(/ College$/, "").trim();
    return trunc("SUNY " + c);
  }

  // CSU campuses → "Cal State Long Beach", etc.
  m = name.match(/^California State University,\s*(.+)$/);
  if (m) return trunc("Cal State " + m[1].trim());

  // Cal Poly campuses → "Cal Poly San Luis…", "Cal Poly Humboldt", etc.
  m = name.match(/^California (?:Polytechnic|State Polytechnic) (?:State )?University[,\s]+(.+)$/);
  if (m) return trunc("Cal Poly " + m[1].trim());

  // Texas A&M campuses → "TX A&M Kingsville", etc.
  m = name.match(/^Texas A&M University[-,]\s*(?!College Station)(.+)$/);
  if (m) return trunc("TX A&M " + m[1].replace(/ and Health Science Center$/, "").trim());

  // LSU campuses → "LSU Baton Rouge", "LSU HSC Shreveport", etc.
  m = name.match(/^Louisiana State University,\s*(.+)$/);
  if (m) {
    var c = m[1].replace(/Health Sciences? Center[, -]*/i, "HSC ").replace(/, .+$/, "").trim();
    return trunc("LSU " + c);
  }

  // Penn State campuses → "Penn State Behrend", etc.
  m = name.match(/^Pennsylvania State University,\s*(.+)$/);
  if (m) return trunc("Penn State " + m[1].trim());

  // Purdue campuses → "Purdue Northwest", etc.
  m = name.match(/^Purdue University,\s*(?!West Lafayette)(.+)$/);
  if (m) return trunc("Purdue " + m[1].trim());

  // CUNY campuses → "CUNY Hunter", "CUNY Grad Center", etc.
  m = name.match(/^City University of New York[, ]+(.+)$/);
  if (m) {
    var c = m[1].replace(/, .+$/, "").replace(/ ?(University|College|Center|School|Office)$/, "").trim();
    return trunc("CUNY " + c);
  }

  // UPR campuses → "UPR Mayaguez", etc.
  m = name.match(/^University of Puerto Rico\s+at\s+(.+)$/);
  if (m) return trunc("UPR " + m[1].trim());

  // Rutgers campuses → "Rutgers Newark", "Rutgers Camden"
  m = name.match(/^Rutgers State University of New Jersey,\s*(.+)$/);
  if (m) return trunc("Rutgers " + m[1].trim());

  // Indiana University campuses → "Indiana U. South Bend"
  m = name.match(/^Indiana University,\s*(.+)$/);
  if (m) return trunc("Indiana U. " + m[1].trim());

  // University of Michigan campuses → "U. Michigan Dearborn"
  m = name.match(/^University of Michigan,\s*(.+)$/);
  if (m) return trunc("U. Michigan " + m[1].trim());

  // University of Washington campuses
  m = name.match(/^University of Washington,\s*(.+)$/);
  if (m) return trunc("U. Washington " + m[1].trim());

  // University of Maryland campuses
  m = name.match(/^University of Maryland,\s*(.+)$/);
  if (m) return trunc("U. Maryland " + m[1].trim());

  // University of Minnesota campuses
  m = name.match(/^University of Minnesota,\s*(.+)$/);
  if (m) return trunc("U. Minnesota " + m[1].trim());

  // University of Missouri campuses
  m = name.match(/^University of Missouri,\s*(.+)$/);
  if (m) return trunc("U. Missouri " + m[1].trim());

  // University of Tennessee campuses
  m = name.match(/^University of Tennessee,\s*(.+)$/);
  if (m) {
    var c = m[1].replace(/Institute of Agriculture/, "Ag.").replace(/Health Science Center/, "HSC").trim();
    return trunc("U. Tennessee " + c);
  }

  // UMass campuses
  m = name.match(/^University of Massachusetts\s+(.+)$/);
  if (m) return trunc("UMass " + m[1].replace(/Medical School/, "Med.").trim());

  // UT campuses (catches Health Science Centers, at Dallas, at El Paso, etc.)
  m = name.match(/^University of Texas\s+(?:at\s+|Health Science Center at\s+)?(.+)$/);
  if (m) return trunc("UT " + m[1].trim());

  // University of Colorado campuses
  m = name.match(/^University of Colorado\s+(.+)$/);
  if (m) return trunc("U. Colorado " + m[1].trim());

  // UNC campuses
  m = name.match(/^University of North Carolina\s+(?:at\s+)?(.+)$/);
  if (m) return trunc("UNC " + m[1].trim());

  // University of South Carolina campuses
  m = name.match(/^University of South Carolina,\s*(.+)$/);
  if (m) return trunc("USC " + m[1].trim());

  // USF campuses
  m = name.match(/^University of South Florida\s*[,\s]+(.+)$/);
  if (m) return trunc("USF " + m[1].trim());

  // University of Nevada campuses
  m = name.match(/^University of Nevada,\s*(.+)$/);
  if (m) return trunc("U. Nevada " + m[1].trim());

  // University of Oklahoma campuses
  m = name.match(/^University of Oklahoma(?:,\s*|\s+)(.+)$/);
  if (m) return trunc("U. Oklahoma " + m[1].replace(/Norman and /, "").trim());

  // University of Louisiana campuses
  m = name.match(/^University of Louisiana at\s+(.+)$/);
  if (m) return trunc("U. Louisiana " + m[1].trim());

  // University of North Texas campuses
  m = name.match(/^University of North Texas[, ]+(.+)$/);
  if (m) return trunc("UNT " + m[1].trim());

  // Colorado State campuses
  m = name.match(/^Colorado State University,\s*(.+)$/);
  if (m) return trunc("Colorado State " + m[1].trim());

  // Auburn campuses
  m = name.match(/^Auburn University,\s*(.+)$/);
  if (m) return trunc("Auburn " + m[1].trim());

  // Oklahoma State campuses
  m = name.match(/^Oklahoma State University,\s*(.+)$/);
  if (m) return trunc("OK State " + m[1].replace(/Center for Health Sciences.*/, "HSC").trim());

  // Southern Illinois campuses
  m = name.match(/^Southern Illinois University,\s*(.+)$/);
  if (m) return trunc("SIU " + m[1].trim());

  // Loyola campuses
  m = name.match(/^Loyola University\s+(.+)$/);
  if (m) return trunc("Loyola " + m[1].trim());

  // Southern University campuses
  m = name.match(/^Southern University\s+(?:and\s+)?(.+)$/);
  if (m) return trunc("Southern U. " + m[1].replace(/A&M College,?\s*/, "").trim());

  // Touro campuses
  m = name.match(/^Touro University,\s*(.+)$/);
  if (m) return trunc("Touro " + m[1].trim());

  // Universidad Ana G. Mendez campuses
  m = name.match(/^Universidad Ana G\. Mendez,\s*(.+)$/);
  if (m) return trunc("UAGM " + m[1].trim());

  // Texas Tech Health campuses
  m = name.match(/^Texas Tech University Health Sciences? Center[, ]*(.*)$/);
  if (m) return trunc("TX Tech HSC" + (m[1] ? " " + m[1].trim() : ""));

  // ── Generic fallback ───────────────────────────────────────────────────────
  var s = name
    .replace(/^University of /, "U. ")
    .replace(/ University(,.*)?$/, "")
    .replace(/ Institute of Technology$/, " Tech")
    .replace(/ College of Medicine$/, " (Med)")
    .replace(/, .*$/, "");
  return s.length > 17 ? s.slice(0, 16) + "\u2026" : s;
}
function abbrevCol(name) {
  return ABBREV_COL[name] || name;
}

d3.json("dist/data/data_all_years_750.json", function(error, payload) {
  if (error) { console.error("Failed to load data_all_years.json:", error); return; }

  var headers     = payload.headers;
  var allData     = payload.rankings;
  var availYears  = headers.years;           // e.g. ["2012","2013",…,"2024"]
  var latestYear  = headers.latest_year;

  // ── Year state ─────────────────────────────────────────────────────────────
  var currentYear    = latestYear;
  var currentYearKey = "y" + currentYear;
  var currentOrderMode = "contrast";   // tracks last global order applied

  var DISPLAY_ROWS = 250;                       // rendered rows (no scroll)
  var FULL_ROWS    = headers.uni_name.length;  // all rows in dataset (e.g. 250)
  var SKIP_FIELDS  = { "All R&D expenditures": true, "Rank": true };

  // ── Column set: any column with a real value for the top DISPLAY_ROWS in ANY year.
  // Scoped to DISPLAY_ROWS so sparse fields in institutions 51-250 don't force
  // extra columns into the visible grid.
  var displayColSet = {};
  allData.forEach(function(d) {
    if (d.row > DISPLAY_ROWS) return;
    availYears.forEach(function(yr) {
      var v = d["y" + yr];
      if (v !== undefined && v !== 999) { displayColSet[d.col] = true; }
    });
  });
  var displayCols  = Object.keys(displayColSet).map(Number).sort(function(a,b){ return a-b; });
  var fieldNames   = headers.field_name;
  displayCols = displayCols.filter(function(c) { return !SKIP_FIELDS[fieldNames[c-1]]; });

  var rowLabelFull = headers.uni_name.slice(0, DISPLAY_ROWS);
  var rowLabel     = rowLabelFull.map(abbrevRow);
  var colLabelFull = displayCols.map(function(c) { return fieldNames[c-1]; });
  var colLabel     = colLabelFull.map(abbrevCol);
  var colgroup     = headers.field_dict;

  var hcrow = rowLabel.map(function(_,i){ return i+1; });
  var hccol = colLabel.map(function(_,i){ return i+1; });

  // Map original col index → display position (1-based)
  var colToPos = {};
  displayCols.forEach(function(origCol, posIdx) { colToPos[origCol] = posIdx + 1; });

  var col_number = colLabel.length;
  var row_number = rowLabel.length;

  // ── Build data arrays ───────────────────────────────────────────────────────
  // allDataIndex: (row, posCol) → raw JSON record — for resolving _src on all rows
  var allDataIndex = {};
  allData.forEach(function(d) {
    if (colToPos[d.col]) {
      allDataIndex[d.row + ":" + colToPos[d.col]] = d;
    }
  });

  // fullData: all FULL_ROWS × col_number — used only for sort computation.
  // fullDataByInst[row][posCol] → same entry (O(1) lookup when swapping display rows).
  var fullData = [];
  var fullDataByInst = {};
  for (var ri = 1; ri <= FULL_ROWS; ri++) {
    fullDataByInst[ri] = {};
    displayCols.forEach(function(origCol) {
      var posCol = colToPos[origCol];
      var src    = allDataIndex[ri + ":" + posCol] || null;
      var v      = src ? src[currentYearKey] : undefined;
      var rank   = (v !== undefined && v !== 999) ? v : 999;
      var entry  = { row: ri, col: posCol, value: rank, ranking: rank, _src: src };
      fullData.push(entry);
      fullDataByInst[ri][posCol] = entry;
    });
  }

  // currentSlotToRow: maps display slot index (0-based) → actual institution row (1-based).
  // Initially the top-DISPLAY_ROWS institutions by overall R&D rank.
  var currentSlotToRow = d3.range(1, DISPLAY_ROWS + 1);

  // data: DISPLAY_ROWS × col_number objects bound to SVG elements.
  // Independent from fullData — values are copied in via rebuildDataValues().
  // This lets column-sort swap which institution is in each display slot without
  // touching the DOM or D3 data binding.
  var data = [];
  for (var si = 0; si < DISPLAY_ROWS; si++) {
    displayCols.forEach(function(origCol) {
      var posCol  = colToPos[origCol];
      var fd      = fullDataByInst[si + 1][posCol];
      data.push({
        row: si + 1, col: posCol,
        value:   fd ? fd.value   : 999,
        ranking: fd ? fd.ranking : 999,
        _src:    fd ? fd._src    : null
      });
    });
  }

  // Sync data values from fullData for the current slot-to-row mapping.
  // Called after year switches or institution swaps.
  function rebuildDataValues() {
    for (var si = 0; si < DISPLAY_ROWS; si++) {
      var actualRow = currentSlotToRow[si];
      var instData  = fullDataByInst[actualRow] || {};
      for (var ci = 0; ci < col_number; ci++) {
        var posCol  = ci + 1;
        var idx     = si * col_number + ci;
        var fd      = instData[posCol];
        data[idx].value   = fd ? fd.value   : 999;
        data[idx].ranking = fd ? fd.ranking : 999;
        data[idx]._src    = fd ? fd._src    : null;
      }
    }
  }

  // ── Dimensions ─────────────────────────────────────────────────────────────
  var isMobile   = window.innerWidth <= 768;
  var chartPanel = document.getElementById("chart-panel");
  var panelW = chartPanel ? chartPanel.clientWidth
             : (isMobile ? window.innerWidth : window.innerWidth * 0.67);
  var vh = window.innerHeight;

  var TOPBAR_H      = 44;
  var CTRL_STRIP_H  = 44;           // horizontal control strip below topbar
  var FOOTER_H      = 22;
  var LEFT_MAR      = isMobile ? 80  : 180;  // extra room for sparkline + gap + label
  var TOP_MAR       = isMobile ? 90  : 120;
  var RIGHT_MAR     = isMobile ? 8   : 115;
  var BOT_MAR       = 6;

  var availH = vh - TOPBAR_H - CTRL_STRIP_H - FOOTER_H - TOP_MAR - BOT_MAR;
  var availW = panelW - LEFT_MAR - RIGHT_MAR;

  var cellH = Math.floor(availH / row_number);
  var cellW = isMobile ? 20 : Math.floor(availW / col_number);
  var cellSize = isMobile
    ? Math.max(16, Math.min(22, cellH))
    : Math.max(17, Math.min(30, cellH, cellW));

  var width  = cellSize * col_number;
  var height = cellSize * row_number;

  var rowFont  = isMobile ? "6pt"   : (cellSize <= 14 ? "8pt"   : cellSize <= 17 ? "9pt"   : "10pt");
  var colFont  = isMobile ? "6pt"   : (cellSize <= 14 ? "8pt"   : cellSize <= 17 ? "8.5pt" : "9pt");
  var numFontB = isMobile ? "5.5pt" : "8pt";
  var numFontS = isMobile ? "5pt"   : (cellSize <= 14 ? "6.5pt" : "7pt");
  var HIDE_NUMS = isMobile ? (cellSize < 18) : (cellSize < 13);

  // ── Colors ─────────────────────────────────────────────────────────────────
  var highlightlimit  = 10;
  var HIGHLIGHT_COLOR = "#4a90d9";
  var HIGHLIGHT_DARK  = "#2563a8";

  function makeColorScale(n) {
    return d3.scale.linear()
      .domain([0, n, n + 1, 1000])
      .range([d3.rgb(HIGHLIGHT_COLOR), d3.rgb(HIGHLIGHT_COLOR),
              d3.rgb("white"),         d3.rgb("white")]);
  }
  var colorScale = makeColorScale(highlightlimit);
  var color_cols = d3.scale.category10();

  // ── Dollar-mode state and coloring ───────────────────────────────────────
  //
  // Three modes:
  //   "rank"      — uniform blue for all top-N cells (default)
  //   "dollars"   — 5 absolute dollar bands (<$250M, $250M-$500M, …, ≥$1B)
  //   "rowshare"  — share of the institution's own total R&D going to this field
  //                 (<3%, 3-8%, 8-15%, 15-25%, ≥25%)
  // Source: "both" (fed + nonfed, default), "federal" only, or "nonfederal" only
  var currentMode   = "rank";
  var currentSource = "both";

  // Dollar bands (in thousands of dollars, HERD convention). Lightest → darkest.
  var DOLLAR_BANDS = [
    { max:   250000, color: "#c5d9f1", label: "< $250M" },
    { max:   500000, color: "#8fb4e3", label: "$250M–$500M" },
    { max:   750000, color: "#4a8ed0", label: "$500M–$750M" },
    { max:  1000000, color: "#1565c0", label: "$750M–$1B" },
    { max: Infinity, color: "#0a3d91", label: "≥ $1B" }
  ];

  // Row-share bands (fraction of the institution's total R&D spending going to
  // this field). Same colors as dollar bands for visual consistency; thresholds
  // tuned so typical top-N cells span the 5–25% range with discrimination.
  var ROWSHARE_BANDS = [
    { max: 0.03,      color: "#c5d9f1", label: "< 3%" },
    { max: 0.08,      color: "#8fb4e3", label: "3–8%" },
    { max: 0.15,      color: "#4a8ed0", label: "8–15%" },
    { max: 0.25,      color: "#1565c0", label: "15–25%" },
    { max: Infinity,  color: "#0a3d91", label: "≥ 25%" }
  ];

  // Per-institution totals for the current year/source (denominator for row-share).
  // Keys are 1-based institution row indexes (d._src.row).
  var rowSourceTotals = {};

  function getCellDollars(d, year, source) {
    var src = d._src;
    if (!src) return 0;
    var f = src["f" + year] || 0;
    var n = src["n" + year] || 0;
    if (source === "federal")    return f;
    if (source === "nonfederal") return n;
    return f + n;
  }

  function dollarBandColor(amountK) {
    for (var i = 0; i < DOLLAR_BANDS.length; i++) {
      if (amountK < DOLLAR_BANDS[i].max) return DOLLAR_BANDS[i].color;
    }
    return DOLLAR_BANDS[DOLLAR_BANDS.length - 1].color;
  }

  function rowShareBandColor(frac) {
    for (var i = 0; i < ROWSHARE_BANDS.length; i++) {
      if (frac < ROWSHARE_BANDS[i].max) return ROWSHARE_BANDS[i].color;
    }
    return ROWSHARE_BANDS[ROWSHARE_BANDS.length - 1].color;
  }

  // Compute per-institution denominators for row-share mode.
  // For each institution, sum this year's $ across all fields, respecting source.
  // Called when mode becomes "rowshare" or when year/source changes while in it.
  function computeRowSourceTotals() {
    rowSourceTotals = {};
    for (var ri = 1; ri <= FULL_ROWS; ri++) {
      var total = 0;
      var instCols = fullDataByInst[ri];
      if (!instCols) continue;
      for (var ci = 1; ci <= col_number; ci++) {
        var fd = instCols[ci];
        if (!fd || !fd._src) continue;
        total += getCellDollars({ _src: fd._src }, currentYear, currentSource);
      }
      rowSourceTotals[ri] = total;
    }
  }

  // ── Source-aware rank recomputation ─────────────────────────────────────
  //
  // currentSource is a global data filter. When it changes (or year changes),
  // per-field ranks need to be recomputed. Every downstream consumer (coSort,
  // top-N sort, colors, tooltip) reads d.value — update that, and they all
  // cascade correctly.
  //
  // rankCacheBySource: { yearKey: { instRow: { colIdx: rank } } }
  //   Populated for ALL years on source change, so the tooltip's year-by-year
  //   rank column stays consistent with the active source filter.
  var rankCacheBySource = null;

  // Compute per-field ranks for a given year and source, based on $ amounts.
  // Returns { instRow: { colIdx: rankInt } } (only ranks institutions with > 0 $).
  function computeRanksForYearSource(yr, source) {
    var out = {};
    for (var ci = 1; ci <= col_number; ci++) {
      var pairs = [];
      for (var ri = 1; ri <= FULL_ROWS; ri++) {
        var fd = fullDataByInst[ri] && fullDataByInst[ri][ci];
        if (!fd || !fd._src) continue;
        var amt = getCellDollars({ _src: fd._src }, yr, source);
        if (amt > 0) pairs.push({ row: ri, amt: amt });
      }
      pairs.sort(function(a, b) { return b.amt - a.amt; });
      pairs.forEach(function(p, idx) {
        if (!out[p.row]) out[p.row] = {};
        out[p.row][ci] = idx + 1;
      });
    }
    return out;
  }

  // Recompute ranks for currentYear + currentSource, update fullData[i].value,
  // re-sync display slots, and optionally re-trigger the active sort.
  // Also rebuilds rankCacheBySource for every year so the tooltip shows
  // source-aware ranks across the whole history.
  function recomputeRanksAndSync(triggerSort) {
    // Rebuild per-year rank cache for the current source
    rankCacheBySource = {};
    for (var yi = 0; yi < availYears.length; yi++) {
      var yr = availYears[yi];
      rankCacheBySource[yr] = computeRanksForYearSource(yr, currentSource);
    }

    // Update fullData[].value for the current year: default to 999 then apply cache
    var cur = rankCacheBySource[currentYear] || {};
    for (var ri = 1; ri <= FULL_ROWS; ri++) {
      var instCols = fullDataByInst[ri];
      if (!instCols) continue;
      var instRanks = cur[ri] || {};
      for (var ci = 1; ci <= col_number; ci++) {
        var fd = instCols[ci];
        if (!fd) continue;
        fd.value = instRanks[ci] || 999;
      }
    }

    rebuildDataValues();

    if (triggerSort) {
      if (currentOrderMode === "cosort") {
        coSort(+document.getElementById("nValue").value);
      } else if (currentOrderMode === "topten") {
        var nv = +document.getElementById("nValue").value;
        RankingTopN = rankingOrderForDisplay(nv);
        order("topten", 400, RankingTopN);
      }
      // "contrast" and "custom" are rank-independent (layout-wise) — no re-sort
    }
  }

  // Unified fill function: returns the correct color given current mode/source
  function cellFill(d, nv) {
    // Dollar-based modes color every cell with real data (not just top-N).
    // Top-N is a rank concept; when coloring by $ or institutional share,
    // a rank-#58 field at $170M is still a meaningful chunk of that univ's budget.
    if (d.value !== 999) {
      if (currentMode === "dollars") {
        var amt = getCellDollars(d, currentYear, currentSource);
        return amt > 0 ? dollarBandColor(amt) : "white";
      }
      if (currentMode === "rowshare") {
        var amt2 = getCellDollars(d, currentYear, currentSource);
        var instRow = d._src && d._src.row;
        var rowTot = rowSourceTotals[instRow] || 0;
        return (amt2 > 0 && rowTot > 0)
          ? rowShareBandColor(amt2 / rowTot)
          : "white";
      }
    }
    // "rank" mode (default): top-N blue, else white. Use the live nv param
    // (not the stale module-level colorScale which was baked at init with N=10).
    return (d.value !== 999 && d.value <= nv) ? HIGHLIGHT_COLOR : "white";
  }

  // Format dollars (input in thousands) as compact string: "$1.23B", "$450M", "$12.3M"
  function fmtDollars(amountK) {
    if (!amountK) return "—";
    if (amountK >= 1_000_000)  return "$" + (amountK / 1_000_000).toFixed(2) + "B";
    if (amountK >= 1000)       return "$" + (amountK / 1000).toFixed(0) + "M";
    if (amountK >= 100)        return "$" + (amountK / 1000).toFixed(1) + "M";
    return "$" + amountK + "K";
  }

  // Build the year-by-year tooltip breakdown for a cell (most recent year first).
  // Rank column is source-aware: falls back to JSON's total-R&D rank (_src.y<yr>)
  // when rankCacheBySource hasn't been built yet (initial page load, source=both).
  function buildTipYears(d) {
    var src = d._src;
    if (!src) return "";
    var instRow = src.row;
    var colIdx  = src.col;
    var yearsDesc = availYears.slice().reverse();
    var rows = yearsDesc.map(function(yr) {
      // Source-aware rank lookup
      var rank;
      if (rankCacheBySource && rankCacheBySource[yr] &&
          rankCacheBySource[yr][instRow] &&
          rankCacheBySource[yr][instRow][colIdx]) {
        rank = rankCacheBySource[yr][instRow][colIdx];
      } else {
        // Fallback to JSON's precomputed total-R&D rank (source=both equivalent)
        rank = src["y" + yr];
      }
      var f = src["f" + yr] || 0;
      var n = src["n" + yr] || 0;
      var total = f + n;
      var rankTxt = (rank && rank !== 999) ? "#" + rank : "—";
      var dollarTxt = currentSource === "federal"    ? fmtDollars(f)
                    : currentSource === "nonfederal" ? fmtDollars(n)
                    : fmtDollars(total);
      var active = (yr === currentYear) ? " active" : "";
      return '<div class="yr-row' + active + '">' +
             '<span class="yr-lbl">FY' + yr + '</span>' +
             '<span>' + rankTxt + '  ' + dollarTxt + '</span>' +
             '</div>';
    });
    return rows.join("");
  }

  // ── Keyboard vs mouse tracking ─────────────────────────────────────────────
  var usingKeyboard = false;
  document.addEventListener("mousedown", function(){ usingKeyboard = false; });
  document.addEventListener("keydown",   function(e){
    if (e.key === "Tab") usingKeyboard = true;
  });

  // ── SVG ────────────────────────────────────────────────────────────────────
  var svgRoot = d3.select("#chart")
    .append("svg")
    .attr("role", "img")
    .attr("aria-label",
      "Interactive heatmap: FY" + currentYear + " NSF R&D expenditure rankings for the top 50 " +
      "U.S. research universities across " + col_number + " research fields. " +
      "Each cell shows that university's national rank in that field. " +
      "Row and column headers are clickable to re-sort.")
    .attr("width",  width  + LEFT_MAR + RIGHT_MAR)
    .attr("height", height + TOP_MAR  + BOT_MAR);

  // var svgTitle = svgRoot.append("title")
  //   .text("FY" + currentYear + " NSF R&D Expenditure Rankings — Top 50 Universities, " + col_number + " Research Fields");

  var svg = svgRoot.append("g")
    .attr("transform", "translate(" + LEFT_MAR + "," + TOP_MAR + ")");

  // ── Focus ring ─────────────────────────────────────────────────────────────
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
  function hideFocusRing() { focusRing.style("display", "none"); }

  // ── Right-margin legend (desktop only) ─────────────────────────────────────
  if (!isMobile) {
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
    var legendItemH  = 18;
    var legendTotalH = LEGEND_GROUPS.length * legendItemH;
    var legendX = width + 20;
    var legendY = Math.max(0, 0.1 * (height - legendTotalH) / 2);

    var legendG = svg.append("g")
      .attr("class", "legend")
      .attr("role", "list")
      .attr("aria-label", "Field group color legend");

    legendG.append("text")
      .attr("x", legendX).attr("y", legendY - 8)
      .style("font-size", "7pt").style("fill", "#666")
      .text("Field group");

    LEGEND_GROUPS.forEach(function(item, idx) {
      var color = item[1], label = item[2];
      var gy = legendY + idx * legendItemH;
      var row = legendG.append("g").attr("role", "listitem").attr("aria-label", label);
      row.append("rect")
        .attr("x", legendX).attr("y", gy)
        .attr("width", 9).attr("height", 9).attr("rx", 2)
        .style("fill", color);
      row.append("text")
        .attr("x", legendX + 13).attr("y", gy + 8.5)
        .style("font-size", "8.5pt").style("fill", "#aaa")
        .text(label);
    });

    // Dollar-band legend (hidden unless mode=dollars)
    var dollarLegendY = legendY + LEGEND_GROUPS.length * legendItemH + 20;
    var dollarLegendG = svg.append("g")
      .attr("class", "dollar-legend")
      .attr("role", "list")
      .attr("aria-label", "Dollar band color legend")
      .style("display", "none");

    dollarLegendG.append("text")
      .attr("x", legendX).attr("y", dollarLegendY - 8)
      .style("font-size", "7pt").style("fill", "#666")
      .text("$ band");

    DOLLAR_BANDS.forEach(function(band, idx) {
      var gy = dollarLegendY + idx * legendItemH;
      var row = dollarLegendG.append("g").attr("role", "listitem").attr("aria-label", band.label);
      row.append("rect")
        .attr("x", legendX).attr("y", gy)
        .attr("width", 9).attr("height", 9).attr("rx", 2)
        .style("fill", band.color);
      row.append("text")
        .attr("x", legendX + 13).attr("y", gy + 8.5)
        .style("font-size", "8.5pt").style("fill", "#aaa")
        .text(band.label);
    });

    // Row-share legend (hidden unless mode=rowshare) — shares Y slot with $ legend
    var rowShareLegendG = svg.append("g")
      .attr("class", "rowshare-legend")
      .attr("role", "list")
      .attr("aria-label", "Share of university R&D legend")
      .style("display", "none");

    rowShareLegendG.append("text")
      .attr("x", legendX).attr("y", dollarLegendY - 8)
      .style("font-size", "7pt").style("fill", "#666")
      .text("share of univ R&D");

    ROWSHARE_BANDS.forEach(function(band, idx) {
      var gy = dollarLegendY + idx * legendItemH;
      var row = rowShareLegendG.append("g").attr("role", "listitem").attr("aria-label", band.label);
      row.append("rect")
        .attr("x", legendX).attr("y", gy)
        .attr("width", 9).attr("height", 9).attr("rx", 2)
        .style("fill", band.color);
      row.append("text")
        .attr("x", legendX + 13).attr("y", gy + 8.5)
        .style("font-size", "8.5pt").style("fill", "#aaa")
        .text(band.label);
    });
  }

  // ── Sort state ─────────────────────────────────────────────────────────────
  var lastRowClick = -1, rowSortOrder = false;
  var lastColClick = -1, colSortOrder = false;

  // Scores every row in fullData by count of fields ranked <= cutoff, then
  // returns a compact permutation of [0..DISPLAY_ROWS-1] ordered by that score.
  // Using fullData means institution 51-250 contribute context to the ordering
  // even though only the top DISPLAY_ROWS rows are rendered.
  function rankingOrderForDisplay(cutoff) {
    var scoreByRow = {};
    fullData.forEach(function(cell) {
      var s = scoreByRow[cell.row];
      if (!s) { s = { count: 0, total: 0 }; scoreByRow[cell.row] = s; }
      if (cell.value <= cutoff) { s.count++; s.total += cell.value; }
    });
    var allRowNums = Object.keys(scoreByRow).map(Number);
    allRowNums.sort(function(a, b) {
      var sa = scoreByRow[a], sb = scoreByRow[b];
      return sb.count !== sa.count ? sb.count - sa.count : sa.total - sb.total;
    });
    // Keep only the display rows, preserving their relative order from the full sort
    return allRowNums
      .filter(function(r) { return r <= DISPLAY_ROWS; })
      .map(function(r) { return r - 1; });
  }
  var RankingTopN = rankingOrderForDisplay(highlightlimit);

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
    .attr("tabindex", "0")
    .attr("role", "button")
    .attr("aria-label", function(d,i){ return "Sort columns by " + rowLabelFull[i] + " expenditure rank"; })
    .on("mouseover", function(d, i){
      d3.select(this).classed("text-hover", true);
      d3.select("#tip-uni").text(rowLabelFull[i]);
      d3.select("#tip-field").text("click to sort columns");
      d3.select("#tip-rank").text("");
      d3.select("#tooltip").classed("hidden", false);
    })
    .on("mouseout", function(){
      d3.select(this).classed("text-hover", false);
      d3.select("#tooltip").classed("hidden", true);
    })
    .on("focus", function(d,i){
      showFocusRing(-LEFT_MAR + 4, hcrow.indexOf(i+1) * cellSize, LEFT_MAR - 10, cellSize);
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
      currentOrderMode = "custom";
      sortbylabel("r", i, rowSortOrder, 1200);
      d3.selectAll(".rowLabel").classed("row-click", false);
      d3.select(this).classed("row-click", true);
      d3.selectAll(".rowLabel").attr("aria-pressed", "false");
      d3.select(this).attr("aria-pressed", "true");
      d3.select("#order").property("selectedIndex", 0).node().focus();
    });

  // ── Row sparklines: total R&D per year for each institution ──────────────
  // Positioned in the left margin, to the left of row labels.
  // Layout: [sparkline area] [value label showing active year $]
  var SPARK_W     = 28;                 // sparkline width (narrower to fit value label)
  var SPARK_VAL_W = 22;                 // value label width
  var SPARK_VAL_PAD = 2;                // gap between sparkline and value
  var SPARK_X = -LEFT_MAR + 6;          // sparkline left edge
  var SPARK_H_FRAC = 0.75;              // fraction of cellSize
  var SPARK_GAP = 12;                   // min gap between value-label right edge and row label

  var sparklineLayer = svg.append("g").attr("class", "sparkline-layer");

  function redrawSparklines(slotYfn) {
    // slotYfn(i) returns the current y-position for display slot i
    slotYfn = slotYfn || function(i) { return i * cellSize; };
    sparklineLayer.selectAll("*").remove();
    var uniTotals = headers.uni_totals;
    if (!uniTotals) return;
    var activeIdx = availYears.indexOf(currentYear);
    var sparkH = cellSize * SPARK_H_FRAC;
    var stepX = availYears.length > 1 ? SPARK_W / (availYears.length - 1) : 0;
    var valueX = SPARK_X + SPARK_W + SPARK_VAL_PAD + SPARK_VAL_W;  // right edge of value label

    for (var si = 0; si < DISPLAY_ROWS; si++) {
      var instRow = currentSlotToRow[si];
      if (!instRow) continue;
      var totals = availYears.map(function(yr) {
        var arr = uniTotals["y" + yr];
        return (arr && arr[instRow - 1]) || 0;
      });
      var max = Math.max.apply(null, totals);
      if (!max) continue;

      var yTop = slotYfn(si) + (cellSize - sparkH) / 2;
      var g = sparklineLayer.append("g").attr("class", "spark sp-" + si);

      // Build path
      var pts = totals.map(function(t, i) {
        return [SPARK_X + i * stepX, yTop + sparkH - (t / max) * sparkH];
      });

      // Area under curve
      var areaD = "M" + pts[0][0] + "," + (yTop + sparkH);
      pts.forEach(function(p) { areaD += " L" + p[0] + "," + p[1]; });
      areaD += " L" + pts[pts.length - 1][0] + "," + (yTop + sparkH) + " Z";
      g.append("path")
        .attr("d", areaD)
        .style("fill", "#4a90d9")
        .style("fill-opacity", 0.18)
        .style("stroke", "none");

      // Line
      var lineD = "M" + pts.map(function(p) { return p[0] + "," + p[1]; }).join(" L");
      g.append("path")
        .attr("d", lineD)
        .style("fill", "none")
        .style("stroke", "#4a90d9")
        .style("stroke-opacity", 0.6)
        .style("stroke-width", 0.8);

      // Active-year marker
      if (activeIdx >= 0 && totals[activeIdx] > 0) {
        g.append("circle")
          .attr("cx", pts[activeIdx][0])
          .attr("cy", pts[activeIdx][1])
          .attr("r", 1.8)
          .style("fill", "#ff9800")
          .style("stroke", "#fff")
          .style("stroke-width", 0.5);
      }

      // Active-year value label (Tufte: sparkline endpoint annotation)
      var activeVal = activeIdx >= 0 ? totals[activeIdx] : 0;
      if (activeVal > 0) {
        g.append("text")
          .attr("x", valueX)
          .attr("y", yTop + sparkH * 0.65)
          .attr("text-anchor", "end")
          .style("font-size", "7.5px")
          .style("font-family", "Consolas, monospace")
          .style("fill", "#888")
          .text(fmtDollars(activeVal));
      }
    }
  }

  // Initial draw
  redrawSparklines();

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
    .on("mouseover", function(){ d3.select(this).classed("text-hover", true); })
    .on("mouseout",  function(){ d3.select(this).classed("text-hover", false); })
    .on("focus", function(d,i){
      showFocusRing(hccol.indexOf(i+1) * cellSize, -TOP_MAR + 4, cellSize, TOP_MAR - 10);
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
      currentOrderMode = "custom";
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

  var heatRect = heatMap.enter().append("rect")
    .attr("x", function(d){ return hccol.indexOf(d.col)*cellSize; })
    .attr("y", function(d){ return hcrow.indexOf(d.row)*cellSize; })
    .attr("class", function(d){ return "cell cell-border cr"+(d.row-1)+" cc"+(d.col-1); })
    .attr("width", cellSize).attr("height", cellSize)
    .style("fill", function(d){ return cellFill(d, highlightlimit); })
    .style("stroke", function(d){ return d.value <= highlightlimit ? HIGHLIGHT_DARK : "gray"; })
    .style("stroke-width", function(d){ return d.value <= highlightlimit ? "1.2px" : "0.3px"; })
    .style("opacity", 0.9)
    .on("click", function(d) {
      if (d.value === 999) return;
      focusNeighborhood(d.row, d.col, d.value);
    })
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
      // First line: rank + dollar amount for active year
      var curF = (d._src && d._src["f" + currentYear]) || 0;
      var curN_ = (d._src && d._src["n" + currentYear]) || 0;
      var curTotal = currentSource === "federal" ? curF
                   : currentSource === "nonfederal" ? curN_
                   : curF + curN_;
      var rankText = d.value === 999 ? "—" : "#" + d.value;
      d3.select("#tip-rank").text(rankText + "  ·  " + fmtDollars(curTotal));
      // Year-by-year breakdown
      d3.select("#tip-years").html(buildTipYears(d));
      d3.select("#tooltip").classed("hidden", false);
    })
    .on("mouseout", function(){
      d3.select(this).classed("cell-hover", false);
      d3.selectAll(".rowLabel").classed("text-highlight", false);
      d3.selectAll(".colLabel").classed("text-highlight", false);
      d3.select("#tooltip").classed("hidden", true);
      d3.select("#tip-years").html("");
    })
    .on("click", function(d) {
      if (d.value === 999) return;
      focusNeighborhood(d.row, d.col, d.value);
    })
  // ── N input ────────────────────────────────────────────────────────────────
  d3.select("#nValue").on("input", function(){ updateN(+this.value); });

  function updateN(nv) {
    var newRanking = rankingOrderForDisplay(nv);
    var cs = makeColorScale(nv);
    heatRect
      .style("fill", function(d){ return cellFill(d, nv); })
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
    currentOrderMode = "topten";
    d3.select("#order").property("selectedIndex", 2).node().focus();
    order("topten", 400, newRanking);
  }

  // ── Year switcher ───────────────────────────────────────────────────────────
  // Populate the year dropdown (newest first)
  var yearSelect = document.getElementById("yearSelect");
  availYears.slice().reverse().forEach(function(yr) {
    var opt = document.createElement("option");
    opt.value = yr;
    opt.text  = "FY" + yr;
    if (yr === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  });

  d3.select("#yearSelect").on("change", function() {
    switchYear(this.value);
  });

  function switchYear(year) {
    currentYear    = year;
    currentYearKey = "y" + year;
    var nv = +document.getElementById("nValue").value;

    // Recompute source-aware ranks for the new year, sync display slots, and
    // re-run any rank-dependent sort (co-occurrence, top-N count).
    recomputeRanksAndSync(true);

    // RankingTopN may have been updated inside recomputeRanksAndSync (for topten
    // sort). If sort wasn't re-run (contrast / custom), refresh the reference
    // here so label-click modes stay coherent.
    if (currentOrderMode !== "topten" && currentOrderMode !== "cosort") {
      RankingTopN = rankingOrderForDisplay(nv);
    }

    // Recolor cells + refresh cell-content text / font / aria
    refreshCellColors();

    svg.selectAll(".cell-contents")
      .style("font-weight", function(d){ return d.value <= nv ? "600" : "400"; })
      .style("font-size",   function(d){ return d.value <= nv ? numFontB : numFontS; })
      .attr("aria-label",   function(d){
        if (d.value === 999) return rowLabelFull[d.row-1] + ", " + colLabelFull[d.col-1] + ", not ranked";
        return rowLabelFull[d.row-1] + ", " + colLabelFull[d.col-1] + ", ranked " + d.value +
               (d.value <= nv ? ", top " + nv : "");
      })
      .text(function(d){ return (d.value === 999 || HIDE_NUMS) ? "" : d.value; });

    // Update page/SVG titles
    d3.select(".topbar-title h2")
      .text("FY" + year + " NSF R\u0026D Expenditures by Research Field");
    svgRoot.attr("aria-label",
      "Interactive heatmap: FY" + year + " NSF R&D expenditure rankings for the top 50 " +
      "U.S. research universities across " + col_number + " research fields.");

    // Sparklines: data unchanged (same inst per slot) but active-year marker moves
    redrawSparklines();
  }

  // ── Cell-click neighborhood focus ─────────────────────────────────────────
  // Click any cell → swap ±5 rows to show institutions ranked nearby in that
  // field, then globally re-sort all columns by average rank across those
  // neighborhood institutions (like clicking a row label, but weighted by
  // the neighborhood).  The clicked column stays pinned at its current
  // visual position (clamped ±5 from edges).  The clicked cell is highlighted.
  var NEIGHBORHOOD_SIZE = 5;

  function focusNeighborhood(displaySlot, displayCol, clickedRank) {
    currentOrderMode = "custom";
    var clickedInstRow = currentSlotToRow[displaySlot - 1];  // actual 1-based row

    // 1. Gather all institutions' ranks in this field from the full corpus
    var colEntries = [];
    for (var ri = 1; ri <= FULL_ROWS; ri++) {
      var fd = fullDataByInst[ri] ? fullDataByInst[ri][displayCol] : null;
      var v  = fd ? fd.value : 999;
      colEntries.push({ row: ri, value: v });
    }
    colEntries.sort(function(a, b) {
      if (a.value === 999 && b.value === 999) return 0;
      if (a.value === 999) return 1;
      if (b.value === 999) return -1;
      return a.value - b.value;
    });

    // 2. Find where the clicked institution sits in this sorted list
    var clickedPos = -1;
    for (var i = 0; i < colEntries.length; i++) {
      if (colEntries[i].row === clickedInstRow) { clickedPos = i; break; }
    }
    if (clickedPos < 0) return;

    // 3. Gather the ±NEIGHBORHOOD_SIZE institutions around the clicked one
    var aboveStart = Math.max(0, clickedPos - NEIGHBORHOOD_SIZE);
    var belowEnd   = Math.min(colEntries.length, clickedPos + NEIGHBORHOOD_SIZE + 1);
    var aboveInsts = colEntries.slice(aboveStart, clickedPos);
    var belowInsts = colEntries.slice(clickedPos + 1, belowEnd);

    // 4. Build new slot-to-row mapping with neighborhood swapped in
    var newSlotToRow = currentSlotToRow.slice();
    var usedRows = {};
    usedRows[clickedInstRow] = true;

    // Fill above
    var aboveSlotStart = displaySlot - 1 - aboveInsts.length;
    if (aboveSlotStart < 0) aboveSlotStart = 0;
    for (var ai = 0; ai < aboveInsts.length; ai++) {
      var slotIdx = aboveSlotStart + ai;
      if (slotIdx >= displaySlot - 1) break;
      newSlotToRow[slotIdx] = aboveInsts[ai].row;
      usedRows[aboveInsts[ai].row] = true;
    }

    // Fill below
    for (var bi = 0; bi < belowInsts.length; bi++) {
      var slotIdx = displaySlot + bi;
      if (slotIdx >= DISPLAY_ROWS) break;
      newSlotToRow[slotIdx] = belowInsts[bi].row;
      usedRows[belowInsts[bi].row] = true;
    }

    // Backfill: if a neighborhood institution was already in a non-neighborhood
    // slot, restore that slot to its original occupant
    var originalSlotToRow = currentSlotToRow.slice();
    for (var si = 0; si < DISPLAY_ROWS; si++) {
      var isNeighSlot = (si >= aboveSlotStart && si < aboveSlotStart + aboveInsts.length) ||
                        (si === displaySlot - 1) ||
                        (si >= displaySlot && si < displaySlot + belowInsts.length);
      if (!isNeighSlot && usedRows[newSlotToRow[si]]) {
        newSlotToRow[si] = originalSlotToRow[si];
      }
    }

    // 5. Read clicked column's current visual position BEFORE any changes
    var clickedColIdx = displayCol - 1;
    var origColPos = -1;
    svg.selectAll(".cell-border").each(function(d) {
      if (d.col - 1 === clickedColIdx && d.row === 1) {
        origColPos = Math.round(this.x.baseVal.value / cellSize);
      }
    });
    if (origColPos < 0) origColPos = clickedColIdx;

    // 6. Apply row swap instantly (data + labels update, no animation)
    swapDisplayRows(newSlotToRow, 0);

    // 7. Sort columns by the clicked row's values (same as sortbylabel "r")
    //    then cyclically shift so the clicked column stays at its original position.
    var rowIdx = displaySlot - 1;
    var arr = [];
    d3.selectAll(".cr" + rowIdx).filter(function(ce) { arr.push(ce.value); });
    var s = d3.range(col_number).sort(function(a, b) { return arr[a] - arr[b]; });
    // s[position] = colIdx

    // Cyclic shift: rotate s so that clickedColIdx lands at origColPos
    var sortedPos = s.indexOf(clickedColIdx);
    var shift = origColPos - sortedPos;
    var shifted = [];
    for (var p = 0; p < col_number; p++) {
      shifted.push(s[((p - shift) % col_number + col_number) % col_number]);
    }
    // shifted[position] = colIdx  →  shifted.indexOf(colIdx) = visual position

    // 8. Animate using the SAME pattern as sortbylabel (proven to work)
    var t = svg.transition().duration(800);
    t.selectAll(".cell")
      .attr("x", function(d) { return shifted.indexOf(d.col - 1) * cellSize; });
    t.selectAll(".cell-contents")
      .attr("x", function(d) { return shifted.indexOf(d.col - 1) * cellSize + cellSize * 0.5; });
    t.selectAll(".colLabel")
      .attr("x", function(d, ci) { return shifted.indexOf(ci) * cellSize + cellSize / 2; })
      .attr("transform", function(d, ci) { return colTransform(ci, shifted.indexOf(ci)); });

    // 9. Highlight the clicked cell with inline stroke (survives swapDisplayRows)
    var nv = +document.getElementById("nValue").value;
    svg.selectAll(".cell-border")
      .style("stroke", function(d) { return d.value <= nv ? HIGHLIGHT_DARK : "gray"; })
      .style("stroke-width", function(d) { return d.value <= nv ? "1.2px" : "0.3px"; });
    svg.selectAll(".cell-border").filter(function(d) {
      return d.row === displaySlot && d.col === displayCol;
    })
      .style("fill", "#e57373")
      .style("stroke", "#b71c1c")
      .style("stroke-width", "2.5px");

    d3.select("#order").property("selectedIndex", 0);
  }

  // ── Sort by label ──────────────────────────────────────────────────────────
  function sortbylabel(rORc, i, sortOrder, ms) {
    var t = svg.transition().duration(ms);
    if (rORc === "r") {
      // Sort columns by this row's field values — no institution swap needed
      var arr = [];
      d3.selectAll(".cr" + i).filter(function(ce){ arr.push(ce.value); });
      var s = d3.range(col_number).sort(function(a,b){ return sortOrder?arr[b]-arr[a]:arr[a]-arr[b]; });
      t.selectAll(".cell")         .attr("x", function(d){ return s.indexOf(d.col-1)*cellSize; });
      t.selectAll(".cell-contents").attr("x", function(d){ return s.indexOf(d.col-1)*cellSize+cellSize*0.5; });
      t.selectAll(".colLabel")
        .attr("x", function(d,ci){ return s.indexOf(ci)*cellSize + cellSize/2; })
        .attr("transform", function(d,ci){ return colTransform(ci, s.indexOf(ci)); });
    } else {
      // Sort rows by this column's values — swap in top-DISPLAY_ROWS institutions
      // for this field from the full FULL_ROWS dataset so that field leaders like
      // Wichita State (top in Aerospace Eng but outside top-50 overall) appear.
      var colIdx = i + 1;  // 1-based display col
      var colEntries = [];
      for (var ri = 1; ri <= FULL_ROWS; ri++) {
        var fd = fullDataByInst[ri] ? fullDataByInst[ri][colIdx] : null;
        colEntries.push({ row: ri, value: fd ? fd.value : 999 });
      }
      colEntries.sort(function(a, b) {
        // 999 = no data; always sort to the bottom regardless of direction
        if (a.value === 999 && b.value === 999) return 0;
        if (a.value === 999) return 1;
        if (b.value === 999) return -1;
        return sortOrder ? b.value - a.value : a.value - b.value;
      });
      var newSlotToRow = colEntries.slice(0, DISPLAY_ROWS).map(function(e){ return e.row; });
      // Do NOT reset column positions — preserve whatever column ordering the user
      // has already applied (e.g. after a row-click moved Chemical Eng to column 0,
      // clicking Chemical Eng again should keep it at column 0).
      // swapDisplayRows only animates y-positions, so columns are untouched.
      swapDisplayRows(newSlotToRow, ms);
    }
  }

  // ── Institution swap helpers ────────────────────────────────────────────────

  // Instantly restore the 50 display slots to the default overall-R&D top-50.
  // Called before every dropdown-triggered sort so those modes always operate
  // on the canonical institution set.
  function resetToDefaultRows() {
    var isDefault = currentSlotToRow.every(function(r, i){ return r === i + 1; });
    if (isDefault) return;
    currentSlotToRow = d3.range(1, DISPLAY_ROWS + 1);
    for (var si = 0; si < DISPLAY_ROWS; si++) {
      rowLabelFull[si] = headers.uni_name[si] || "";
      rowLabel[si]     = abbrevRow(rowLabelFull[si]);
    }
    rebuildDataValues();
    var nv = +document.getElementById("nValue").value;
    var cs = makeColorScale(nv);
    d3.selectAll(".rowLabel")
      .text(function(d, i){ return rowLabel[i]; })
      .attr("aria-label", function(d, i){ return "Sort columns by " + rowLabelFull[i] + " expenditure rank"; });
    svg.selectAll(".cell-border")
      .style("fill",         function(d){ return cellFill(d, nv); })
      .style("stroke",       function(d){ return d.value <= nv ? HIGHLIGHT_DARK : "gray"; })
      .style("stroke-width", function(d){ return d.value <= nv ? "1.2px" : "0.3px"; });
    svg.selectAll(".cell-contents")
      .style("font-weight", function(d){ return d.value <= nv ? "600" : "400"; })
      .style("font-size",   function(d){ return d.value <= nv ? numFontB : numFontS; })
      .text(function(d){ return (d.value === 999 || HIDE_NUMS) ? "" : d.value; });
    redrawSparklines();
  }

  // Swap the 50 display slots to newSlotToRow (array of actual row numbers),
  // update row labels and cell values in-place, then animate to natural position.
  function swapDisplayRows(newSlotToRow, ms) {
    currentSlotToRow = newSlotToRow;
    for (var si = 0; si < DISPLAY_ROWS; si++) {
      var fullName    = headers.uni_name[currentSlotToRow[si] - 1] || "";
      rowLabelFull[si] = fullName;
      rowLabel[si]     = abbrevRow(fullName);
    }
    rebuildDataValues();
    var nv = +document.getElementById("nValue").value;
    var cs = makeColorScale(nv);
    d3.selectAll(".rowLabel")
      .text(function(d, i){ return rowLabel[i]; })
      .attr("aria-label", function(d, i){ return "Sort columns by " + rowLabelFull[i] + " expenditure rank"; });
    svg.selectAll(".cell-border")
      .style("fill",         function(d){ return cellFill(d, nv); })
      .style("stroke",       function(d){ return d.value <= nv ? HIGHLIGHT_DARK : "gray"; })
      .style("stroke-width", function(d){ return d.value <= nv ? "1.2px" : "0.3px"; });
    svg.selectAll(".cell-contents")
      .style("font-weight", function(d){ return d.value <= nv ? "600" : "400"; })
      .style("font-size",   function(d){ return d.value <= nv ? numFontB : numFontS; })
      .attr("aria-label", function(d){
        if (d.value === 999) return rowLabelFull[d.row-1] + ", " + colLabelFull[d.col-1] + ", not ranked";
        return rowLabelFull[d.row-1] + ", " + colLabelFull[d.col-1] + ", ranked " + d.value;
      })
      .text(function(d){ return (d.value === 999 || HIDE_NUMS) ? "" : d.value; });
    // Animate rows into their sorted (natural slot) positions
    var t = svg.transition().duration(ms || 0);
    t.selectAll(".cell")         .attr("y", function(d){ return (d.row-1)*cellSize; });
    t.selectAll(".cell-contents").attr("y", function(d){ return (d.row-1)*cellSize+cellSize*0.72; });
    t.selectAll(".rowLabel")     .attr("y", function(d, i){ return i*cellSize; });
    // Sparklines: institutions changed, redraw at natural slot positions
    redrawSparklines();
  }

  // ── Co-sort ─────────────────────────────────────────────────────────────────
  // Jaccard similarity is computed across ALL FULL_ROWS for better clustering
  // context, but only the DISPLAY_ROWS visible rows are animated.  The full
  // rowOrder is compacted: each display row gets a consecutive y-position (0..49)
  // matching the order in which it appears in the full 250-row seriation.
  function coSort(nv) {
    var bmat = [];
    for (var r = 0; r < FULL_ROWS; r++) {
      bmat.push([]);
      for (var c = 0; c < col_number; c++) { bmat[r].push(0); }
    }
    fullData.forEach(function(d) {
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
      for (var i = 0; i < FULL_ROWS; i++) {
        if (bmat[i][a] || bmat[i][b]) either++;
        if (bmat[i][a] && bmat[i][b]) both++;
      }
      return either ? both / either : 0;
    }

    var rowBlues = bmat.map(function(r){ return r.reduce(function(s,v){ return s+v; }, 0); });
    var colBlues = [];
    for (var c = 0; c < col_number; c++) {
      var s = 0; for (var r = 0; r < FULL_ROWS; r++) s += bmat[r][c];
      colBlues.push(s);
    }

    function seriateAxis(n, simFn, blueCount) {
      var rem = [], ord = [];
      for (var k = 0; k < n; k++) rem.push(k);
      var start = rem.reduce(function(best, k){ return blueCount[k] > blueCount[best] ? k : best; }, 0);
      ord.push(start);
      rem.splice(rem.indexOf(start), 1);
      while (rem.length) {
        var last = ord[ord.length-1];
        var best = rem.reduce(function(bk, k){ return simFn(last,k) >= simFn(last,bk) ? k : bk; }, rem[0]);
        ord.push(best);
        rem.splice(rem.indexOf(best), 1);
      }
      return ord;
    }

    var rowOrder = seriateAxis(FULL_ROWS, rowSim, rowBlues);  // permutation of [0..FULL_ROWS-1]
    var colOrder = seriateAxis(col_number, colSim, colBlues);

    // ── POST-PASS: block-density sort ──────────────────────────────────────────
    //
    // This post-pass detects "hard breaks" — adjacent row pairs where Jaccard
    // similarity is exactly 0 (no shared blue fields at all) — and treats each
    // contiguous run between breaks as a block.  Blocks are then re-ordered by
    // their internal blue-cell density (dense clusters first), while the intra-
    // block row order from seriation is fully preserved.
    //
    // Threshold: similarity === 0  (natural / parameter-free cut).

    var blocks = [];
    var currentBlock = [rowOrder[0]];
    for (var bi = 1; bi < rowOrder.length; bi++) {
      if (rowSim(rowOrder[bi - 1], rowOrder[bi]) === 0) {
        blocks.push(currentBlock);
        currentBlock = [rowOrder[bi]];
      } else {
        currentBlock.push(rowOrder[bi]);
      }
    }
    blocks.push(currentBlock);

    blocks.sort(function(a, b) {
      function blockDensity(block) {
        var blues = 0;
        block.forEach(function(r) {
          for (var j = 0; j < col_number; j++) { blues += bmat[r][j]; }
        });
        return blues / (block.length * col_number);
      }
      return blockDensity(b) - blockDensity(a);  // descending: dense blocks first
    });



    var flattenedOrder = [];
    blocks.forEach(function(block) {
      block.forEach(function(r) { flattenedOrder.push(r); });
    });
    rowOrder = flattenedOrder;

    // Compact the full row ordering to consecutive positions for display rows only
    var displayRowPos = {};
    var pos = 0;
    for (var i = 0; i < rowOrder.length; i++) {
      var origIdx = rowOrder[i];   // 0-based original row index
      if (origIdx < DISPLAY_ROWS) { displayRowPos[origIdx] = pos++; }
    }

    var t = svg.transition().duration(1200);
    t.selectAll(".cell")
      .attr("x", function(d){ return colOrder.indexOf(d.col-1) * cellSize; })
      .attr("y", function(d){ return displayRowPos[d.row-1] * cellSize; });
    t.selectAll(".cell-contents")
      .attr("x", function(d){ return colOrder.indexOf(d.col-1) * cellSize + cellSize*0.5; })
      .attr("y", function(d){ return displayRowPos[d.row-1] * cellSize + cellSize*0.72; });
    t.selectAll(".rowLabel")
      .attr("y", function(d, i){ return displayRowPos[i] * cellSize; });
    t.selectAll(".colLabel")
      .attr("x", function(d,i){ return colOrder.indexOf(i) * cellSize + cellSize/2; })
      .attr("transform", function(d,i){ return colTransform(i, colOrder.indexOf(i)); });

    // Sparklines: redraw at the coSorted slot positions (after animation)
    t.each("end", function() {
      redrawSparklines(function(i) { return (displayRowPos[i] || 0) * cellSize; });
    });
  }

  // ── (Cohort evolution visualization removed — now in graph.html) ──────────




  // ── Order dropdown ─────────────────────────────────────────────────────────
  d3.select("#order").on("change", function(){
    var prevMode = currentOrderMode;
    currentOrderMode = this.value;
    // Refresh RankingTopN from current fullData.value (source + year aware)
    // so "By Count of Top-N" never runs with a stale permutation computed
    // under a prior source filter.
    if (this.value === "topten") {
      RankingTopN = rankingOrderForDisplay(+document.getElementById("nValue").value);
    }
    order(this.value, 1200, RankingTopN, prevMode);
  });

  // ── Mode and source toggles (Rank / Dollars, Federal / Non-Federal / Both) ──
  //
  // refreshCellColors is the single entry point for re-rendering cells after
  // any mode, source, or year change. It recomputes rowSourceTotals when in
  // rowshare mode, and re-renders cell text (the rank numbers) so that what
  // the user sees always matches the current d.value.
  //
  // IMPORTANT: Source change updates d.value → without re-rendering text, the
  // DOM shows stale rank numbers (e.g. total-R&D ranks) while sorts read the
  // new ones, producing an apparent "wrong sort order."
  function refreshCellColors() {
    if (currentMode === "rowshare") computeRowSourceTotals();
    var nv = +document.getElementById("nValue").value;
    svg.selectAll(".cell-border")
      .style("fill",         function(d){ return cellFill(d, nv); })
      .style("stroke",       function(d){ return d.value <= nv ? HIGHLIGHT_DARK : "gray"; })
      .style("stroke-width", function(d){ return d.value <= nv ? "1.2px" : "0.3px"; });
    svg.selectAll(".cell-contents")
      .style("font-weight", function(d){ return d.value <= nv ? "600" : "400"; })
      .style("font-size",   function(d){ return d.value <= nv ? numFontB : numFontS; })
      .attr("aria-label",   function(d){
        if (d.value === 999) return rowLabelFull[d.row-1] + ", " + colLabelFull[d.col-1] + ", not ranked";
        return rowLabelFull[d.row-1] + ", " + colLabelFull[d.col-1] + ", ranked " + d.value +
               (d.value <= nv ? ", top " + nv : "");
      })
      .text(function(d){ return (d.value === 999 || HIDE_NUMS) ? "" : d.value; });
  }

  d3.select("#modeSelect").on("change", function() {
    currentMode = this.value;
    svg.selectAll(".dollar-legend").style("display",
      currentMode === "dollars" ? null : "none");
    svg.selectAll(".rowshare-legend").style("display",
      currentMode === "rowshare" ? null : "none");
    refreshCellColors();
  });

  // Source is a global data filter — recompute ranks and re-run any
  // rank-dependent arrangement (co-occurrence, top-N count).
  d3.select("#sourceSelect").on("change", function() {
    currentSource = this.value;
    recomputeRanksAndSync(true);
    refreshCellColors();
  });

  function order(value, ms, topN, prevMode) {
    // Clear cell-focus highlight from any previous cell-click
    var curN = +document.getElementById("nValue").value;
    svg.selectAll(".cell-border")
      .style("fill", function(d) { return cellFill(d, curN); })
      .style("stroke", function(d) { return d.value <= curN ? HIGHLIGHT_DARK : "gray"; })
      .style("stroke-width", function(d) { return d.value <= curN ? "1.2px" : "0.3px"; });

    // After a cell-click ("custom"), preserve neighborhood rows only for
    // "contrast" (pure column reorder).  Co-occurrence and top-N recompute
    // layout from row data, so they need the canonical institution set.
    if (!(prevMode === "custom" && value === "contrast")) resetToDefaultRows();
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
    // Sparklines: redraw at new slot positions after animation
    t.each("end", function() {
      if (value === "topten") {
        redrawSparklines(function(i) { return topN.indexOf(i) * cellSize; });
      } else {
        redrawSparklines();  // natural slot positions
      }
    });
  }

  // ── Drag-to-select ─────────────────────────────────────────────────────────
  var sa = d3.select(".g3")
    .on("mousedown", function(){
      if (!d3.event.altKey) {
        d3.selectAll(".cell-selected").classed("cell-selected", false);
        d3.selectAll(".rowLabel").classed("text-selected", false);
        d3.selectAll(".colLabel").classed("text-selected", false);
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
      if (mx<1||mx*2<dx.width){ dx.x=p[0]; dx.width-=mx; } else { dx.width=mx; }
      if (my<1||my*2<dx.height){ dx.y=p[1]; dx.height-=my; } else { dx.height=my; }
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
      d3.selectAll(".cell-selection").classed("cell-selection", false);
      d3.selectAll(".text-selection").classed("text-selection", false);
    })
    .on("mouseout", function(){
      var rt  = d3.event.relatedTarget;
      var tag = rt ? (rt.tagName||"").toLowerCase() : "";
      if (!rt||tag==="html"||tag==="body"||!d3.select(rt).classed("cell")) {
        sa.selectAll("rect.selection").remove();
        d3.selectAll(".cell-selection").classed("cell-selection", false);
        d3.selectAll(".rowLabel").classed("text-selected", false);
        d3.selectAll(".colLabel").classed("text-selected", false);
      }
    });

}); // end d3.json
