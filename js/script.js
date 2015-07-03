d3.select(window)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup);

var width = 600,
    height = 500;

var proj = d3.geo.orthographic()
    .translate([width / 2, height / 2])
    .clipAngle(90)
    .scale(220);

var path = d3.geo.path().projection(proj).pointRadius(10);

var svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height)
            .on("mousedown", mousedown);

function ready(world, places) {
  var ocean_fill = svg.append("defs").append("radialGradient")
        .attr("id", "ocean_fill")
        .attr("cx", "75%")
        .attr("cy", "25%");
      ocean_fill.append("stop").attr("offset", "5%").attr("stop-color", "#a0aacb");
      ocean_fill.append("stop").attr("offset", "100%").attr("stop-color", "#6c6697");

  var globe_highlight = svg.append("defs").append("radialGradient")
        .attr("id", "globe_highlight")
        .attr("cx", "75%")
        .attr("cy", "25%");
      globe_highlight.append("stop")
        .attr("offset", "5%").attr("stop-color", "#ffd")
        .attr("stop-opacity","0.5");
      globe_highlight.append("stop")
        .attr("offset", "100%").attr("stop-color", "#ba9")
        .attr("stop-opacity","0.2");

  var globe_shading = svg.append("defs").append("radialGradient")
        .attr("id", "globe_shading")
        .attr("cx", "55%")
        .attr("cy", "45%");
      globe_shading.append("stop")
        .attr("offset","30%").attr("stop-color", "#fff")
        .attr("stop-opacity","0")
      globe_shading.append("stop")
        .attr("offset","100%").attr("stop-color", "#505962")
        .attr("stop-opacity","0.3")

  var drop_shadow = svg.append("defs").append("radialGradient")
        .attr("id", "drop_shadow")
        .attr("cx", "50%")
        .attr("cy", "50%");
      drop_shadow.append("stop")
        .attr("offset","20%").attr("stop-color", "#000")
        .attr("stop-opacity",".5")
      drop_shadow.append("stop")
        .attr("offset","100%").attr("stop-color", "#000")
        .attr("stop-opacity","0")  
  // 阴影
  svg.append("ellipse")
    .attr("cx", 260).attr("cy", 450)
    .attr("rx", proj.scale()*.90)
    .attr("ry", proj.scale()*.25)
    .attr("class", "noclicks")
    .style("fill", "url(#drop_shadow)");
  // 海洋轮廓
  svg.append("circle")
    .attr("cx", width / 2).attr("cy", height / 2)
    .attr("r", proj.scale())
    .attr("class", "noclicks")
    .style("fill", "url(#ocean_fill)");
  // 地球轮廓
  svg.append("path")
    .datum(topojson.object(world, world.objects.land))
    .attr("class", "land noclicks")
    .attr("d", path);
  //高光
  svg.append("circle")
    .attr("cx", width / 2).attr("cy", height / 2)
    .attr("r", proj.scale())
    .attr("class","noclicks")
    .style("cursor","-webkit-grab")
    .style("fill", "url(#globe_highlight)");

  // 画点
  svg.append("g").attr("class","points")
    .selectAll("text").data(places.features)
    .enter().append("path")
    .attr("class", "point")
    .attr("d", path)
    .style("fill", function(d){
      return d.color;
    })
    .on("click", function(e, i){
      d3.transition()
        .duration(800)
        .tween("rotate", function() {
          var 
              p = d3.geo.centroid(places.features[i]),
              r = d3.interpolate(proj.rotate(), [-p[0], -p[1]]);
          var 
              other = d3.select(".content.current").attr("class","content"),
              me = d3.selectAll(".content").filter(function(n,index){return i === index}).attr("class","content current");
              
          return function(t) {
            proj.rotate( r(t) );
            refresh();
          };
        })
      .transition();
    });

  proj.rotate( d3.geo.centroid({
    type:"Feature",
    geometry:{
      type:"Point",
      coordinates: [-116.667946, -40.398983]
    }
  }) );
  refresh();
}

function refresh() {
  svg.selectAll(".land").attr("d", path);
  svg.selectAll(".point").attr("d", path);
}

var m0, o0;
function mousedown() {
  m0 = [d3.event.pageX, d3.event.pageY];
  o0 = proj.rotate();
  d3.event.preventDefault();
}
function mousemove(e, transition) {
  if (m0) {
    var m1 = [d3.event.pageX, d3.event.pageY]
      , o1 = [o0[0] + (m1[0] - m0[0]) / 2, o0[1] + (m0[1] - m1[1]) / 2];

    proj.rotate( o1 );
    refresh();
  }
}
function mouseup() {
  if (m0) {
    mousemove();
    m0 = null;
  }
}

ready(world, {
  features: data.content.map(function(item){
    return {
      type:"Feature",
      color: item.bgColor,
      geometry:{
        type:"Point",
        coordinates: [item.lng,item.lat]
      }
    };
  })
});

d3.select("body")
  .selectAll("div").data(data.content)
  .enter().append("div")
  .attr("class", "content")
  .html(function(d) { 
    return ( d.typeData ? ('<p class="image-holder"><img src="'+d.typeData+'" alt="'+d.title+'" /></p>') : "" )
          +'<h2>'+( d.url ? ('<a href="'+d.url+'" target="_blank">'+d.title+'</a>') : d.title)+'</h2>'
          +'<p>'+d.desc+'</p>'
          ;
  });

