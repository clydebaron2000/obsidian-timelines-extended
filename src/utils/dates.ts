import { DateTime as LuxonDateTime } from 'luxon'

import { logger } from './debug'
import { DEFAULT_SETTINGS } from '../constants'
import { CleanedDateResultObject, DateParsingConfig } from '../types'

/**
 * Parse a date string using configurable character lengths
 * 
 * @param {string} dateString - the raw date string to parse
 * @param {DateParsingConfig} config - parsing configuration
 * @param {boolean} isEndDate - whether this is an end date (for auto-generation)
 * @param {string} eventType - event type ('point' events don't get end dates)
 * 
 * @returns {CleanedDateResultObject | null}
 */
export const parseSimplifiedDate = (
  dateString: string,
  config: DateParsingConfig,
  isEndDate: boolean = false,
  eventType: string = 'box'
): CleanedDateResultObject | null => {
  if ( !dateString || typeof dateString !== 'string' ) {
    logger( 'parseSimplifiedDate | Invalid input', { dateString, config, isEndDate, eventType })
    return null
  }

  logger( 'parseSimplifiedDate | parsing', { dateString, config, isEndDate, eventType })

  // Remove any non-digit characters and parse sequentially
  const cleanString = dateString.replace( /\D/g, '' )
  let position = 0

  // Parse year
  const yearStr = cleanString.substring( position, position + config.yearLength )
  if ( !yearStr ) {
    logger( 'parseSimplifiedDate | no year found' )
    return null
  }
  position += config.yearLength

  // Parse month (optional)
  const monthStr = cleanString.substring( position, position + config.monthLength )
  position += config.monthLength

  // Parse day (optional)
  const dayStr = cleanString.substring( position, position + config.dayLength )
  position += config.dayLength

  // Parse hour (optional)
  const hourStr = cleanString.substring( position, position + config.hourLength )
  position += config.hourLength

  // Parse minute (optional)
  const minuteStr = cleanString.substring( position, position + config.minuteLength )

  // Convert to numbers
  const year = parseInt( yearStr ) || 0
  let month = parseInt( monthStr ) || 0
  let day = parseInt( dayStr ) || 0
  let hour = parseInt( hourStr ) || 0
  let minute = parseInt( minuteStr ) || 0

  // Validate year
  if ( year === 0 ) {
    logger( 'parseSimplifiedDate | Invalid year', { yearStr, year })
    return null
  }

  logger( 'parseSimplifiedDate | parsed components', { year, month, day, hour, minute, monthStr, dayStr, hourStr, minuteStr })

  // For end dates, round up to next unit if this is auto-generated
  if ( isEndDate && eventType !== 'point' && !monthStr && !dayStr && !hourStr && !minuteStr ) {
    // Only auto-generate if no end date components were provided
    logger( 'parseSimplifiedDate | auto-generating end date' )
    return createDateResult( year + 1, 1, 1, 0, 0, dateString )
  }

  // For start dates or point events, use defaults for missing components
  if ( !month ) month = 1
  if ( !day ) day = 1
  // hour and minute can remain 0

  const result = createDateResult( year, month, day, hour, minute, dateString )
  logger( 'parseSimplifiedDate | final result', result )
  return result
}

/**
 * Create a CleanedDateResultObject from parsed components
 */
