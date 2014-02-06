outside-calendar
================

Calendar that aggregates events from many sources providing filters and a map.

## Usage

Initialize the calendar with a list of Google calendar feeds like so:

		sources = ['http://www.google.com/calendar/feeds/usa__en%40holiday.calendar.google.com/public/basic',
			 'https://www.google.com/calendar/feeds/habitat2030%40gmail.com/public/basic',
			 'https://www.google.com/calendar/feeds/vi7emldooebjk83viv63mmac74%40group.calendar.google.com/public/basic',
			 'https://www.google.com/calendar/feeds/qulevcs6r5qv1t6ooie2f9dhu8%40group.calendar.google.com/public/basic',
			 'https://www.google.com/calendar/feeds/c3mk91p1452cdm9umg24oaeeo4%40group.calendar.google.com/public/basic',
			 'https://www.google.com/calendar/feeds/fermilabnaturalareas%40gmail.com/public/basic'];

		initCalendar(sources);
