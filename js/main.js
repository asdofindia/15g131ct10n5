(function () {
  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }
  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;
})();

(function(){
    var populations = {};
    var maps = {};
    var results = {};
    var funds = {};
    var codes = {};

    var width = 800;
    var height = 500;

    var pie = {};

    var currMap = "gp";
    var currYear = "2010";

    function mapfetch(maptype, mapyear) {
        var mapname = maptype + mapyear;
        if(maps[mapname]){
            var maploadevent = new CustomEvent("gpmaploaded");
            document.dispatchEvent(maploadevent);
        } else {
            d3.json("data/maps/"+ mapyear + "/" + maptype + ".geojson", function(d) {
                maps[mapname] = d;
                var maploadevent = new CustomEvent("gpmaploaded");
                document.dispatchEvent(maploadevent);
            });
        }
    };

    function resultfetch(url, resultname) {
        d3.json(url, function(d){
            results[resultname] = d;
        });
    };

    // var resultyears = ["05", "10"];
    // var resulttypes = ["gp", "bp", "dp"];
    var resultyears = ["05"];
    var resulttypes = ["gp"];

    $.each(resultyears, function(index, yearvalue){
        $.each(resulttypes, function(typeindex, typevalue){
            var resultname = typevalue+yearvalue;
            resultfetch("data/"+resultname+".json", resultname);
        });
    });

    var vis = d3.select(".map").append("svg")
        .attr("width", width).attr("height", height);

    d3.json("data/population.json", function(d) {
        for (var i = 0; i < d.length; i++) {
            populations[d[i]['lsgi_code']] = d[i];
        }
    });

    function mapcreator(map) {
        // console.log(map);
        var projection = d3.geo.mercator().scale(1).translate([0, 0]);
        var path = d3.geo.path().projection(projection);
        var bounds = path.bounds(map);
        var scale = .95 / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height);
        var transl = [((width - scale * (bounds[1][0] + bounds[0][0])) / 2) - 150, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];
        projection.scale(scale).translate(transl);

        var mapfeatures = vis.selectAll("path").data(map.features);

        mapfeatures
            .enter()
                .append("path")
                .attr("d", path)
                .attr("class", "area")
                .attr("id", function(d) {
                    return d.properties['lsgi_code']
                })
                .attr("title", function(d) {
                    return d.properties['PANCHAYAT']
                })
                .on("click", clicked);

        mapfeatures
            .attr("d", path)
            .attr("id", function(d){
                return d.properties['lsgi_code']
            })
            .attr("title", function(d) {
                return d.properties['PANCHAYAT']
            });

        mapfeatures
            .exit()
                .remove();
    };

    function clicked(d) {
        var code = getcode(d);
        d3.select('.areaInfo').text(getAreaInfo(code));
        resultPi(code);
    }

    function getcode(d) {
        if (d.properties['lsgi_code']){
            return d.properties['lsgi_code'];
        } else {
            return "NA"
        }
    }

    /* This large function creates the pi */
    function resultPi(code){
        if(pie.destroy){
            pie.destroy();
        }
        console.log(code);
        var result = results[currMap+currYear];
        var ourResult = result[code];
        console.log(ourResult);
        var content = [];
        var totalseats = 0;
        for(var key in ourResult){
            if (ourResult.hasOwnProperty(key)){
                var value = ourResult[key];
                var pieobj = {}
                pieobj["label"] = key;
                pieobj["value"] = value;
                totalseats = totalseats + value;
                pieobj["color"] = partyColor(key);
                content.push(pieobj);
            }
        }
        console.log(content);
        pie = new d3pie("pieChart", {
            "header": {
        		"title": {
        			"text": "SEATS",
        			"fontSize": 22,
        			"font": "verdana"
        		},
        		"subtitle": {
        			"text": "TOTAL SEATS WON BY EACH PARTY",
        			"color": "#999999",
        			"fontSize": 10,
        			"font": "verdana"
        		},
        		"titleSubtitlePadding": 12
        	},"footer": {
        		"text": "TOTAL : "+totalseats.toString(),
        		"color": "#999999",
        		"fontSize": 11,
        		"font": "open sans",
        		"location": "bottom-center"
        	},
        	"size": {
        		"canvasHeight": 400,
        		"canvasWidth": 590,
        		"pieInnerRadius": "49%",
        		"pieOuterRadius": "88%"
        	},
        	"data": {
        		"smallSegmentGrouping": {
        			"enabled": true,
        			"value": 0,
        			"color": "#000000"
        		},
        		"content": content
        	},
        	"labels": {
        		"outer": {
        			"format": "label-percentage1",
        			"pieDistance": 32
        		},
        		"inner": {
        			"format": "value"
        		},
        		"mainLabel": {
        			"font": "verdana"
        		},
        		"percentage": {
        			"color": "#e1e1e1",
        			"font": "verdana",
        			"decimalPlaces": 0
        		},
        		"value": {
        			"color": "#e1e1e1",
        			"font": "verdana"
        		},
        		"lines": {
        			"enabled": true,
        			"style": "straight"
        		},
        		"truncation": {
        			"enabled": true
        		}
        	},
        	"tooltips": {
        		"enabled": true,
        		"type": "placeholder",
        		"string": "{label}: {value}, {percentage}%"
        	},
        	"effects": {
        		"pullOutSegmentOnClick": {
        			"effect": "linear",
        			"speed": 400,
        			"size": 8
        		}
        	},
        	"misc": {
        		"colors": {
        			"background": "#ffffff"
        		}
        	}
        });
    };

    function partyColor(party){
        switch(party){
            case "CPI(M)":
                return("#fe0000");
            case "CPI":
                return("#eb8091");
            case "INC":
                return("#1bb7d8");
            case "BJP":
                return("#ff6400");
            case "INDEPENDENT":
                return("#ffdc00");
            case "ML":
                return("#36bc33");
            case "NCP":
                return("#de8be2");
            case "SJ(D)":
                return("#81d995");
            case "KC(M)":
                return("#08fad2");
            case "JD(S)":
                return("#bca21f");
            case "N/A":
                return("#efefef");
            case "CONG(S)":
                return "#9d3737";
            case "DIC(K)":
                return "#386a7e";
            case "JSS":
                return "#e260c7";
            case "KC(S)":
                return "#722df3";
            default:
                return("#000000");
        }
    };

    function getAreaInfo(code) {
        if(populations[code]){
            var info = populations[code];
        } else {
            console.log('undefined pop');
            var info = "Could not find data";
        }
        return 'population = '+info['total'];
    }

    document.addEventListener('gpmaploaded', function(e) {
        console.log("event fired. Map will be created");
        mapcreator(maps[currMap+currYear]);
        $('.loading').hide();
        $('.content').show();
    });
    $('.mapchooser').on('click', function(e){
        e.preventDefault();
        var classes = this.className.split(' ');
        var maptype = classes[classes.length - 1];
        currMap = maptype;
        mapfetch(currMap, currYear);
    });
    $('.yearchooser').on('click', function(e){
        e.preventDefault();
        var classes = this.className.split(' ');
        var mapyear = classes[classes.length - 1];
        currYear = mapyear;
        mapfetch(currMap, currYear);
    });
    (function init(){
        $('.content').hide();
        mapfetch(currMap, currYear);
    })();
})();
