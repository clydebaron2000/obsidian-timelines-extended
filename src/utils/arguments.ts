import { isNaN } from 'lodash'

import { parseSimplifiedDate, buildTimelineDate } from './dates'
import { logger } from './debug'
import { InternalTimelineArgs, ParsedTagObject, TimelinesSettings } from '../types'
import { DEFAULT_SETTINGS } from '../constants'

export function setDefaultArgs( settings: TimelinesSettings ): InternalTimelineArgs {
  const { verticalTimelineDateDisplayFormat: defaultVerticalDateFormat } = DEFAULT_SETTINGS
  const { verticalTimelineDateDisplayFormat: dateFormatFromSettings } = settings

  logger( 'setDefaultArgs |', { dateFormatFromSettings, defaultVerticalDateFormat })

  let useNewDefaultFormat = false
  if ( dateFormatFromSettings !== defaultVerticalDateFormat ) {
    logger( 'setDefaultArgs | using new default format' )
    useNewDefaultFormat = true
  }

  // Create default dates using reasonable ranges to prevent infinite loop issues
  // Use current year +/- reasonable ranges instead of extreme values
  const currentYear = new Date().getFullYear()
  const startYear = Math.max( 1900, currentYear - 50 ) // 50 years ago or 1900, whichever is later
  const endYear = currentYear + 50 // 50 years in the future
  const minYear = Math.max( 1800, currentYear - 100 ) // 100 years ago or 1800, whichever is later  
  const maxYear = currentYear + 100 // 100 years in the future

  const startDateResult = parseSimplifiedDate( startYear.toString(), settings.dateParsingConfig, false, 'box' )
  const endDateResult = parseSimplifiedDate( endYear.toString(), settings.dateParsingConfig, false, 'box' )
  const minDateResult = parseSimplifiedDate( minYear.toString(), settings.dateParsingConfig, false, 'box' )
  const maxDateResult = parseSimplifiedDate( maxYear.toString(), settings.dateParsingConfig, false, 'box' )

  // Fallback to safe dates if parsing fails
  const safeStartDate = buildTimelineDate( startDateResult ) || new Date( startYear, 0, 1 )
  const safeEndDate = buildTimelineDate( endDateResult ) || new Date( endYear, 0, 1 )
  const safeMinDate = buildTimelineDate( minDateResult ) || new Date( minYear, 0, 1 )
  const safeMaxDate = buildTimelineDate( maxDateResult ) || new Date( maxYear, 0, 1 )

  logger( 'setDefaultArgs | Created default dates', {
    startDate: safeStartDate,
    endDate: safeEndDate,
    minDate: safeMinDate,
    maxDate: safeMaxDate
  })

  return {
    tags: {
      tagList: [],
      optionalTags: [],
    },
    dateFormat: useNewDefaultFormat ? dateFormatFromSettings : defaultVerticalDateFormat,
    divHeight: 400,
    startDate: safeStartDate,
    endDate: safeEndDate,
    minDate: safeMinDate,
    maxDate: safeMaxDate,
    type: null,

    // have to put it to one more than the default max so that min actually works
    zoomOutLimit: 315360000000001,
    zoomInLimit: 10,
  }
}

export const createTagList = ( tagString: string, timelineTag: string ): ParsedTagObject => {
  const parsedTags: ParsedTagObject = {
    tagList: [],
    optionalTags: []
  }

  tagString.split( ';' ).forEach(( tag: string ) => {
    if ( tag.includes( '|' )) {
      return parseOrTags( tag, parsedTags.optionalTags )
    }

    return parseTag( tag, parsedTags.tagList )
  })
  parsedTags.tagList.push( timelineTag )

  return parsedTags
}

const parseOrTags = ( tagString: string, optionalTags: string[] ): void => {
  tagString.split( '|' ).forEach(( tag: string ) => {
    return parseTag( tag, optionalTags )
  })
}

/**
 * Parse a tag and all its subtags into a list.
 *
 * @param {String} tag - tag to parse
 * @param {String[]} tagList - list of tags to add to
 * @returns
 */
export function parseTag( tag: string, tagList: string[] ): void {
  tag = tag.trim()

  // Skip empty tags
  if ( tag.length === 0 ) {
    return
  }

  // Parse all subtags out of the given tag.
  // I.e., #hello/i/am would yield [#hello/i/am, #hello/i, #hello]. */
  tagList.push( tag )
  while ( tag.contains( '/' )) {
    tag = tag.substring( 0, tag.lastIndexOf( '/' ))
    tagList.push( tag )
  }
}

/**
 * Convert a timeframe string to milliseconds
 *
 * @param {string} timeframe - timeframe string to convert
 *
 * @returns {number} milliseconds
 */
export const convertEntryToMilliseconds = ( timeframe: string ): number => {
  let msNumber: number = 10

  const userTimeframe = parseInt( timeframe )
  if ( !isNaN( userTimeframe )) {
    // the user knows exactly what they want
    return userTimeframe
  }

  switch ( timeframe ) {
  case 'day':
    // shows hours
    msNumber = 1000 * 60 * 60 * 24 // 86400000
    break
  case 'week':
    // shows days, about a week at a time
    msNumber = 1000 * 60 * 60 * 24 * 7 // 604800000
    break
  case 'month-detail':
    // shows days, about a month at a time
    msNumber = 1000 * 60 * 60 * 24 * 31 // 2678400000
    break
  case 'month-vague':
    // shows months, about a month at a time
    msNumber = 1000 * 60 * 60 * 24 * 32 // 2764800000
    break
  case 'year':
    // shows months, about a year at a time
    msNumber = 1000 * 60 * 60 * 24 * 31 * 12 // 32140800000
    break
  default:
    console.error( `Invalid timeframe: ${timeframe}` )
    break
  }

  return msNumber
}
