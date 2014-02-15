package net.k2co3.calendar;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

public class FpdccCalendar {
	private static final SimpleDateFormat timeFormat = new SimpleDateFormat("yyyy-M-d h:mm aa");
	public static final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-M-d");
	
	private static final String dayUrl = "http://ec.volunteernow.com/custom/1405/cal/day_data.php?&start=";
	private static final String eventUrl = "http://ec.volunteernow.com/custom/1405/cal/ss_data.php";
	
	public static List<Event> getEvents(Date start, Date end) throws MalformedURLException, IOException {
		List<Event> events = new ArrayList<Event>();
		DateEnumeration dates = new DateEnumeration(start, end);
		while (dates.hasMoreElements()) {
			try {
				events.addAll(getEvents(dates.nextElement()));
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		
		return events;
	}
	
	public static List<Event> getEvents(Date date) throws MalformedURLException, IOException {
		String d = dateFormat.format(date);
		Document doc = Jsoup.parse(new URL(dayUrl + d), 3000);
		return getEvents(doc);
	}
	
	public static List<Event> getEvents(Document doc) throws IOException {
		Elements titles = doc.select("h3");
		List<Event> events = new ArrayList<Event>(titles.size());
		
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
			
			Document ss = Jsoup.connect(eventUrl)
					.data("guid", guid, "date", date).post();
			String times = ss.select(".time").text();
			
			try {
				setTimes(event, date, times);
			} catch (ParseException e1) {
				e1.printStackTrace();
			}
			
			events.add(event);
		}
		
		return events;
	}
	
	public static void setTimes(Event event, String date, String time) throws ParseException {
		String[] times = time.split(" - ");
		
		event.setStart(timeFormat.parse(date + " " + times[0]));
		if (times.length > 1) {
			event.setEnd(timeFormat.parse(date + " " + times[1]));
		}
	}
}