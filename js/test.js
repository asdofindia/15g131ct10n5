var pie = new d3pie("pieChart", {
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
	},
	"footer": {
		"text": "TOTAL : 20",
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
		"content": [
			{
				"label": "CPI(M)",
				"value": 12,
				"color": "#fe0000"
			},
			{
				"label": "CPI",
				"value": 0,
				"color": "#eb8091"
			},
			{
				"label": "INC",
				"value": 1,
				"color": "#1bb7d8"
			},
			{
				"label": "BJP",
				"value": 0,
				"color": "#ff6400"
			},
			{
				"label": "INDEPENDENT",
				"value": 1,
				"color": "#ffdc00"
			},
			{
				"label": "IUML",
				"value": 3,
				"color": "#36bc33"
			},
			{
				"label": "NCP",
				"value": 0,
				"color": "#de8be2"
			},
			{
				"label": "SJ(D)",
				"value": 3,
				"color": "#81d995"
			},
			{
				"label": "KC(M)",
				"value": 0,
				"color": "#08fad2"
			}
		]
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
