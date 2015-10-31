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
    var reverseCodes = {};

    var width = 800;
    var height = 500;

    var pie = {};

    var currMap = 'gp';
    var currYear = '2010';
    var currPlace = null;

    function mapfetch(maptype, mapyear) {
        var mapname = maptype + mapyear;
        if(maps[mapname]){
            var maploadevent = new CustomEvent('gpmaploaded');
            document.dispatchEvent(maploadevent);
        } else {
            showLoading();
            d3.json('data/maps/' + mapyear + '/' + maptype + '.geojson' + '?' + Math.floor(Math.random() * 1000), function(d) {
                maps[mapname] = d;
                var maploadevent = new CustomEvent('gpmaploaded');
                document.dispatchEvent(maploadevent);
            });
        }
    }

    function resultfetch() {
        var resultname = currMap + currYear;
        if(results[resultname]){
            resultPi();
        } else {
            d3.csv('data/results/' + currYear + '/' + currMap + '.csv' + '?' + Math.floor(Math.random() * 1000), function(d){
                results[resultname] = {};
                // console.log(d);
                for(var i = 0; i < d.length; i++) {
                    var code = guessAreaCode(d[i]["area"], currMap.slice(0,1).toUpperCase());
                    results[resultname][code] = results[resultname][code] || {};
                    if(typeof results[resultname][code][d[i]["party"]] != 'undefined') {
                        results[resultname][code][d[i]["party"]] = results[resultname][code][d[i]["party"]] + 1;
                    } else {
                        results[resultname][code][d[i]["party"]] = 1;
                    }
                    // console.log(results[resultname][code]);
                    // console.log(results[resultname][code][d[i]["party"]]);
                }
                // console.log(results[resultname]);
                resultPi();
            });
        }
    };

    function fundfetch(){
        if(funds[currMap]){
            fundrender();
        } else {
            d3.json('data/funds/' + currMap + '.json' + '?' + Math.floor(Math.random() * 1000), function(d){
                // console.log(d);
                funds[currMap] = d;
                // console.log(funds[currMap]);
                fundrender();
            });
        }
    }

    var vis = d3.select('.map').append('svg')
        .attr('width', width).attr('height', height);

    function fetchInit() {
        mapfetch(currMap, currYear);
        d3.json('data/population.json' + '?' + Math.floor(Math.random() * 1000), function(d) {
            for (var i = 0; i < d.length; i++) {
                populations[d[i]['lsgi_code']] = d[i];
            }
        });
        d3.json('data/codes.json' + '?' + Math.floor(Math.random() * 1000), function(d){
            codes = d;
            for(var code in codes) {
                var englishnames = codes[code]["en"];
                englishnames.forEach(function(engname){
                    reverseCodes[code.slice(0,1).toUpperCase()+engname] = code;
                });
            }
            // console.log(reverseCodes);
        });
        selectionUpdate();
    }

    function mapcreator(map) {
        // console.log(map);
        var projection = d3.geo.mercator().scale(1).translate([0, 0]);
        var path = d3.geo.path().projection(projection);
        var bounds = path.bounds(map);
        var scale = .95 / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height);
        var transl = [((width - scale * (bounds[1][0] + bounds[0][0])) / 2) - 150, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];
        projection.scale(scale).translate(transl);

        var mapfeatures = vis.selectAll('path').data(map.features);

        mapfeatures
            .enter()
                .append('path')
                .attr('d', path)
                .attr('class', function(d) {
                    var areaShortCode = d.properties['lsgi_code'].slice(0,1);
                    // console.log(areaShortCode + ' ' + currMap);
                    if (areaShortCode === 'M') {
                        if (currMap !='gp') {
                            return 'area disabled';
                        }
                    }
                    return 'area';
                })
                .attr('id', function(d) {
                    return d.properties['lsgi_code']
                })
                .attr('title', function(d) {
                    return d.properties['PANCHAYAT']
                })
                .on('click', clicked);

        mapfeatures
            .attr('d', path)
            .attr('class', function(d) {
                var areaShortCode = d.properties['lsgi_code'].slice(0,1);
                // console.log(areaShortCode + ' ' + currMap);
                if (areaShortCode === 'M') {
                    if (currMap !='gp') {
                        return 'area disabled';
                    }
                }
                return 'area';
            })
            .attr('id', function(d){
                return d.properties['lsgi_code']
            })
            .attr('title', function(d) {
                return d.properties['PANCHAYAT']
            });

        mapfeatures
            .exit()
                .remove();
    };

    function isDisabled(lsgi) {
        var areaShortCode = lsgi.slice(0,1);
        if (areaShortCode === 'M') {
            if (currMap !='gp') {
                return true;
            }
        }
        return false;
    }

    function clicked(d) {
        if (isDisabled(d.properties['lsgi_code'])) {
            return;
        }
        showAreaStuff();
        currPlace = getcode(d);
        // console.log("setting currPlace as " + currPlace);
        setAreaInfo();
        resultfetch();
        fundfetch();
    }

    function setAreaInfo() {
        var data = getAreaInfo(currPlace);
        var placeTypeName = '';
        switch (currPlace.slice(0,1)) {
            case 'M':
                if(currPlace.indexOf('KD') > -1) {
                    placeTypeName = "Corporation";
                } else {
                    placeTypeName = "Municipality";
                }
                break;
            case 'G':
                placeTypeName = "Village Panchayat";
                break;
            case 'B':
                placeTypeName = 'Block Panchayat';
                break;
            case 'D':
                placeTypeName = 'District Panchayat';
                break;
            default:
                placeTypeName = '';
        }
        d3.select('#areaNameEn').text(codes[currPlace]["en"][0] + " " + placeTypeName);
        d3.select('#areaNameMl').text(codes[currPlace]["ml"][0]);
        if (data.merged){
            d3.select('#population').text("Got merged to Kozhikode corporation after 2005");
            d3.select('#sexratio').text("");
        } else {
            d3.select('#population').text("Population: " + data.total);
            d3.select('#sexratio').text("Sex Ratio: "+ data.sexratio + " (women per 1000 men)")
        }

    }

    function getcode(d) {
        // console.log(d['PANCHAYAT']);
        var guess = guessAreaCode(d.properties['PANCHAYAT'], currMap.slice(0,1).toUpperCase());
        if(guess!="FAIL"){
            return guess
        }
        if (d.properties['lsgi_code']){
            return d.properties['lsgi_code'];
        } else {
            return 'NA'
        }
    }

    /* This large function creates the pi */
    function resultPi(){
        if(pie.destroy){
            pie.destroy();
        }
        var result = results[currMap+currYear];
        var ourResult = result[currPlace];
        var content = [];
        var totalseats = 0;
        for(var key in ourResult){
            if (ourResult.hasOwnProperty(key)){
                var value = ourResult[key];
                var pieobj = {}
                pieobj['label'] = key;
                pieobj['value'] = value;
                totalseats = totalseats + value;
                pieobj['color'] = partyColor(key);
                content.push(pieobj);
            }
        }
        // console.log(content);
        pie = new d3pie('pieChart', {
            'header': {
                'title': {
                    'text': 'SEATS',
                    'fontSize': 22,
                    'font': 'verdana'
                },
                'subtitle': {
                    'text': 'TOTAL SEATS WON BY EACH PARTY\nരാഷ്ട്രീയകക്ഷികള്‍ക്കു് കിട്ടിയ സീറ്റുകള്‍ ',
                    'color': '#999999',
                    'fontSize': 10,
                    'font': 'verdana'
                },
                'titleSubtitlePadding': 12
            },'footer': {
                'text': 'TOTAL : '+totalseats.toString(),
                'color': '#000',
                'fontSize': 16,
                'font': 'open sans',
                'location': 'bottom-center'
            },
            'size': {
                'canvasHeight': 400,
                'canvasWidth': 590,
                'pieInnerRadius': '49%',
                'pieOuterRadius': '88%'
            },
            'data': {
                'smallSegmentGrouping': {
                    'enabled': true,
                    'value': 0,
                    'color': '#000000'
                },
                'content': content
            },
            'labels': {
                'outer': {
                    'format': 'label-percentage1',
                    'pieDistance': 32
                },
                'inner': {
                    'format': 'value'
                },
                'mainLabel': {
                    'font': 'verdana'
                },
                'percentage': {
                    // 'color': '#e1e1e1',
                    'color': '#000',
                    'font': 'verdana',
                    'decimalPlaces': 0
                },
                'value': {
                    'color': '#000',
                    'font': 'verdana',
                    'fontSize': 15
                },
                'lines': {
                    'enabled': true,
                    'style': 'straight'
                },
                'truncation': {
                    'enabled': true
                }
            },
            'tooltips': {
                'enabled': true,
                'type': 'placeholder',
                'string': '{label}: {value}, {percentage}%'
            },
            'effects': {
                'pullOutSegmentOnClick': {
                    'effect': 'linear',
                    'speed': 400,
                    'size': 8
                }
            },
            'misc': {
                'colors': {
                    'background': '#ffffff'
                }
            }
        });

        // this is also the ideal time to set the selection on path.
        // $('.selectedArea').removeClass('selectedArea');
        // $('path#' + currPlace).addClass('selectedArea');
        d3.select('.selectedArea').classed('selectedArea', false);
        d3.select('#'+currPlace).classed('selectedArea', true);
    };

    function partyColor(party){
        switch(party){
            case 'CPI(M)':
                return '#fe0000';
            case 'CPI':
                return '#eb8091';
            case 'INC':
                return '#1bb7d8';
            case 'BJP':
                return '#ff6400';
            case 'INDEPENDENT':
                return '#ffdc00';
            case 'ML':
                return '#36bc33';
            case 'NCP':
                return '#de8be2';
            case 'SJ(D)':
                return '#81d995';
            case 'KC(M)':
                return '#08fad2';
            case 'JD(S)':
                return '#bca21f';
            case 'N/A':
                return '#efefef';
            case 'CONG(S)':
                return '#9d3737';
            case 'DIC(K)':
                return '#386a7e';
            case 'JSS':
                return '#e260c7';
            case 'KC(S)':
                return '#722df3';
            default:
                return('#000000');
        }
    };

    function fundrender(){
        // console.log("currMap is " + currMap);
        // console.log(funds[currMap]);
        var fundAllocated = funds[currMap][currPlace];
        var lists = [["Infrastructure"],["Productive"],["Service"]];
        for (var year = 0; year < fundAllocated.length; year++){
            for (var listNum = 0; listNum < 3; listNum++) {
                lists[listNum].push(fundAllocated[year][listNum]);
            }
        }
        var chart = c3.generate({
            bindto: '#fundChart',
            size: {
                height: 200
            },
            data: {
                columns: lists,
                types: {
                    Infrastructure: 'bar',
                    Productive: 'bar',
                    Service: 'bar'
                }
            },
            axis: {
                x: {
                    type: 'category',
                    categories: ['2012-13', '2013-14', '2014-15', '2015-16']
                },
                y: {
                    label: {
                        text: 'Fund allocated (in lakhs)',
                        position: 'outer-middle'
                    }
                }
            }
        });
        // chart.load();
        document.querySelector("#fundHead").style.display = "block";
    };

    function getAreaInfo(code) {
        return populations[code];
    }

    function guessAreaCode(areaName, areaType) {
        // console.log(codes);
        // $.each(codes, function(code, names){
        //     console.log(code.slice(0,1)+areaType);
        //     if(code.slice(0,1)===areaType) {
        //         if(names["en"].indexOf(areaName) > -1){
        //             return code;
        //         }
        //     }
        // });
        if(areaName && areaName.length <= 4) {
            return areaName;
        }
        if (reverseCodes[areaType + areaName] != undefined) {
            return reverseCodes[areaType + areaName];
        } else {
            // console.log('failed to find ' + areaName + ' in codes');
            return "FAIL";
        }
    }

    document.addEventListener('gpmaploaded', function(e) {
        // console.log('event fired. Map will be created');
        mapcreator(maps[currMap+currYear]);
        $('.loading').hide();
        $('.content').show();
    });
    $('.mapchooser').on('click', function(e){
        e.preventDefault();
        hideAreaStuff();
        var classes = this.className.split(' ');
        var maptype = classes[classes.length - 1];
        currMap = maptype;
        selectionUpdate();
        mapfetch(currMap, currYear);
    });
    $('.yearchooser').on('click', function(e){
        e.preventDefault();
        var classes = this.className.split(' ');
        var mapyear = classes[classes.length - 1];
        currYear = mapyear;
        selectionUpdate();
        mapfetch(currMap, currYear);
        resultfetch();
    });

    function selectionUpdate(){
        $('.active').removeClass('active');
        $('.' + currYear).addClass('active');
        $('.' + currMap).addClass('active');
    }

    function showLoading() {
        $('.loading').show();
        $('.content').hide();
    }

    function hideAreaStuff(){
        $('.areaInfo').hide();
        $('#pieChart').hide();
        $('#fundRow').hide();
    }

    function showAreaStuff() {
        $('.areaInfo').show();
        $('#pieChart').show();
        $('#fundRow').show();
    }

    (function init(){
        $('.content').hide();
        fetchInit();
    })();
})();
