package net.k2co3.calendar;

import java.util.Calendar;
import java.util.Date;
import java.util.Enumeration;

public class DateEnumeration implements Enumeration<Date> {
	private Calendar calendar;
	private Date next, after, end;
	
	public DateEnumeration(Date start, Date end) throws IllegalArgumentException {
		if (start.compareTo(end) > 0) {
			throw new IllegalArgumentException("End date must occur after start");
		}
		
		calendar = Calendar.getInstance();
		calendar.setTime(start);
		next = calendar.getTime();
		this.end = end;
	}

	public boolean hasMoreElements() {
		return next.compareTo(end) <= 0;
	}

	public Date nextElement() {
		Date temp = next;
		
		calendar.add(Calendar.DATE, 1);
		next = calendar.getTime();
		
		return temp;
	}
}
