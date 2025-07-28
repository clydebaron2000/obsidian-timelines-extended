import { DEVELOPER_SETTINGS } from '../constants'

/**
 * A custom logging wrapper that only logs if we're in DEBUG mode.
 *
 * @param message The message to display
 * @param object optional - an object to display alongside the message
 */
export const logger = ( message: string, object?: unknown ) => {
  if ( !DEVELOPER_SETTINGS.debug ) return

  console.log( message, object ?? '' )
}

/**
 * Global debugging helper for timeline data inspection
 * Can be called from browser console: window.debugTimeline()
 */
export const setupTimelineDebugger = () => {
  if ( typeof window !== 'undefined' ) {
    (window as any).debugTimeline = () => {
      console.log( '=== Timeline Debug Information ===' )
      
      // Find all timeline elements
      const timelineElements = document.querySelectorAll( '.timeline-vis' )
      console.log( `Found ${timelineElements.length} timeline elements` )
      
      timelineElements.forEach(( element, index ) => {
        console.log( `\n--- Timeline ${index + 1} ---` )
        console.log( 'Element:', element )
        
        // Try to get vis-timeline instance data
        const visData = (element as any).timeline
        if ( visData ) {
          console.log( 'Vis-timeline instance found' )
          
          try {
            const items = visData.itemsData?.get()
            const groups = visData.groupsData?.get()
            
            console.log( `Items (${items?.length || 0}):`, items )
            console.log( `Groups (${groups?.length || 0}):`, groups )
            
            // Check for problematic dates
            if ( items ) {
              const problematicItems = items.filter(( item: any ) => {
                const startInvalid = !item.start || isNaN( new Date( item.start ).getTime())
                const endInvalid = item.end && isNaN( new Date( item.end ).getTime())
                const endBeforeStart = item.end && item.start && new Date( item.end ) <= new Date( item.start )
                
                return startInvalid || endInvalid || endBeforeStart
              })
              
              if ( problematicItems.length > 0 ) {
                console.warn( `Found ${problematicItems.length} problematic items:`, problematicItems )
              } else {
                console.log( 'All items appear to have valid dates' )
              }
            }
            
            // Check timeline options
            const options = visData.options
            if ( options ) {
              console.log( 'Timeline options:', {
                start: options.start,
                end: options.end,
                min: options.min,
                max: options.max,
                zoomMin: options.zoomMin,
                zoomMax: options.zoomMax
              })
              
              // Validate option dates
              const optionDates = ['start', 'end', 'min', 'max']
              const invalidOptions = optionDates.filter( key => {
                const date = options[key]
                return date && ( isNaN( date.getTime()) || !isFinite( date.getTime()))
              })
              
              if ( invalidOptions.length > 0 ) {
                console.warn( 'Invalid option dates:', invalidOptions )
              }
            }
            
          } catch ( error ) {
            console.error( 'Error inspecting timeline data:', error )
          }
        } else {
          console.log( 'No vis-timeline instance found on element' )
        }
      })
      
      console.log( '\n=== End Timeline Debug ===' )
      console.log( '\n🧪 Available test commands (use Command Palette):' )
      console.log( '- Test Timeline System' )
      console.log( '- Check Timeline Health' )
      console.log( '- Debug Timeline Data' )
    }
    
    console.log( 'Timeline debugger available. Call window.debugTimeline() to inspect timeline data.' )
  }
}