const createDateResult = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  originalDateString: string
): CleanedDateResultObject => {
  // Convert minute to decimal hour for compatibility with existing structure
  const hourWithMinutes = hour + (minute / 60)
  
  // Create normalized date string (YYYY-MM-DD-HH format for compatibility)
  const normalizedDateString = `${year.toString().padStart( 4, '0' )}-${month.toString().padStart( 2, '0' )}-${day.toString().padStart( 2, '0' )}-${hour.toString().padStart( 2, '0' )}`
  
  // Create cleaned date string (same as normalized for now)
  const cleanedDateString = normalizedDateString
  
  // Create readable date string (minimize unnecessary components)
  let readableParts = [year.toString()]
  if ( month > 1 || day > 1 || hour > 0 || minute > 0 ) {
    readableParts.push( month.toString().padStart( 2, '0' ))
  }
  if ( day > 1 || hour > 0 || minute > 0 ) {
    readableParts.push( day.toString().padStart( 2, '0' ))
  }
  if ( hour > 0 || minute > 0 ) {
    readableParts.push( hour.toString().padStart( 2, '0' ))
  }
  const readableDateString = readableParts.join( '-' )

  const result: CleanedDateResultObject = {
    cleanedDateString,
    normalizedDateString,
    originalDateString,
    readableDateString,
    year,
    month: month - 1, // JavaScript Date months are 0-indexed
    day,
    hour: Math.floor( hourWithMinutes ) // Use the hour component, ignoring minutes for now
  }

  logger( 'createDateResult | created', result )
  return result
}

/**
 * Validate and normalize timeline item type
 * 
 * @param {string} type - the type to validate
 * @returns {string} - a valid vis-timeline type
 */
export const validateTimelineType = ( type: string | undefined | null ): string => {
  const validTypes = ['box', 'point', 'range', 'background']
  
  // Handle undefined/null/empty values
  if ( !type || typeof type !== 'string' ) {
    logger( 'validateTimelineType | Invalid type, defaulting to box', { originalType: type })
    return 'box'
  }
  
  // Normalize the type by removing any 'vis-' prefix
  const normalizedType = type.replace(/^vis-/, '')
  
  // Check if it's a valid type
  if ( validTypes.includes( normalizedType )) {
    return normalizedType
  }
  
  // If type is 'event' or any other invalid type, default to 'box'
  logger( 'validateTimelineType | Invalid type, defaulting to box', { originalType: type, normalizedType })
  return 'box'
}

/**
 * Create a Datetime Object for sorting or for use as an argument to the vis-timeline constructor
 *
 * @param {CleanedDateResultObject} dateResult - parsed date result
 *
 * @returns {Date | null}
 */
export const buildTimelineDate = ( dateResult: CleanedDateResultObject | null ): Date | null => {
  if ( !dateResult ) {
    return null
  }

  const { year, month, day, hour } = dateResult

  // Validate date components
  if ( year === 0 || isNaN( year )) {
    logger( 'buildTimelineDate | Invalid year', { year, dateResult })
    return null
  }
  
  if ( month < 0 || month > 11 || isNaN( month )) {
    logger( 'buildTimelineDate | Invalid month', { month, dateResult })
    return null
  }
  
  if ( day < 1 || day > 31 || isNaN( day )) {
    logger( 'buildTimelineDate | Invalid day', { day, dateResult })
    return null
  }
  
  if ( hour < 0 || hour > 23 || isNaN( hour )) {
    logger( 'buildTimelineDate | Invalid hour', { hour, dateResult })
    return null
  }

  // native JS Date handles negative years and recent dates pretty decent
  // so if year is negative, or if the year is recent (past 1900)
  // we can just use the JS Date directly with no workarounds
  let returnDate: Date
  let luxonDateTime: LuxonDateTime | null = null
  let luxonDateString: string | null = null
  
  if ( year < 0 || year > 1900 ) {
    returnDate = new Date( year, month, day, hour )
  } else {
    // but if date is positive, well, then we need to make sure we're actually getting
    // the date that we want. JS Date will change "0001-00-01" to "Jan 1st 1970"
    luxonDateString = `${year.toString().padStart( 4, '0' )}-${(month + 1).toString().padStart( 2, '0' )}-${day.toString().padStart( 2, '0' )}-${hour.toString().padStart( 2, '0' )}`
    luxonDateTime = LuxonDateTime.fromFormat( luxonDateString, 'y-M-d-H' )
    const luxonISOString = luxonDateTime.toISO()

    if ( !luxonISOString ) {
      console.error( "buildTimelineDate | Couldn't create a luxon date string!" )
      return null
    }

    returnDate = new Date( luxonISOString )
  }

  // Validate the final date object
  if ( isNaN( returnDate.getTime())) {
    logger( 'buildTimelineDate | Created invalid date', { dateResult, returnDate })
    return null
  }

  logger( 'buildTimelineDate | date variables', {
    dateResult,
    luxonDateTime,
    luxonDateString,
    returnDate
  })

  return returnDate
}

