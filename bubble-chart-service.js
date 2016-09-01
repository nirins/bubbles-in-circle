var colores_30 = [
"#3182BD",
"#4F94C7",
"#6DA6D1",
"#8AB7DB",
"#A8C9E5",
"#C6DBEF",
"#E6550D",
"#EB6E2B",
"#EF8649",
"#F49F66",
"#F8B784",
"#FDD0A2",
"#31A354",
"#4FB16A",
"#6DBF7F",
"#8BCD95",
"#A9DBAA",
"#C7E9C0",
"#756BB1",
"#8981BD",
"#9D97C8",
"#B2AED4",
"#C6C4DF",
"#DADAEB",
"#636363",
"#7B7B7B",
"#929292",
"#AAAAAA",
"#C1C1C1",
"#D9D9D9"
];

var Color = function (n) {
  return colores_30[n % colores_30.length];
};

var CalculateRadiousFunctionParameter = function (bubbles, min_r, max_r) {
  var min = Number.MAX_VALUE,
      max = Number.MIN_VALUE;
  for (var i = bubbles.length - 1; i >= 0; i--) {
    if (bubbles[i].price > max) {
      max = bubbles[i].price;
    }
    if (bubbles[i].price < min) {
      min = bubbles[i].price;
    }
  }
  var a, b;
  a = (max_r - min_r) * Math.sqrt(Math.PI) / (Math.sqrt(max) - Math.sqrt(min));
  b = min_r - a * Math.sqrt(min / Math.PI);
  return { a: a, b: b };
};

var CalculateRadious = function (size, r_function_params, min_r) {
  var r = r_function_params.a * Math.sqrt(size / Math.PI) + r_function_params.b;
  return r > min_r ? r : min_r;
};

var MoveTight = function (t, orig, r_std) {
  for (var i = t.length - 1; i >= 0; i--) {
    var step = CalculateMove(t[i], orig, t, r_std, 100);
    t[i].x += step.x;
    t[i].y += step.y;
  }
};

var MoveLoose = function (t, orig, r_std) {
  for (var i = t.length - 1; i >= 0; i--) {
    var step = CalculateMove(t[i], orig, t, r_std, 1);
    t[i].x += step.x;
    t[i].y += step.y;
  }
};

var CalculateMove = function (d, orig, t, r_std, coherent) {
  var step = { x: 0, y: 0 };
  var x, y, r, sc, s, v;
  x = orig.x - d.x;
  y = orig.y - d.y;
  r = Math.sqrt(x * x + y * y);
  sc = (r - r_std) * (r - r_std);
  //move to center
  if (r > r_std)
    step = { x: x / r * sc, y: y / r * sc };
  else
    step = { x: 0, y: 0 };
  for (var i = t.length - 1; i >= 0; i--) {
    x = d.x - t[i].x;
    y = d.y - t[i].y;
    r = Math.sqrt(x * x + y * y);
    //move avoid collision
    if (r < d.r + t[i].r && r > 0) {
      s = (d.r + t[i].r - r) * (d.r + t[i].r - r);
      step.x += x / r * s;
      step.y += y / r * s;
    }
    //move to same group
    if (d.stock_id == t[i].stock_id && r > d.r + t[i].r && r != 0) {
      v = { x: -x / r, y: -y / r };
      step.x += v.x * coherent;
      step.y += v.y * coherent;
    }
  }
  r = Math.sqrt(step.x * step.x + step.y * step.y);
  if (r > 0) {
    step.x = step.x / r;
    step.y = step.y / r;
  }
  if (isNaN(step.x) || isNaN(step.y)) alert(step);
  return step;
};

var InitializeLayout = function (t, diameter, loose) {
  if (t.length == 1) {
    t[0].x = diameter / 2;
    t[0].y = diameter / 2;
    return t;
  }
  var groups = [];
  for (var i = t.length - 1; i >= 0; i--) {
    if (groups.indexOf(t[i].stock_id) <= -1)
      groups.push(t[i].stock_id);
  }
  var ng = Math.ceil(Math.sqrt(groups.length)),
      wg = diameter / ng;
  for (var i = t.length - 1; i >= 0; i--) {
    var g = groups.indexOf(t[i].stock_id);
    t[i].x = g / ng * wg + Math.random() * wg;
    t[i].y = g % ng * wg + Math.random() * wg;
  }
};

var Layout = function (bubbles, diameter, loose) {
  var t = $.extend(true, [], bubbles);
  InitializeLayout(t, diameter, loose);
  var r_std = 0;
  for (var i = t.length - 1; i >= 0; i--) {
    r_std += t[i].r * t[i].r;
  }
  r_std = Math.sqrt(r_std) * loose;
  var orig = { x: diameter / 2, y: diameter / 2 },
      loopTight = Math.max(bubbles.length, 200),
      loopLoose = Math.max(bubbles.length, 200);
  for (var i = 0; i < loopTight; i++)
    MoveTight(t, orig, r_std);
  for (var i = 0; i < loopLoose; i++)
    MoveLoose(t, orig, r_std);
  return t;
};

var Draw = function (divid, name, t, diameter, h) {
  if (!h) h = diameter;
  d3.select(divid).html("");
  var svg = d3.select(divid).append("svg")
    .attr("width", diameter)
    .attr("height", h)
    .attr("class", "bubble");
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  svg.selectAll("*").remove();
  var nodes = svg.selectAll(".node")
    .data(t)
    .enter()
    .append("g")
    .attr("id", function (d) { return d.id; })
    .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
  nodes.append("circle")
    .attr("class", "node")
    .attr("r", function (d) { return d.r; })
    .style("stroke", function (d) {
      return d.stock_id >= colores_30.length ? "#ddd" : Color(d.stock_id);
    })
    .style("fill", function (d) {
      return d.stock_id >= colores_30.length ? "#eee" : Color(d.stock_id);
    })
    .style("fill-opacity", 0.9)
    .on('mouseover', function (d) {
      div.transition()
          .duration(100)
          .style("opacity", .9);
      div.html('<div class="text-center dark"><div class="bold"><larger>'
          + d.stock_name
          + '</larger></div><div style="margin-top:5px; color="#6a6a6a""><small>'
          + d.broker_name
          + '</small></div><div class="bold" style="margin-top:15px; font-size: 16px;"><larger>'
          + d.x + '</larger></div></div>')
          .style("left", (d3.event.pageX - 80) + "px")
          .style("top", (d3.event.pageY - 80) + "px");
    })
    .on("mouseout", function (d) {
      div.transition()
          .duration(100)
          .style("opacity", 0);
    });
};