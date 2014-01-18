var filterKeyword = "";
var locations = {};
var map;
var tooltip;

// case insensitive substring check
function contains(s, t) {
	return s && s.toUpperCase().indexOf(t.toUpperCase()) >= 0;
}

// render events, including hiding them and managing map markers
var renderEvent = function(event, element, view) {
	if (event.source.filtered) {
		return hideEvent(event);
	}

	if (!contains(event.title + event.descriotion, filterKeyword)) {
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
		$.getJSON('https://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=' + location,
			function(data) {
				var l = locations[location];
				l.location = location;

				if (data.results.length > 0) {
					l.latLng = L.latLng(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng);
					l.marker = L.marker(l.latLng);
					l.marker.bindPopup(location);
					l.marker.addTo(map);
				} else {
					console.warn("No results for location: " + location);
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
	var calendar = $(selector);
		
	
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
		var calendar = $("#calendar");

		sources.forEach(function(s) {
			$("<input/>", {type:"checkbox", checked:true}).click(function() {
				if($(this).is(":checked")) {
					console.log(s.title);
					s.filtered = false;	
				} else {
					console.log("unchecked");
					s.filtered = true;
				}
				calendar.fullCalendar("rerenderEvents");
			})
			.appendTo(sourceForm);
			$("<font></font>").text(s.title).css("background-color", s.color).css("color", "white").appendTo(sourceForm);
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
		},
		eventClick: function(data, event, view) {
			var content = '<h3>'+data.title+'</h3>' + 
				'<p><b>Start:</b> '+data.start+'<br />' + 
					data.description + 
					(data.end && '<p><b>End:</b> '+data.end+'</p>' || '');

				tooltip.set({
					'content.text': content
				}).reposition(event).show(event);

				// if its on the map, open the pop up
				if (data.location && locations[data.location].latLng) {
					map.panTo(locations[data.location].latLng);
					locations[data.location].marker.openPopup();
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
}

function initMap(selector) {
	var chicago = new L.LatLng(41.878247, -87.629767);
	map = new L.Map(selector);
	map.setView(chicago, 10);

	var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data &copy; OpenStreetMap contributors';
	var osm = new L.TileLayer(osmUrl, {minZoom: 8, maxZoom: 12, attribution: osmAttrib});
	map.addLayer(osm);
}
