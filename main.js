var bubbles, brokers;

var layout_whole, layout_multi;

var min_r = 2,
    max_r = 50,
    n_bubbles = 200,
    n_brokers = 21,
    svg_width = 1200,
    svg_height = 900,
    layout_whole_diameter = 600,
    loose_whole = 0.9,
    loose_multi = 0.6,
    //radius function parameter
    r_function_params;

var n_frame_of_row = [4, 5, 6, 6],
    n_frame_of_row_acc = [];

var state = 0; //0:whole, 1:multi

for (var i = 0, sum = 0, len = n_frame_of_row.length; i < len; i++) {
    sum += n_frame_of_row[i];
    n_frame_of_row_acc.push(sum);
}

var GetFrameDiameter = function (n, width, n_frame_of_row, n_frame_of_row_acc) {
    var diameter = 0;
    for (var i = 0; i < n_frame_of_row_acc.length; i++) {
        if (n < n_frame_of_row_acc[i]) {
            diameter = width / n_frame_of_row[i];
            break;
        }
    }
    return diameter;
};

var GetFrameRow = function (n, n_frame_of_row_acc) {
    var row = 0;
    for (var i = 0; i < n_frame_of_row_acc.length; i++) {
        if (n < n_frame_of_row_acc[i]) {
            row = i;
            break;
        }
    }
    return row;
}

var GetFrameOffsetX = function (n, width, n_frame_of_row, n_frame_of_row_acc) {
    var row = GetFrameRow(n, n_frame_of_row_acc),
        x = 0,
        xi;
    if (row > 0)
        xi = n - n_frame_of_row_acc[row - 1];
    else
        xi = n;
    x = xi * GetFrameDiameter(n, width, n_frame_of_row, n_frame_of_row_acc);
    return x;
};

var GetFrameOffsetY = function (n, width, n_frame_of_row, n_frame_of_row_acc) {
    var row = GetFrameRow(n, n_frame_of_row_acc),
        y = 0;
    for (var i = 0; i < row; i++) {
        y += width / n_frame_of_row[i];
    }
    return y;
};

var LayoutWhole = function (bubbles, diameter, loose) {
    return Layout(bubbles, diameter, loose);
};

var LayoutMulti = function (brokers, bubbles, diameter, loose) {
    var frames = [],
        layout_multi = [];

  //Layout each frame
    for (var i = 0, len = brokers.length; i < len; i++) {
        var grap = [];
        for (var j = bubbles.length - 1; j >= 0; j--) {
            if (bubbles[j].broker_id == brokers[i].id) {
                grap.push(bubbles[j]);
            }
        }
        frames[i] = Layout(grap,
          GetFrameDiameter(i, svg_width, n_frame_of_row, n_frame_of_row_acc),
          loose);
    }

  //Layout relative
    for (var i = 0, len = frames.length; i < len; i++) {
        for (var j = frames[i].length; j >= 0; j--) {
            var t = $.extend(true, {}, frames[i][j]);
            t.x += GetFrameOffsetX(i, svg_width, n_frame_of_row, n_frame_of_row_acc);
            t.y += GetFrameOffsetY(i, svg_width, n_frame_of_row, n_frame_of_row_acc);
            layout_multi.push(t);
        }
    }

    return layout_multi;
};

var LabelBrokers = function (divid, svg_width, n_frame_of_row, n_frame_of_row_acc) {
    var fl = d3.select(divid).selectAll('.bubble');
    for (var i = 0, l = brokers.length; i < l; i++) {
        var x = GetFrameOffsetX(i, svg_width, n_frame_of_row, n_frame_of_row_acc);
        var y = GetFrameOffsetY(i, svg_width, n_frame_of_row, n_frame_of_row_acc);
        var diameter = GetFrameDiameter(i, svg_width, n_frame_of_row, n_frame_of_row_acc);
        fl.append("text")
        .attr("x", x + diameter / 2)
        .attr("y", y + 40)
        .attr("font-size", "14px")
        .attr("font-family", "meiryo")
        .attr("text-anchor", "middle")
        .text(brokers[i].name);
    }
}

var Scatter = function (divid, layout_multi, svg_width, n_frame_of_row, n_frame_of_row_acc) {
    var nodes = d3.select(divid).selectAll('g');
    nodes.each(function () {
        var d = d3.select(this);
        var x, y;
        for (var i = 0, l = layout_multi.length; i < l; i++) {
            if (layout_multi[i].id == d[0][0].id) {
                x = layout_multi[i].x;
                y = layout_multi[i].y;
            }
        }
        d.transition().duration(2000).attr("transform", "translate(" + x + "," + y + ")")
        setTimeout(LabelBrokers, 2000, divid, svg_width, n_frame_of_row, n_frame_of_row_acc);
    });
    state = 1;
};

var Gather = function (divid, layout_whole) {
    d3.select(divid).selectAll('text').remove();
    var nodes = d3.select(divid).selectAll('g');
    nodes.each(function () {
        var d = d3.select(this);
        var x, y;
        for (var i = 0, l = layout_whole.length; i < l; i++) {
            if (layout_whole[i].id == d[0][0].id) {
                x = layout_whole[i].x;
                y = layout_whole[i].y;
            }
        }
        d.transition().duration(2000).attr("transform", "translate(" + x + "," + y + ")")
    });
    state = 0;
};

var ChangeState = function () {
    if (!state) {
        Scatter("#bub", layout_multi, svg_width, n_frame_of_row, n_frame_of_row_acc);
    } else {
        Gather("#bub", layout_whole);
    }
};

var Compare = function (a, b) {
    if (a.netprice < b.netprice)
        return 1;
    else if (a.netprice > b.netprice)
        return -1;
    else
        return 0;
};

var SortBrokers = function (brokers) {
    for (var i = 0, len = brokers.length; i < len; i++) {
        var netprice = 0;
        for (var j = bubbles.length - 1; j >= 0; j--) {
            if (bubbles[j].broker_id == brokers[i].id) {
                netprice += bubbles[j].price
            }
        }
        brokers[i].netprice = netprice;
    }
    brokers.sort(Compare);
};

d3.json("data.js", function (data) {
    bubbles = data.slice(0, n_bubbles);
    r_function_params = CalculateRadiousFunctionParameter(bubbles, min_r, max_r);

    for (var i = bubbles.length - 1; i >= 0; i--) {
        bubbles[i].r = CalculateRadious(bubbles[i].price, r_function_params, min_r);
    }

    layout_whole = LayoutWhole(bubbles, layout_whole_diameter, loose_whole);
    Draw('#bub', '', layout_whole, svg_width, svg_height);

    d3.json("brokers.js", function (data) {
        brokers = data.slice(0, n_brokers);
        SortBrokers(brokers);
        layout_multi = LayoutMulti(brokers, bubbles, layout_whole_diameter, loose_multi);
    });
});
