var eventSources;
var colors = ['Blue', 'Red', 'Green', 'Magenta', 'Brown', 'Orange', 'Purple', 'Gray'];

var filterKeyword = "";
var tooltip;

// map stuff
var map;
var activeLocation;
var defaultLatLng = new L.LatLng(41.878247, -87.629767); // Chicago
var defaultZoom = 8;
var locations = {};
var filterLocation;
var geocodingEnabled = true;

// tagging
var tags;
var filteredTags;
var hashtagRegex = /#\w*[a-z]\w*/gi;
var tagsCleared;

// DOM elements
var calendar;
var tagCheckboxes;
var tagDiv;

// case insensitive substring check
function contains(s, t) {
	return s && s.toUpperCase().indexOf(t.toUpperCase()) >= 0;
}

// http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
function replaceURLWithHTMLLinks(text) {
    var exp = /(\b(https?|ftp|file):\/\/([-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]))/ig;
    return text.replace(exp,"<a href='$1'>$3</a>"); 
}

// tags is a boolean-valued hashmap that encodes tags
function addTags(str, tags) {
	var matches = str.match(hashtagRegex);
	if (matches) {
		for (var i = 0; i < matches.length; i++) {
			tags[matches[i].substring(1)] = true;
		}
	}
}

function clearTags() {
	if (tagDiv) {
		tagDiv.remove();
	}
	tags = {};
	filteredTags = {};
	tagCheckboxes = [];
	tagsCleared = true;
}

function tagEvent(event) {
	if (event.tags == null) {
		event.tags = {};
		addTags(event.title, event.tags);
		addTags(event.description, event.tags);
	}
	
	for (tag in event.tags) {
		tags[tag] = true;
	}
}

// refresh sidebar controls
function refreshTags() {
	var tagForm = $("#tagForm");
	tagDiv = $("<div>");
	var sortedTags = Object.keys(tags).sort(); // get sorted array from map
	sortedTags.forEach(function(tag) {
		var label = $("<label>");
		var nobr = $("<nobr>"); // don't break line between checkbox and label
		var checkbox = $("<input>", {type:"checkbox", checked:false, class: "tagCheckbox"}).click(function() {
			if($(this).is(":checked")) {
				filteredTags[tag] = true;
			} else {
				filteredTags[tag] = false;
			}
			calendar.fullCalendar("rerenderEvents");
		}).appendTo(nobr);
		nobr.append(tag.replace('_', ' '));

		nobr.appendTo(label);
		label.appendTo(tagDiv);
		$("<text>").text(" ").appendTo(tagDiv); // empty text to allow line breaks
	});
	tagDiv.appendTo(tagForm);
	tagCheckboxes = $(".tagCheckbox");
	tagsCleared = false;
}

function isTagged(event) {
	var tagged = null;
	for (tag in filteredTags) {
		if (filteredTags[tag]) {
			if (tagged == null) {
				tagged = false;
			}
			if (event.tags && event.tags[tag]) {
				return true;
			}
		}
	}

	if (tagged == null) {
		return true;
	} else {
		return false; // tagged = null so filteredTags is empty
	}
}

// render events, including hiding them and managing map markers
var renderEvent = function(event, element, view) {
	var hide = false;

	if (event.source.filtered) {
		hide = true;
	} else if (!contains(event.title + event.descriotion, filterKeyword)) {
		hide = true;
	} else if (!isTagged(event)) {
		hide = true;
	} else if (filterLocation && event.location != filterLocation.name) {
		hide = true;
	}

	if (hide) {
		return hideEvent(event);
	} else {
		tagEvent(event);

		if (event.location != null && event.location.length > 0 && geocodingEnabled) {
				showMarker(event.location);
		}
	}
}

// show a marker at the given location
function showMarker(location) {
	if (locations[location] == null) {
		locations[location] = {};
		$.getJSON('http://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + location,
			function(data) {
				var l = locations[location];
				l.name = location;

				if (data.length > 0) {
					l.latLng = L.latLng(data[0].lat, data[0].lon);
					l.marker = L.marker(l.latLng)
					l.marker.bindPopup(l.name);
					l.marker.on("click", function() {
						//filterLocation = l;
					});
					l.marker.addTo(map);
				} else {
					console.warn("No geocoding results for address: " + l.name);
				}
			});
	} else {
		if (locations[location].marker != null) {
			locations[location].marker.addTo(map);
		}
	}
}

// hide all markers
function hideMarkers() {
	for (var l in locations) {
		if (locations[l].marker) {
			map.removeLayer(locations[l].marker);
		}
	}
}

function hideEvent(event) {
	if (event.marker) {
		map.removeLayer(event.marker);
	}
	return false;
}