/**
 * Sort timeline dates correctly, taking heed of negative dates
 *
 * @param {string[]} timelineDates the array of normalized noteId's (event start dates) for the timeline
 * @param {boolean} sortDirection false for descending, true for ascending
 */
export const sortTimelineDates = ( timelineDates: string[], sortDirection: boolean ): string[] => {
  const filterFunc = ( dateStr: string ) => {
    return dateStr[0] === '-' 
  }

  const negativeDatesUnsorted = timelineDates.filter( filterFunc )
  const positiveDates = timelineDates.filter(( date ) => {
    return !filterFunc( date ) 
  }).sort()

  const strippedNegativeDates = negativeDatesUnsorted.map(( date ) => {
    return date.slice( 1 ) 
  }).sort().reverse()
  
  let sortedTimelineDates: string[] = []
  if ( sortDirection ) {
    const negativeDates = strippedNegativeDates.map(( date ) => {
      return `-${date}` 
    }) ?? []

    sortedTimelineDates = [...negativeDates, ...positiveDates]
  } else {
    const negativeDates = strippedNegativeDates.reverse().map(( date ) => {
      return `-${date}` 
    }) ?? []

    sortedTimelineDates = [...positiveDates.reverse(), ...negativeDates]
  }
  
  return sortedTimelineDates
}

// Keep the formatDate function for display formatting
function mapMonthValueToName( month: string, abbreviate: boolean = false ): string {
  let name = month
  switch ( month ) {
  case '1':
    name = 'January'
    break
  case '2':
    name = 'February'
    break
  case '3':
    name = 'March'
    break
  case '4':
    name = 'April'
    break
  case '5':
    name = 'May'
    break
  case '6':
    name = 'June'
    break
  case '7':
    name = 'July'
    break
  case '8':
    name = 'August'
    break
  case '9':
    name = 'September'
    break
  case '10':
    name = 'October'
    break
  case '11':
    name = 'November'
    break
  case '12':
    name = 'December'
    break
  default:
    break
  }

  return abbreviate ? name.slice( 0, 3 ) : name
}

function mapDayToWeekdayName( year: string, month: string, day: string, abbreviate: boolean = false ): string {
  const date = new Date( parseInt( year ), parseInt( month ) - 1, parseInt( day ))
  const dayOfWeek = mapDayOfWeekToName( date.getDay() + 1 )

  return abbreviate ? dayOfWeek.slice( 0, 3 ) : dayOfWeek
}

function mapDayOfWeekToName( dayOfWeek: number ): string {
  switch ( `${dayOfWeek}` ) {
  case '1':
    return 'Sunday'
  case '2':
    return 'Monday'
  case '3':
    return 'Tuesday'
  case '4':
    return 'Wednesday'
  case '5':
    return 'Thursday'
  case '6':
    return 'Friday'
  case '7':
    return 'Saturday'
  default:
    return `the ${mapDayToDecoratedNum( dayOfWeek.toString())} day of the week`
  }
}

function mapDayToDecoratedNum( day: string ): string {
  let modifier = 'th'
  switch ( day ) {
  case '1':
  case '21':
  case '31':
    modifier = 'st'
    break
  case '2':
  case '22':
    modifier = 'nd'
    break
  case '3':
  case '23':
    modifier = 'rd'
    break
  default:
    break
  }

  return `${day}${modifier}`
}

