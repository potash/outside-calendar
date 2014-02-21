package net.k2co3.calendar;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class FpdccCalendar {
	private static final SimpleDateFormat timeFormat = getCSTDateFormat("yyyy-M-d h:mm aa");
	public static final SimpleDateFormat dateFormat = getCSTDateFormat("yyyy-M-d");
	
	private static final String dayUrl = "http://ec.volunteernow.com/custom/1405/cal/day_data.php?&start=";
	private static final String eventUrl = "http://ec.volunteernow.com/custom/1405/cal/ss_data.php";
	private static final String displayUrl = "https://ec.volunteernow.com/custom/1405/cal/events_by_day.php?d=";
	
	protected static boolean GET_EVENTS = true;
	
	public static SimpleDateFormat getCSTDateFormat(String pattern) {
		TimeZone CST = TimeZone.getTimeZone("CST");
		SimpleDateFormat format = new SimpleDateFormat(pattern);
		format.setTimeZone(CST);
		
		return format;
	}
	
	public static List<Event> getEvents(DateRange range) throws MalformedURLException, IOException {
		List<Event> events = new ArrayList<Event>();
		
		for (Date date : range) {
			try {
				events.addAll(getEvents(date));
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		
		return events;
	}
	
	public static List<Event> getEvents(Date date) throws MalformedURLException, IOException {
		String d = dateFormat.format(date);
		Document doc = Jsoup.parse(new URL(dayUrl + d), 0);
		List<Event> events = getEvents(doc);
		for (Event event : events) {
			event.setUrl(displayUrl + d);
		}
		return events;
	}
	
	public static List<Event> getEvents(Document doc) throws IOException {
		Elements titles = doc.select("h3");
		List<Event> events;
		if (titles.size() == 1 && titles.first().text().equals("No Opportunities found.")) {
			events = new ArrayList<Event>(0);
		} else {
			events = new ArrayList<Event>(titles.size());
			
			String date = doc.select("#selectedDay").attr("value");
			System.out.println(date);
			System.out.println(titles.size());
			for (Element e : titles) {
				Event event = new Event();
				
				e.select("span").remove();
				event.setTitle(e.text());
				
				Element div = e.nextElementSibling();
				
				Element info = div.child(0);
				info.select("span").remove();
				event.setDescription(info.text());
				
				Element input = div.select("input").first();
				String guid = input.attr("value");
				
				String times = null;
				if (GET_EVENTS) {
					Document ss = Jsoup.connect(eventUrl)
							.data("guid", guid, "date", date).timeout(0).post();
					times = ss.select(".time").text();
				}
				
				try {
					setTimes(event, date, times);
				} catch (ParseException e1) {
					e1.printStackTrace();
				}
				
				events.add(event);
			}
		}
		return events;
	}
	
	public static void setTimes(Event event, String date, String time) throws ParseException {
		if (time == null || time.isEmpty()) {
			event.setAllDay(true);
			event.setStart(timeFormat.parse(date + " 12:00 am"));
		} else {
			event.setAllDay(false);
			String[] times = time.split(" - ");
			event.setStart(timeFormat.parse(date + " " + times[0]));
			if (times.length > 1) {
				event.setEnd(timeFormat.parse(date + " " + times[1]));
			}
		}
	}
	
	public static void main(String[] args) throws MalformedURLException, IOException {
		ObjectMapper mapper = new ObjectMapper();
		mapper.setSerializationInclusion(Include.NON_NULL);
		mapper.enable(SerializationFeature.INDENT_OUTPUT);
		mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
		
		List<Event> events = FpdccCalendar.getEvents(new DateRange(new Date(), 31));
		mapper.writeValue(new File("fpdcc.json"), events);
		
//		List<Event> events = mapper.readValue(new File("/home/eric/www/fpdcc.json"), 
//				mapper.getTypeFactory().constructCollectionType(List.class, Event.class));
	}
}
