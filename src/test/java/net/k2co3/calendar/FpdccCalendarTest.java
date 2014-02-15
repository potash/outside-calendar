package net.k2co3.calendar;

import java.io.IOException;
import java.io.InputStream;
import java.text.ParseException;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.Test;

public class FpdccCalendarTest {

	@Test
	public void testGetEvents() throws IOException, ParseException {
		FpdccCalendar.getEvents(FpdccCalendar.dateFormat.parse("2013-12-25"), FpdccCalendar.dateFormat.parse("2014-1-10"));
	}
	
	@Test
	public void test() throws IOException {
		InputStream in = getClass().getClassLoader().getResourceAsStream("day_data.php");
		Document doc = Jsoup.parse(in, null, "");
		FpdccCalendar.getEvents(doc);
	}
	
	@Test
	public void voidTestDateFormat() throws ParseException {
		String time = "9:00 am - 12:00 pm";
		String date = "2014-2-22";
		Event event = new Event();
		
		FpdccCalendar.setTimes(event, date, time);
		System.out.println(event);
	}

}
