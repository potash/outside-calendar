var eventSources;

var filterKeyword = "";
var tooltip;

// map stuff
var map;
var activeLocation;
var filterLocation;

var options = {};

var defaultOptions =
	{ mapCenter : new L.LatLng(41.878247, -87.629767),
	  mapZoom : 8,
	  geocodingEnabled : true,
	  sourceFormDiv : null,
	  colors : ['Green', 'Blue', 'Red', 'Magenta', 'Brown', 'Orange', 'Purple', 'Gray'],
	  locations : [],
	  eventLocations: [] };

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

// tags is a set (actually boolean-valued map, but the value is irrelevant) of tags
function addTags(str, tags) {
	var matches = str.match(hashtagRegex);
	if (matches) {
		for (var i = 0; i < matches.length; i++) {
			tags[matches[i].substring(1)] = true;
		}
	}
}

// remove tags list and clean up
function clearTags() {
	if (options.tagDiv) {
		options.tagDiv.remove();
	}
	tags = {};
	filteredTags = {};
	tagCheckboxes = [];
	tagsCleared = true;
}

// parse the events tags from title and description
// add them to the global collection
function tagEvent(event) {
	if (event.tags == null) {
		event.tags = {};
		addTags(event.title, event.tags);
		if (event.description)
			addTags(event.description, event.tags);
	}
	
	for (tag in event.tags) {
		tags[tag] = true;
	}
}

// refresh sidebar tags
function refreshTags() {
	if (options.tagForm == null) {
		return;
	}

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
	tagDiv.appendTo(options.tagForm);
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
		showMarker(event.location);
	}
}

function getLocationAndShowMarker(location) {
	if (options.geocodingEnabled) {
		locations[location] = {};
		$.getJSON('http://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + location,
			function(data) {
				var l = locations[location];
				l.name = location;

				if (data.length > 0) {
					l.coords = [data[0].lat, data[0].lon];
					initMarker(l);
					l.marker.addTo(map);
				} else {
					console.warn("No geocoding results for address: " + l.name);
				}
			});
	}
}

// show a marker at the given location
function showMarker(location) {
	if (location == null || location.length == 0) {
	} else if (locations[location] == null) {
		getLocationAndShowMarker(location);
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

function initCalendar(userOptions) {
	$.extend(options, defaultOptions, userOptions);

	calendar = options.calendar;
		
	eventSources = sources.map(function(source, i) {
		if (typeof source == 'string') {
			return {url: source, color: options.colors[i % options.colors.length]};
		} else {
			return source;
		}
	});

	var loaded = false;

	initMap("map");
	locations = {};
	options.locations.forEach( function(g) { 
		locations[g.name] = g; 
		initMarker(g);
	} );

	tooltip = calendar.qtip({
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
			right: 'month,basicWeek,basicDay'
		},
		//height: 600,
		editable: false,
		eventSources: eventSources,
		eventDataTransform: locationTransform,
		defaultView: "basicWeek",
		slotMinutes: 30,
		loading: function(bool) {
			if (bool) {
				// TODO: make loading div more visible
				options.loading && options.loading.show();
			} else {
				options.loading && options.loading.hide();
				if (!loaded && options.sourceForm) {
					initSourceForm();
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
				'<h5><b>When:</b> '+ $.fullCalendar.formatDate(data.start, dateFormatString(data)) + 
					(data.end && ' - '+ $.fullCalendar.formatDate(data.end, 'h:mm TT') || '') + '<br/>' +
					(data.location && '<b>Where:</b> '+data.location + '<br/>' || '') +
					(data.description && '<b>Description:</b> ' + replaceURLWithHTMLLinks(data.description) || '') +
				'</h5>';

				tooltip.set({
					'content.text': content
				}).reposition(event).show(event);

				// if there's an open popup, close it
				if (activeLocation && activeLocation.marker) {
					activeLocation.marker.closePopup();
				}

				// if its on the map, open the pop up
				if (data.location && locations[data.location] && locations[data.location].marker) {
					//map.panTo(locations[data.location].latLng);
					locations[data.location].marker.openPopup();
					activeLocation = locations[data.location];
				} else {
					//map.setView(defaultLatLng, defaultZoom);
				}

				return false; // disable opening event url
			},
	});
	if (options.keywordInput) {
		options.keywordInput.donetyping(function(e) {
			filterKeyword = this.value;
			hideMarkers();
			calendar.fullCalendar("rerenderEvents");
		}, 500);
	}

	if (options.noTags) {
		options.noTags.click(function() {
			tagCheckboxes.prop("checked",false)
			filteredTags = [];
			calendar.fullCalendar("rerenderEvents");
		});
	}

	if (options.allTags) {
		options.allTags.click(function() {
			tagCheckboxes.prop("checked",true)
			filteredTags = tags; 
			calendar.fullCalendar("rerenderEvents");
		});
	}
}

function initMap(selector) {
	map = new L.Map(selector);
	map.setView(options.mapCenter, options.mapZoom);

	var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data &copy; OpenStreetMap contributors';
	var osm = new L.TileLayer(osmUrl, {minZoom: 7, maxZoom: 19, attribution: osmAttrib});
	map.addLayer(osm);
}

function initSourceForm() {
	var sourceForm = options.sourceForm;

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

// if the event is all day don't include the time in the format
function dateFormatString(event) {
	if (event.allDay) {
	  return 'ddd MMM d';
	} else {
	  return 'ddd MMM d, h:mm TT';
	}
}

function initMarker(l) {
	l.marker = L.marker(l.coords);
	l.marker.bindPopup(l.name);
	l.marker.on("click", function() {
		//filterLocation = l;
	});
}

function locationTransform(event) {
	for(var i = 0; i < options.eventLocations.length; i++) {
		if ( event.title.match(options.eventLocations[i].regex) != null) {
			event.location = options.eventLocations[i].name;
			return event;
		}
	}
	return event;
}