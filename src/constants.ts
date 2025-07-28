import { AcceptableEventElements, FrontMatterKeys, TimelinesSettings, DateParsingConfig } from './types'

export const DEFAULT_FRONTMATTER_KEYS: FrontMatterKeys = {
  endDateKey: ['endDate', 'end-date'],
  startDateKey: ['startDate', 'start-date'],
  titleKey: ['title'],
}

export const DEFAULT_DATE_PARSING_CONFIG: DateParsingConfig = {
  yearLength: 4,
  monthLength: 2,
  dayLength: 2,
  hourLength: 2,
  minuteLength: 2,
}

export const DEFAULT_SETTINGS: TimelinesSettings = {
  eventElement: AcceptableEventElements.div,
  frontMatterKeys: DEFAULT_FRONTMATTER_KEYS,
  notePreviewOnHover: true,
  showEventCounter: false,
  sortDirection: true,
  timelineTag: 'timeline',
  maxDigits: '5',
  verticalTimelineDateDisplayFormat: '',
  dateParsingConfig: DEFAULT_DATE_PARSING_CONFIG,
}

export const DEVELOPER_SETTINGS = {
  debug: false,
}

export const RENDER_TIMELINE: RegExp = /<!--TIMELINE BEGIN tags=['"]([^"]*?)['"]-->([\s\S]*?)<!--TIMELINE END-->/i
