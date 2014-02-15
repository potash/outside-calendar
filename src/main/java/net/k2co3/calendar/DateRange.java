package net.k2co3.calendar;

import java.util.Calendar;
import java.util.Date;
import java.util.Iterator;

public class DateRange implements Iterable<Date> {
	
	class DateIterator implements Iterator<Date> {
		private Calendar calendar;
		private Date next, end;
		
		DateIterator(Date start, Date end) {
			if (start.compareTo(end) > 0) {
				throw new IllegalArgumentException("End date must occur after start");
			}
			
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

	public Iterator<Date> iterator() {
		return iterator;
	}

	
}
