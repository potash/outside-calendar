package net.k2co3.calendar;

import java.util.Calendar;
import java.util.Date;
import java.util.Iterator;

public class DateRange implements Iterable<Date> {
	
	class DateIterator implements Iterator<Date> {
		private Calendar calendar;
		private Date next, end;
		
		DateIterator(Date start, Date end) {
			calendar = Calendar.getInstance();
			calendar.setTime(start);
			next = calendar.getTime();
			this.end = end;
		}
		
		public boolean hasNext() {
			return next.compareTo(end) <= 0;
		}

		public Date next() {
			Date temp = next;
			
			calendar.add(Calendar.DATE, 1);
			next = calendar.getTime();
			
			return temp;
		}

		public void remove() {
			throw new UnsupportedOperationException();
		}
	}
	private Iterator<Date> iterator;
	
	public DateRange(Date start, Date end) {
		iterator = new DateIterator(start, end);
	}
	
	// total number of days
	public DateRange(Date start, int numDays) {
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(start);
		calendar.add(Calendar.DATE,  numDays-1);
		iterator = new DateIterator(start, calendar.getTime());
	}

	public Iterator<Date> iterator() {
		return iterator;
	}

	
}