function getLocation(address, callback) {
	$.getJSON('http://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + address, function(data) {  });
}
// jquery donetyping event a la http://stackoverflow.com/questions/14042193
;(function($){
	$.fn.extend({
		donetyping: function(callback,timeout){
			timeout = timeout || 1e3; // 1 second default timeout
			var timeoutReference,
				doneTyping = function(el){
					if (!timeoutReference) return;
					timeoutReference = null;
					callback.call(el);
				};
			return this.each(function(i,el){
				var $el = $(el);
				$el.is(':input') && $el.keypress(function(){
					if (timeoutReference) clearTimeout(timeoutReference);
					timeoutReference = setTimeout(function(){
						doneTyping(el);
					}, timeout);
				}).blur(function(){
					doneTyping(el);
				});
			});
		}
	});
})(jQuery);

function initCalendar(sources, geocoding) {
	if (geocoding != null) {
		geocodingEnabled = geocoding;
	}
	calendar = $("#calendar");
		
	var eventSources = sources.map(function(source, i) {
		return {url: source, color: colors[i % colors.length]};
	});

	var loaded = false;

	function initSidebar() {
		var sourceForm = $("#sourceForm");

		eventSources.forEach(function(s) {
			var label = $("<label/>");
			label.append($("<input/>", {type:"checkbox", checked:true}).click(function() {
				if($(this).is(":checked")) {
					s.filtered = false;	
				} else {
					s.filtered = true;
				}
				hideMarkers();
				calendar.fullCalendar("rerenderEvents");
			}));
			label.append($("<font></font>").text(s.title).css("background-color", s.color).css("color", "white"));
			sourceForm.append(label);
			sourceForm.append("<br/>");
		});
	}

	tooltip = $("#calendar").qtip({
			id: 'fullcalendar',
			prerender: true,
			content: {
				text: ' ',
				title: {
					button: true
				}
			},
			position: {
				my: 'left center',
				at: 'top center',
				target: 'mouse',
				viewport: $(window),
				adjust: {
					method: 'shift',
					mouse: false,
					scroll: false
				}
			},
			show: false,
			hide: false,
			style: 'qtip-light'
		}).qtip('api');

	calendar.fullCalendar({
		header: {
			left: 'prev,next today',
			center: 'title',
			right: 'month,agendaWeek,agendaDay'
		},
		//height: 600,
		editable: false,
		eventSources: eventSources,
		defaultView: "agendaWeek",
		slotMinutes: 30,
		loading: function(bool) {
			if (bool) {
				// TODO: make loading div more visible
				$('#loading').show();
			} else {
				$('#loading').hide();
				if (!loaded) {
					initSidebar();
				}
				loaded = true;
			}
		},
		eventRender: renderEvent,
		viewRender: function() {
			tooltip.hide();
			hideMarkers();
			clearTags();
		},
		eventAfterAllRender: function() {
			if (tagsCleared) {
				refreshTags();
			}
		},
		dayClick: function() {
        	tooltip.hide();	
    	},
		eventClick: function(data, event, view) {
			var content = '<h4><a href=\'' + data.url +'\'>'+data.title+'</a></h4>' + 
				'<h5><b>When:</b> '+ $.fullCalendar.formatDate(data.start, 'ddd MMM d, h:mm TT') + 
					(data.end && ' - '+ $.fullCalendar.formatDate(data.end, 'h:mm TT') || '') + '<br/>' +
					(data.location && '<b>Where:</b> '+data.location + '<br/>' || '') +
					'<b>Description:</b> ' + replaceURLWithHTMLLinks(data.description) + '</br></br>'+
				'</h5>';

				tooltip.set({
					'content.text': content
				}).reposition(event).show(event);

				// if there's an open popup, close it
				if (activeLocation && activeLocation.marker) {
					activeLocation.marker.closePopup();
				}

				// if its on the map, open the pop up
				if (data.location && locations[data.location] && locations[data.location].latLng) {
					//map.panTo(locations[data.location].latLng);
					locations[data.location].marker.openPopup();
					activeLocation = locations[data.location];
				} else {
					//map.setView(defaultLatLng, defaultZoom);
				}

				return false; // disable opening event url
			},
	});

	$('#keyword').donetyping(function(e) {
		filterKeyword = this.value;
		hideMarkers();
		calendar.fullCalendar("rerenderEvents");
	}, 500);

	initMap("map");

	$("#clearTags").click(function() {
		tagCheckboxes.prop("checked",false)
		filteredTags = [];
		calendar.fullCalendar("rerenderEvents");
	});

	$("#selectAllTags").click(function() {
		tagCheckboxes.prop("checked",true)
		filteredTags = tags; 
		calendar.fullCalendar("rerenderEvents");
	});
}

function initMap(selector) {
	map = new L.Map(selector);
	map.setView(defaultLatLng, defaultZoom);

	var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data &copy; OpenStreetMap contributors';
	var osm = new L.TileLayer(osmUrl, {minZoom: 7, maxZoom: 19, attribution: osmAttrib});
	map.addLayer(osm);
}