function cascadeDeleteBasedOnMissingPredecessor( dateParts: Record<string, string | undefined> ) {
  const yearVariants = ['YY']
  const monthVariants = ['MM', 'MMM']
  const dayVariants = ['DD', 'DDD', 'DDDD']
  const hourVariants = ['HH']

  const toDelete: string[] = []
  if ( !dateParts.YYYY ) {
    // if missing years, add everything except years to the delete array
    toDelete.push( ...yearVariants, 'M', ...monthVariants, 'D', ...dayVariants, 'H', ...hourVariants )
  } else  if ( !dateParts.M ) {
    // if missing months, add all potential month variants and day and hour parts to the delete array
    toDelete.push( ...monthVariants, 'D', ...dayVariants, 'H', ...hourVariants )
  } else if ( !dateParts.D ) {
    // if missing days, add all potential day variants and hour parts to the delete array
    toDelete.push( ...dayVariants, 'H', ...hourVariants )
  } else if ( !dateParts.H ) {
    // if missing hours, add all potential hour variants to the delete array
    toDelete.push( ...hourVariants )
  }

  // loop through dateParts and delete any keys that are in the delete array
  for ( const key in dateParts ) {
    if ( toDelete.includes( key )) {
      delete dateParts[key]
    }
  }
}

/**
 * Take a minified date string and format it according to the settings supplied
 * 
 * @param {string} dateString - the date to format
 * @param {string} formatString - the string format to use for the date
 * 
 * @returns {string}
 */
export function formatDate( dateString: string, formatString: string ): string {
  const dateRegex = /^(-?\d+)(?:-(-?\d+)(?:-(-?\d+)(?:-(-?\d+))?)?)?$/
  const match = dateString.match( dateRegex )

  if ( !match ) {
    throw new Error( 'Invalid date format. Expected format: YYYY or YYYY-MM or YYYY-MM-DD or YYYY-MM-DD-HH' )
  }

  const [, year, month, day, hour] = match
  const dateParts: Record<string, string | undefined> = {
    YYYY: year, // unfiltered
    MM: month,  // unfiltered
    DD: day,    // unfiltered
    HH: hour,   // unfiltered

    YY:   year  ? year.slice( -2 )                              : undefined, // last 2 digits of year
    M:    month ? mapMonthValueToName( month, true )            : undefined, // abbr month
    MMM:  month ? mapMonthValueToName( month )                  : undefined, // full month
    D:    day   ? mapDayToDecoratedNum( day )                   : undefined, // 1st, 2nd, 3rd, etc.
    DDD:  day   ? mapDayToWeekdayName( year, month, day, true ) : undefined, // Sun, Mon, Tue, etc.
    DDDD: day   ? mapDayToWeekdayName( year, month, day )       : undefined, // Sunday, Monday, Tuesday, etc.
    H:    hour  ? hour + ':00'                                  : undefined,
  }

  logger( 'formatDate | dateparts before cascade delete', dateParts )
  cascadeDeleteBasedOnMissingPredecessor( dateParts )
  logger( 'formatDate | dateparts after cascade delete', dateParts )

  // Create a clean format string based on available date parts
  let cleanFormatString = formatString
  
  // If we don't have certain date parts, remove them from the format string
  if ( !dateParts.H && !dateParts.HH ) {
    cleanFormatString = cleanFormatString.replace( /\s*H{1,2}\s*/g, '' )
  }
  if ( !dateParts.D && !dateParts.DD && !dateParts.DDD && !dateParts.DDDD ) {
    cleanFormatString = cleanFormatString.replace( /\s*D{1,4}\s*/g, '' )
  }
  if ( !dateParts.M && !dateParts.MM && !dateParts.MMM ) {
    cleanFormatString = cleanFormatString.replace( /\s*M{1,3}\s*/g, '' )
  }
  
  // Clean up any double spaces or trailing/leading spaces
  cleanFormatString = cleanFormatString.replace( /\s+/g, ' ' ).trim()
  
  logger( 'formatDate | cleaned format string', { original: formatString, cleaned: cleanFormatString })

  // Replace each token in the cleaned format string
  return cleanFormatString.replace( /\b(H{1,2}|D{1,4}|M{1,3}|Y{2,4})\b/g, ( token ) => {
    logger( `formatDate | replacing token: ${token}` )
    const value = dateParts[token]
    if ( value === undefined || value === null ) {
      logger( `formatDate | token ${token} not available, using empty string` )
      return ''
    }
    return value
  })
}
