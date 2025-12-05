/** @module documents */

import CalendarDays from "./calendarDays.mjs";
import Calendar from "./calendar.mjs";
import CalendarMonths from "./calendarMonths.mjs";
import Chapter from "./chapter.mjs";
import ChapterType from "./chapterType.mjs";
import Entry from "./entry.mjs";
import EntryType from "./entryType.mjs";
import EntryEvent from "./event.mjs";
import LineageTree from "./lineageTree.mjs";
import LineageEntry from "./lineageEntry.mjs";
import Section from "./section.mjs";
import Relevance from "./relevance.mjs";
import Tome from "./tome.mjs";
import Timeline from "./timeline.mjs";
import MapAtlas from "./map.mjs";
import MapElement from "./mapElement.mjs";
import TextImage from "./textImage.mjs";
import Setting from "./setting.mjs";
import BaseDocument from "./base.mjs";

const DocClasses = Object.freeze({
    BaseDocument,
    Tome,
    Calendar,
    CalendarDays,
    CalendarMonths,
    Chapter,
    ChapterType,
    Section,
    Entry,
    EntryType,
    EntryEvent,
    LineageTree,
    LineageEntry,
    Timeline,
    MapAtlas,
    MapElement,
    Relevance,
    TextImage,
    Setting    
});

export default DocClasses;