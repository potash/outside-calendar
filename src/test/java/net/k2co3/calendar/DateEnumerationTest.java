package net.k2co3.calendar;

import java.text.ParseException;
import java.text.SimpleDateFormat;

import org.junit.Test;

public class DateEnumerationTest {

	@Test
	public void test() throws IllegalArgumentException, ParseException {
		SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-M-d");
		DateEnumeration dates = new DateEnumeration(dateFormat.parse("2013-12-25"), dateFormat.parse("2014-1-10"));
		
		while (dates.hasMoreElements()) {
			System.out.println(dates.nextElement());
		}
	}

}
