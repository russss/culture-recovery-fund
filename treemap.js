let color = d3.scaleOrdinal(d3.schemeCategory10);
var opacity = d3
  .scaleLinear()
  .domain([50000, 3000000])
  .range([0.15, 0.6]);

let format = d3.format(".3~s");

let width = document.documentElement.clientWidth;
let height = document.documentElement.clientHeight * 1.3;

let tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

let treemap = data =>
  d3
    .treemap()
    .size([width, height])
    .paddingTop(27)
    .paddingRight(5)
    .paddingInner(1)
    .round(true)(
    d3
      .hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value)
  );

let svg = d3
  .select("#treemap")
  .append("svg")
  //  .attr("width", width)
  //  .attr("height", height)
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .append("g");

d3.json("stats.json").then(data => {
  let table = d3.select("#stats").append("table");
  let header_row = table.insert("tr");
  header_row.append("th").text("Type");
  header_row.append("th").text("Amount");
  header_row.append("th").text("Number");
  for (let key of Object.entries(data.total).sort((a, b) => b[1] - a[1])) {
    let row = table.insert("tr");
    row.insert("td").text(key[0]);
    row.insert("td").text(`£${format(key[1])}`);
    row.insert("td").text(data.count[key[0]]);
  }
  let row = table.insert("tr").attr("class", "total");
  row.insert("td").text("Total");
  row
    .insert("td")
    .html("£" + format(Object.values(data.total).reduce((a, b) => a + b, 0)));
  row
    .insert("td")
    .html(Object.values(data.count).reduce((a, b) => a + b, 0));
});

d3.json("./crf.json").then(function(data) {
  const root = treemap(data);
  const leaf = svg
    .selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  let rect = leaf
    .append("rect")
    .attr("fill", d => {
      while (d.depth > 1) d = d.parent;
      return color(d.data.name);
    })
    .attr("fill-opacity", d => opacity(d.value))
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0);

  let container = leaf
    .append("foreignObject")
    .attr(
      "requiredFeatures",
      "http://www.w3.org/TR/SVG11/feature#Extensibility"
    )
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .append("xhtml:div")
    .attr("class", "container")
    .attr("style", d => `height: ${d.y1 - d.y0}px`)
    .on("mouseover", (event, d) => {
      tooltip.html(
        `<strong>${d.data.name}</strong><br>Grant: £${format(d.value)}<br>Round: ${
          d.data.round
        }<br>Region: ${d.data.region}`
      );
    });

  svg.on("mouseover", event => {
    tooltip.style("opacity", 1);
  });

  svg.on("mouseout", d => {
    tooltip.style("opacity", 0);
  });

  svg.on("mousemove", event => {
    var x = event.pageX;
    var tooltip_rect = tooltip.node().getBoundingClientRect();
    if (x > document.documentElement.clientWidth - 300) {
      x = x - tooltip_rect.width;
    }
    tooltip.style("left", x + "px");
    tooltip.style("top", event.pageY - tooltip_rect.height - 5 + "px");
  });

  container
    .filter(d => d.value > 350000)
    .append("xhtml:div")
    .attr("class", "inner")
    .html(
      d =>
        `${d.data.name.replace(/(ltd|limited)/i, "").replace(/^The /, "")}<br/>
        <span class="amount">£${format(d.value)}</span>`
    );

  svg
    .selectAll("titles")
    .data(
      root.descendants().filter(function(d) {
        return d.depth == 1;
      })
    )
    .enter()
    .append("text")
    .attr("x", function(d) {
      return d.x0;
    })
    .attr("y", function(d) {
      return d.y0 + 20;
    })
    .text(function(d) {
      return d.data.name;
    })
    .attr("font-size", "14px")
    .attr("fill", function(d) {
      return color(d.data.name);
    });
});
