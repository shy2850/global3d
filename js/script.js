;(function(d3){
    var requestAFrame = (function () {
        return  window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                function (fn) {
                    return window.setTimeout(fn, 1000/60); 
                };
    })();
    var _timeoutQueue = {}, index = 0;

    d3.interval = function(k,fn,timer,times){
        fn.timer = Math.floor( (timer||200) * 60 / 1000);
        fn.times = times || Infinity;
        _timeoutQueue[k] = fn;
    };
    d3.clearInterval = function(k){
        delete _timeoutQueue[k];
    };

    function queueTimeout(){
        for(var i in _timeoutQueue){
            var fn = _timeoutQueue[i];
            if( index % fn.timer === 0 ){   //如果按照时间轮训到了，执行代码
                if( !fn.times-- ){          //如果可执行次数为0, 移除方法
                    delete _timeoutQueue[i];
                }else{
                    var _r = fn();  
                    if(_r === false){
                        delete _timeoutQueue[i];
                    }
                }
            }
        }
        requestAFrame(queueTimeout);
        index = ( index + 1) % (18000) ; //最高时隔5分钟
    }

    queueTimeout(); 
})(d3);

;(function(w, d3, undefined){
    "use strict";

    var width, height;
    function getSize(){
        width = w.innerWidth,
        height = w.innerHeight;

        if(width === 0 || height === 0){
            setTimeout(function(){
                getSize();
            }, 100);
        }
        else {
            init();
        }
    }

    function init(){

        //Setup path for outerspace
        var space = d3.geo.azimuthal()
            .mode("equidistant")
            .translate([width / 2, height / 2]);

        space.scale(space.scale() * 3);

        var spacePath = d3.geo.path()
            .projection(space)
            .pointRadius(1);

        //Setup path for globe
        var projection = d3.geo.azimuthal()
            .mode("orthographic")
            .translate([width / 2, height / 2]);

        var scale0 = projection.scale();

        var path = d3.geo.path()
            .projection(projection)
            .pointRadius(2);

        //Setup zoom behavior
        var zoom = d3.behavior.zoom(true)
            .translate(projection.origin())
            .scale(projection.scale())
            .scaleExtent([100, 800])
            .on("zoom", function(e){
                if(d3.event){
                    var scale = d3.event.scale;
                    var origin = [d3.event.translate[0] * -1, d3.event.translate[1]];
                    move(scale, origin) 
                }
            });

        var circle = d3.geo.greatCircle();

        var svg = d3.select("body")
            .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                    .call(zoom)
                    .on("dblclick.zoom", null);

        //Create a list of random stars and add them to outerspace
        var starList = createStars(300);

        var stars = svg.append("g")
            .selectAll("g")
            .data(starList)
            .enter()
            .append("path")
                .attr("class", "star")
                .attr("d", function(d){
                    spacePath.pointRadius(d.properties.radius);
                    return spacePath(d);
                });


        svg.append("rect")
            .attr("class", "frame")
            .attr("width", width)
            .attr("height", height);

        //Create the base globe
        var backgroundCircle = svg.append("circle")
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('r', projection.scale())
            .attr('class', 'globe')
            .attr("filter", "url(#glow)")
            .attr("fill", "url(#gradBlue)");

        var g = svg.append("g"),
            features;

        //Add all of the countries to the globe
        d3.json("continent_geo.json", function(collection) {
            features = g.selectAll(".feature").data(collection.features);

            features.enter().append("path")
                .attr("class", "feature")
                .attr("title", function(d){return d.properties.name})
                .attr("d", function(d){ return path(circle.clip(d)); });
        });

        //Redraw all items with new projections
        function redraw(){
            features.attr("d", function(d){
                return path(circle.clip(d));
            });

            stars.attr("d", function(d){
                spacePath.pointRadius(d.properties.radius);
                return spacePath(d);
            });
        }


        function move(scale, origin) {
            projection.scale(scale);
            space.scale(scale * 3);
            backgroundCircle.attr('r', scale);
            path.pointRadius(2 * scale / scale0);

            projection.origin(origin);
            circle.origin(origin);

            //globe and stars spin in the opposite direction because of the projection mode
            var spaceOrigin = [origin[0] * -1, origin[1] * -1];
            space.origin(spaceOrigin);
            redraw();
        }

        var i = 1;

        d3.interval("round",function(){
            try{
                move( 100 + Math.abs(200 - i%400), [.2*i,0] );
            }catch(e){}
            i = i + 1 % 10000;
        },20);

        function createStars(number){
            var data = [];
            for(var i = 0; i < number; i++){
                data.push({
                    geometry: {
                        type: 'Point',
                        coordinates: randomLonLat()
                    },
                    type: 'Feature',
                    properties: {
                        radius: Math.random() * 1.5
                    }
                });
            }
            return data;
        }

        function randomLonLat(){
            return [Math.random() * 360 - 180, Math.random() * 180 - 90];
        }
    }

    getSize();

}(window, d3));