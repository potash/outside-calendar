package net.k2co3.calendar;

import java.util.Date;

import lombok.Data;

public @Data class Event {
	private String title;
	private String description;
	private String location;

	private Date start;
	private Date end;
}
