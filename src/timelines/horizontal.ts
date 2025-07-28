import Arrow from 'timeline-arrows'
import { DataInterface, DataSet } from 'vis-data'
import { DataGroup, Timeline, TimelineGroupEditableOption, TimelineOptionsGroupHeightModeType } from 'vis-timeline/esnext'

import { makeArrowsArray } from '.'
import { calculateSmartViewport, validateViewport } from '../utils/smart-viewport'
import {
  CardContainer,
  CombinedTimelineEventData,
  EventItem,
  HorizontalTimelineInput,
  MinimalGroup
} from '../types'
import {
  buildCombinedTimelineDataObject,
  buildTimelineDate,
  createInternalLinkOnNoteCard,
  handleColor,
  logger,
  validateTimelineType,
} from '../utils'

/**
   * Build a horizontal timeline
   *
   * @param timelineDiv - the timeline html element
   * @param timelineNotes - notes which have our timeline tags
   * @param timelineDates - dates we parsed from event data
   * @param el - the element to append the timeline to
   */
export async function buildHorizontalTimeline(
  {
    args,
    div: timelineDiv,
    dates: timelineDates,
    el,
    notes: timelineNotes,
    settings,
  }: HorizontalTimelineInput
) {
  logger( 'buildHorizontalTimeline | Starting horizontal timeline build', {
    timelineNotesCount: Object.keys( timelineNotes ).length,
    timelineDatesCount: timelineDates.length,
    args: {
      startDate: args.startDate,
      endDate: args.endDate,
      minDate: args.minDate,
      maxDate: args.maxDate,
      divHeight: args.divHeight,
      zoomInLimit: args.zoomInLimit,
      zoomOutLimit: args.zoomOutLimit
    },
    dateParsingConfig: settings.dateParsingConfig
  })

  // Create a DataSet
  const items = new DataSet<CombinedTimelineEventData>( [] )

  if ( !timelineDates ) {
    logger( 'buildHorizontalTimeline | No dates found for the timeline' )
    return
  }

  // Debug: Log the first few timeline notes to see their structure
  const sampleNotes = Object.entries( timelineNotes ).slice( 0, 3 )
  logger( 'buildHorizontalTimeline | Sample timeline notes', sampleNotes )

  const groups: MinimalGroup[] = [
    {
      // default group
      content: '',
      id: 1,
      value: 1,
    },
  ]

  timelineDates.forEach(( date ) => {
    // add all events at this date
    Object.values( timelineNotes[date] ).forEach(( event: CardContainer ) => {
      const noteCard = document.createElement( 'div' )
      noteCard.className = 'timeline-card ' + event.classes
      let colorIsClass = false
      let end: Date | null = null
      let type: string = validateTimelineType( event.type )
      let typeOverride = false

      // add an image only if available
      if ( event.img ) {
        noteCard.createDiv({
          cls: 'thumb',
          attr: { style: `background-image: url(${event.img});` }
        })
      }

      if ( event.color ) {
        colorIsClass = handleColor( event.color, noteCard, event.id )
      }

      createInternalLinkOnNoteCard( event, noteCard )
      noteCard.createEl( 'p', { text: event.body })
      
      logger( 'buildHorizontalTimeline | Processing event dates', {
        eventId: event.id,
        eventTitle: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        eventType: event.type
      })
      
      const start = buildTimelineDate( event.startDate )
      logger( 'buildHorizontalTimeline | Built start date', { 
        originalStartDate: event.startDate,
        builtStartDate: start,
        isValidDate: start ? !isNaN( start.getTime()) : false
      })
      
      if ( !start ) {
        console.warn(
          "buildHorizontalTimeline | Couldn't build the starting timeline date for the horizontal timeline",
          'buildHorizontalTimeline | Invalid start date - check for Month/Day values that are 0',
          { start, event }
        )
        return
      }

      if ( event.endDate.normalizedDateString && event.endDate.normalizedDateString !== '' ) {
        logger( 'buildHorizontalTimeline | there is an endDate for event:', event )
        end = buildTimelineDate( event.endDate )
        logger( 'buildHorizontalTimeline | Built end date', { 
          originalEndDate: event.endDate,
          builtEndDate: end,
          isValidDate: end ? !isNaN( end.getTime()) : false
        })
      } else {
        // if there is no end date, we cannot render as anything other than 'point'
        logger( 'buildHorizontalTimeline | NO endDate for event:', event )
        type = validateTimelineType( 'point' )
        typeOverride = true
      }

      if ( end?.toString() === 'Invalid Date' ) {
        console.warn(
          'buildHorizontalTimeline | Invalid end date - check for Month/Day values that are 0',
          { end, event }
        )

        return
      }

      const initialClassName = colorIsClass ? event.color ?? 'gray' : `nid-${event.id}`
      const defaultGroup = groups[0]
      let foundGroup = groups.find(( group ) => {
        return group.content === event.group 
      })
      if ( !foundGroup && event.group ) {
        const newGroup: MinimalGroup = {
          content: event.group,
          id: groups.length + 1,
          value: groups.length + 1,
        }
        groups.push( newGroup )
        foundGroup = newGroup
      }

      const eventItem: EventItem = {
        id:        items.length + 1,
        content:   event.title ?? '',
        className: initialClassName + ' ' + event.classes,
        end:       end ?? undefined,
        group:     foundGroup?.id ?? defaultGroup.id,
        path:      event.path,
        start:     start,
        type:      validateTimelineType( typeOverride ? type : event.type ),
        _event:    event,
      }

      // Validate the timeline item before adding it
      if ( !start || isNaN( start.getTime()) || !isFinite( start.getTime())) {
        logger( 'buildHorizontalTimeline | Invalid start date for event, skipping', { event, start })
        return
      }

      if ( end && ( isNaN( end.getTime()) || !isFinite( end.getTime()))) {
        logger( 'buildHorizontalTimeline | Invalid end date for event, removing end date', { event, end })
        eventItem.end = undefined
        end = null
      }

      // Ensure end date is after start date if both exist
      if ( end && end <= start ) {
        logger( 'buildHorizontalTimeline | End date is not after start date, removing end date', { event, start, end })
        eventItem.end = undefined
        end = null
      }

      // Additional validation for extreme dates
      const currentYear = new Date().getFullYear()
      const startYear = start.getFullYear()
      if ( startYear < 1 || startYear > currentYear + 1000 ) {
        logger( 'buildHorizontalTimeline | Start date year is extreme, skipping event', { event, startYear })
        return
      }

      if ( end ) {
        const endYear = end.getFullYear()
        if ( endYear < 1 || endYear > currentYear + 1000 ) {
          logger( 'buildHorizontalTimeline | End date year is extreme, removing end date', { event, endYear })
          eventItem.end = undefined
          end = null
        }
      }

      logger( 'buildHorizontalTimeline | Final validated event item', {
        id: eventItem.id,
        start: eventItem.start,
        end: eventItem.end,
        type: eventItem.type,
        content: eventItem.content
      })

      const timelineItem: CombinedTimelineEventData = buildCombinedTimelineDataObject( eventItem )

      // Add Event data
      items.add( timelineItem )
    })
  })

  // Check if explicit start/end dates were provided in the code block
  // We'll check if the dates are NOT the default dates from setDefaultArgs
  const currentYear = new Date().getFullYear()
  const isDefaultStartDate = args.startDate && 
    args.startDate.getFullYear() >= currentYear - 60 && 
    args.startDate.getFullYear() <= currentYear - 40
  const isDefaultEndDate = args.endDate && 
    args.endDate.getFullYear() >= currentYear + 40 && 
    args.endDate.getFullYear() <= currentYear + 60

  const shouldUseSmartViewport = isDefaultStartDate && isDefaultEndDate

  let finalOptions = {
    start: args.startDate,
    end: args.endDate,
    min: args.minDate,
    max: args.maxDate
  }

  // Only use smart viewport if NO explicit start/end dates were specified
  if (shouldUseSmartViewport) {
    logger('buildHorizontalTimeline | No explicit start/end dates specified, using smart viewport with ±20% padding')
    const allItems = items.get()
    const smartViewport = calculateSmartViewport(allItems)
    
    if (smartViewport) {
      const validatedViewport = validateViewport(smartViewport)
      finalOptions = {
        start: validatedViewport.start,
        end: validatedViewport.end,
        min: validatedViewport.min,
        max: validatedViewport.max
      }
      logger('buildHorizontalTimeline | Applied smart viewport with ±20% padding', {
        eventRange: {
          earliest: allItems.length > 0 ? new Date(Math.min(...allItems.map(i => i.start?.getTime()).filter(Boolean))) : null,
          latest: allItems.length > 0 ? new Date(Math.max(...allItems.map(i => (i.end || i.start)?.getTime()).filter(Boolean))) : null
        },
        smartViewport: validatedViewport
      })
    } else {
      logger('buildHorizontalTimeline | Smart viewport calculation failed, using default dates')
    }
  } else {
    logger('buildHorizontalTimeline | Explicit start/end dates provided, using specified dates', {
      explicitStart: !isDefaultStartDate ? args.startDate : null,
      explicitEnd: !isDefaultEndDate ? args.endDate : null
    })
  }

  // Configuration for the Timeline
  const options = {
    end: finalOptions.end,
    min: finalOptions.min,
    minHeight: args.divHeight,
    max: finalOptions.max,
    start: finalOptions.start,
    zoomMax: args.zoomOutLimit,
    zoomMin: args.zoomInLimit,

    // non-argument options
    showCurrentTime: false,
    showTooltips: false,
    groupEditable: {
      order: true,
    } as TimelineGroupEditableOption,
    groupHeightMode: 'fitItems' as TimelineOptionsGroupHeightModeType,
    groupOrder: ( a: MinimalGroup, b: MinimalGroup ): number => {
      return a.value - b.value
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    groupOrderSwap: ( a: MinimalGroup, b: MinimalGroup, groups: DataInterface<DataGroup, 'id'> ): void => {
      const temp = a.value
      a.value = b.value
      b.value = temp
    },
    template: ( item: EventItem ) => {
      const eventContainer = document.createElement( settings.notePreviewOnHover ? 'a' : 'div' )
      if ( 'href' in eventContainer ) {
        eventContainer.addClass( 'internal-link' )
        eventContainer.href = item.path
      }

      eventContainer.setText( item.content )

      return eventContainer
    }
  }

  // Validate timeline options dates to prevent infinite loop
  const dateFields = ['start', 'end', 'min', 'max'] as const
  for ( const field of dateFields ) {
    const date = options[field]
    if ( date && ( isNaN( date.getTime()) || !isFinite( date.getTime()))) {
      logger( `buildHorizontalTimeline | Invalid ${field} date, using fallback`, { date, field })
      // Use a safe fallback date
      options[field] = field === 'start' || field === 'min' ? new Date( 2000, 0, 1 ) : new Date( 2030, 0, 1 )
    }
    
    // Check for extreme dates that can cause issues
    if ( date ) {
      const year = date.getFullYear()
      if ( year < 1900 || year > 2100 ) {
        logger( `buildHorizontalTimeline | Extreme ${field} date year (${year}), using safe fallback`, { date, field, year })
        // Use safe dates within reasonable range
        if ( field === 'start' || field === 'min' ) {
          options[field] = new Date( 2000, 0, 1 )
        } else {
          options[field] = new Date( 2030, 0, 1 )
        }
      }
    }
  }

  // Ensure start is before end and min is before max
  if ( options.start && options.end && options.start >= options.end ) {
    logger( 'buildHorizontalTimeline | Start date is not before end date, adjusting' )
    options.end = new Date( options.start.getTime() + 365 * 24 * 60 * 60 * 1000 ) // Add 1 year
  }

  if ( options.min && options.max && options.min >= options.max ) {
    logger( 'buildHorizontalTimeline | Min date is not before max date, adjusting' )
    // Fix the order - min should be before max
    if ( options.min.getTime() >= options.max.getTime()) {
      const tempMin = new Date( options.max.getTime() - 10 * 365 * 24 * 60 * 60 * 1000 ) // 10 years before max
      options.min = tempMin
    }
  }
  
  // Additional safety check - ensure min/max span is reasonable
  if ( options.min && options.max ) {
    const timeDiff = options.max.getTime() - options.min.getTime()
    const oneYear = 365 * 24 * 60 * 60 * 1000
    
    if ( timeDiff < oneYear ) {
      logger( 'buildHorizontalTimeline | Min/max date range too small, expanding' )
      options.min = new Date( options.max.getTime() - 10 * oneYear )
    }
    
    if ( timeDiff > 100 * oneYear ) {
      logger( 'buildHorizontalTimeline | Min/max date range too large, constraining' )
      options.min = new Date( options.max.getTime() - 50 * oneYear )
    }
  }

  // Validate zoom limits
  if ( !isFinite( options.zoomMax ) || options.zoomMax <= 0 ) {
    logger( 'buildHorizontalTimeline | Invalid zoomMax, using default' )
    options.zoomMax = 315360000000000 // Default max zoom
  }

  if ( !isFinite( options.zoomMin ) || options.zoomMin <= 0 ) {
    logger( 'buildHorizontalTimeline | Invalid zoomMin, using default' )
    options.zoomMin = 10 // Default min zoom
  }

  // Ensure zoomMin is less than zoomMax
  if ( options.zoomMin >= options.zoomMax ) {
    logger( 'buildHorizontalTimeline | zoomMin is not less than zoomMax, adjusting' )
    options.zoomMax = options.zoomMin * 1000
  }

  logger( 'buildHorizontalTimeline | Final timeline options', { 
    start: options.start, 
    end: options.end, 
    min: options.min, 
    max: options.max,
    zoomMin: options.zoomMin,
    zoomMax: options.zoomMax,
    itemCount: items.length,
    groupCount: groups.length
  })

  // Debug: Log all items being passed to timeline
  const timelineItems = items.get()
  logger( 'buildHorizontalTimeline | All timeline items', timelineItems )
  
  // Check for problematic items
  const problematicItems = timelineItems.filter( item => {
    const startInvalid = !item.start || isNaN( item.start.getTime())
    const endInvalid = item.end && isNaN( item.end.getTime())
    const endBeforeStart = item.end && item.start && item.end <= item.start
    return startInvalid || endInvalid || endBeforeStart
  })
  
  if ( problematicItems.length > 0 ) {
    console.warn( 'buildHorizontalTimeline | Found problematic items:', problematicItems )
  }

  timelineDiv.setAttribute( 'class', 'timeline-vis' )
  
  let timeline: Timeline
  try {
    timeline = new Timeline( timelineDiv, items, groups, options )
    logger( 'buildHorizontalTimeline | Timeline created successfully' )
  } catch ( error ) {
    console.error( 'buildHorizontalTimeline | Error creating timeline:', error )
    console.error( 'buildHorizontalTimeline | Timeline data:', { 
      itemsArray: items.get(),
      groupsArray: groups,
      options 
    })
    
    // Create a minimal timeline with safe defaults and no items
    const safeOptions = {
      start: new Date( 2020, 0, 1 ),
      end: new Date( 2025, 0, 1 ),
      min: new Date( 2000, 0, 1 ),
      max: new Date( 2030, 0, 1 ),
      zoomMin: 10,
      zoomMax: 315360000000000,
      showCurrentTime: false,
      showTooltips: false,
      minHeight: 200
    }
    
    const emptyItems = new DataSet<CombinedTimelineEventData>( [] )
    const emptyGroups: MinimalGroup[] = [{ id: 0, content: 'No items to display', value: 0 }]
    
    try {
      timeline = new Timeline( timelineDiv, emptyItems, emptyGroups, safeOptions )
      logger( 'buildHorizontalTimeline | Created safe fallback timeline' )
      
      // Add a message to indicate the issue
      const messageDiv = timelineDiv.createDiv({ cls: 'timeline-error-message' })
      messageDiv.setText( 'Timeline could not be rendered due to data issues. Check console for details.' )
      messageDiv.style.padding = '20px'
      messageDiv.style.textAlign = 'center'
      messageDiv.style.color = 'var(--text-muted)'
      
      return // Exit early since we created a fallback
    } catch ( fallbackError ) {
      console.error( 'buildHorizontalTimeline | Even fallback timeline failed:', fallbackError )
      
      // Last resort: just show an error message
      timelineDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-error);">Timeline rendering failed. Please check your timeline data and try again.</div>'
      return
    }
  }

  const arrows = makeArrowsArray( items )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const myArrows = new Arrow( timeline, arrows )

  // Auto health check after timeline creation
  setTimeout(() => {
    try {
      // Simple health check for infinite loop detection
      const visInstance = (timelineDiv as any).timeline
      if (visInstance) {
        const items = visInstance.itemsData?.get()
        const itemCount = items?.length || 0
        
        logger(`buildHorizontalTimeline | Timeline created successfully with ${itemCount} items`)
        
        // Check for problematic items
        if (items) {
          const problematicItems = items.filter((item: any) => {
            const startInvalid = !item.start || isNaN(new Date(item.start).getTime())
            const endInvalid = item.end && isNaN(new Date(item.end).getTime())
            return startInvalid || endInvalid
          })
          
          if (problematicItems.length > 0) {
            console.warn(`⚠️ Timeline has ${problematicItems.length} items with invalid dates:`, problematicItems)
          }
        }
      }
    } catch (error) {
      logger('buildHorizontalTimeline | Post-creation check failed:', error)
    }
  }, 500)

  // these are probably non-performant but it works so ¯\_(ツ)_/¯
  // dynamically add and remove a "special" class on hover
  // cannot use standard :hover styling due to the structure
  // of the timeline being so broken up across elements. This
  // ensures that all elements related to an event are highlighted.
  timeline.on( 'itemover', ( props ) => {
    const event = items.get( props.item ) as unknown as EventItem
    const newClass = event.className + ' runtime-hover'
    document.documentElement.style.setProperty( '--hoverHighlightColor', event._event?.color ?? 'white' )
    const timelineItem = buildCombinedTimelineDataObject( event, { className: newClass })
    items.updateOnly( [timelineItem] )

    return () => {
      timeline.off( 'itemover' )
    }
  })

  timeline.on( 'itemout', ( props ) => {
    const event = items.get( props.item ) as unknown as EventItem
    const newClass = event.className.split( ' runtime-hover' )[0]
    const timelineItem = buildCombinedTimelineDataObject( event, { className: newClass })
    items.updateOnly( [timelineItem] )

    return () => {
      timeline.off( 'itemout' )
    }
  })

  // Replace the selected tags with the timeline html
  el.appendChild( timelineDiv )
}
