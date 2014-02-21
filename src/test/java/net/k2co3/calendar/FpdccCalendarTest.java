package net.k2co3.calendar;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.text.ParseException;
import java.util.Date;
import java.util.List;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.Test;

import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationConfig;
import com.fasterxml.jackson.databind.SerializationFeature;

public class FpdccCalendarTest {

	@Test
	public void testGetEventsRange() throws IOException, ParseException {
		FpdccCalendar.getEvents(new DateRange(new Date(), 1));
	}
	
	@Test
	public void testGetEventsDoc() throws IOException {
		InputStream in = getClass().getClassLoader().getResourceAsStream("day_data.php");
		Document doc = Jsoup.parse(in, null, "");
		FpdccCalendar.getEvents(doc);
	}
	
	@Test
	public void testWriteEvents() throws IOException {
		InputStream in = getClass().getClassLoader().getResourceAsStream("day_data.php");
		Document doc = Jsoup.parse(in, null, "");
		FpdccCalendar.GET_EVENTS = false;
		List<Event> events = FpdccCalendar.getEvents(doc);
		
		ObjectMapper mapper = new ObjectMapper();
		mapper.setSerializationInclusion(Include.NON_NULL);
		mapper.enable(SerializationFeature.INDENT_OUTPUT);
		mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
		
		mapper.writeValue(new File("fpdcc.json"), events);
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
