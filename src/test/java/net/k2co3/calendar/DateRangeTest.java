package net.k2co3.calendar;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.junit.Test;

public class DateRangeTest {

	@Test
	public void test() throws ParseException {
		SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-M-d");
		DateRange dates = new DateRange(dateFormat.parse("2013-12-25"), dateFormat.parse("2014-1-10"));
		
		for (Date date : dates) {
			System.out.println(date);
		}
	}
	
	@Test
	public void testNumDays() throws ParseException {
		DateRange dates = new DateRange(new Date(), 10);
		
		for (Date date : dates) {
			System.out.println(date);
		}
	}
}
