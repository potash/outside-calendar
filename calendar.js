var filterKeyword = "";
var tooltip;

// map stuff
var map;
var activeLocation;
var defaultLatLng = new L.LatLng(41.878247, -87.629767); // Chicago
var defaultZoom = 9;
var locations = {};

// tagging
var tags;
var filteredTags;
var hashtagRegex = /\#\w+/g;
var staleTags;

// DOM elements
var calendar;
var tagCheckboxes;
var tagDiv;

// case insensitive substring check
function contains(s, t) {
	return s && s.toUpperCase().indexOf(t.toUpperCase()) >= 0;
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

// collect distinct tags from events and refresh sidebar controls
function refreshTags() {
	if (tagDiv) {
		tagDiv.remove();
	}
	tags = {};
	filteredTags = {};
	tagCheckboxes = [];

	var events = calendar.fullCalendar("clientEvents");
	for (var i = 0; i < events.length; i++) {
		var event = events[i];
		if (event.tags == null) {
			event.tags = {};
			addTags(event.title, event.tags);
			addTags(event.description, event.tags);

			for (tag in event.tags) {
				tags[tag] = true;
			}
		}
	}

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
		nobr.append(tag);

		nobr.appendTo(label);
		label.appendTo(tagDiv);
		$("<text>").text(" ").appendTo(tagDiv); // empty text to allow line breaks
	});
	tagDiv.appendTo(tagForm);

	tagCheckboxes = $(".tagCheckbox");
}

// render events, including hiding them and managing map markers
var renderEvent = function(event, element, view) {
	if (event.source.filtered) {
		return hideEvent(event);
	}

	if (!contains(event.title + event.descriotion, filterKeyword)) {
		return hideEvent(event);
	}

	var tagged = null;
	for (tag in filteredTags) {
		if (filteredTags[tag]) {
			if (tagged == null) {
				tagged = false;
			}
			if (event.tags && event.tags[tag]) {
				tagged = true;
				break;
			}
		}
	}
	if (tagged == false) {
		return hideEvent(event);
	}


	if (event.location != null && event.location.length > 0) {
			showMarker(event.location);
	}
}

// show a marker at the given location
function showMarker(location) {
	if (locations[location] == null) {
		locations[location] = {};
		$.getJSON('http://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + location,
			function(data) {
				var l = locations[location];
				l.location = location;

				if (data.length > 0) {
					l.latLng = L.latLng(data[0].lat, data[0].lon);
					l.marker = L.marker(l.latLng);
					l.marker.bindPopup(location);
					l.marker.addTo(map);
				} else {
					console.warn("No geocoding results for address: " + location);
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

function initCalendar(selector) {
	calendar = $(selector);
		
	sources = [
			{
			 url: 'https://www.google.com/calendar/feeds/habitat2030%40gmail.com/public/basic',
			 color: 'purple'
			},
			{
			 url:'https://www.google.com/calendar/feeds/vi7emldooebjk83viv63mmac74%40group.calendar.google.com/public/basic',
			 color: 'green'
			},
			{
			 url:'https://www.google.com/calendar/feeds/qulevcs6r5qv1t6ooie2f9dhu8%40group.calendar.google.com/public/basic',
			 color:'blue'
			},
			{
			 url:'https://www.google.com/calendar/feeds/c3mk91p1452cdm9umg24oaeeo4%40group.calendar.google.com/public/basic',
			 color:'red'
			},
			{
			 url:'https://www.google.com/calendar/feeds/fermilabnaturalareas%40gmail.com/public/basic',
			 color: 'orange'
			}
		];

	
	var loaded = false;

	function initSidebar() {
		var sourceForm = $("#sourceForm");

		sources.forEach(function(s) {
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
				my: 'bottom center',
				at: 'top center',
				target: 'mouse',
				viewport: $('#calendar'),
				adjust: {
					mouse: false,
					scroll: false
				}
			},
			show: false,
			hide: false,
			style: 'qtip-light'
		}).qtip('api');

	$('#calendar').fullCalendar({
		header: {
			left: 'prev,next today',
			center: 'title',
			right: 'month,agendaWeek'
		},
		height: 500,
		editable: false,
		eventSources: sources,
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
			staleTags = true;
		},
		eventAfterAllRender: function() {
			if (staleTags) {
				refreshTags();
				staleTags = false;
			}
		},
		eventClick: function(data, event, view) {
			var content = '<h3>'+data.title+'</h3>' + 
				'<b>Start:</b> '+data.start+'<br />' + 
					(data.end && '<b>End:</b> '+data.end || '') + '<br/>' +
					'<b>Description:</b> ' + data.description;

				tooltip.set({
					'content.text': content
				}).reposition(event).show(event);

				// if there's an open popup, close it
				if (activeLocation && activeLocation.marker) {
					activeLocation.marker.closePopup();
				}

				// if its on the map, open the pop up
				if (data.location && locations[data.location].latLng) {
					//map.panTo(locations[data.location].latLng);
					locations[data.location].marker.openPopup();
					activeLocation = locations[data.location];
				} else {
					map.setView(defaultLatLng, defaultZoom);
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
	var osm = new L.TileLayer(osmUrl, {minZoom: 7, maxZoom: 12, attribution: osmAttrib});
	map.addLayer(osm);
}
