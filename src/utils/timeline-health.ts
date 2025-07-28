import { Notice } from 'obsidian'

export interface TimelineHealthCheck {
  element: HTMLElement
  type: 'horizontal' | 'vertical'
  status: 'healthy' | 'warning' | 'error'
  issues: string[]
  itemCount: number
  hasInfiniteLoop: boolean
}

/**
 * Health checker for rendered timelines
 */
export class TimelineHealthChecker {
  private checks: TimelineHealthCheck[] = []

  /**
   * Check all timelines on the page
   */
  checkAllTimelines(): TimelineHealthCheck[] {
    this.checks = []
    
    // Find all timeline elements
    const horizontalTimelines = document.querySelectorAll('.timeline-vis')
    const verticalTimelines = document.querySelectorAll('.timeline')

    // Check horizontal timelines
    horizontalTimelines.forEach(element => {
      this.checks.push(this.checkHorizontalTimeline(element as HTMLElement))
    })

    // Check vertical timelines
    verticalTimelines.forEach(element => {
      this.checks.push(this.checkVerticalTimeline(element as HTMLElement))
    })

    return this.checks
  }

  /**
   * Check a horizontal timeline
   */
  private checkHorizontalTimeline(element: HTMLElement): TimelineHealthCheck {
    const issues: string[] = []
    let status: 'healthy' | 'warning' | 'error' = 'healthy'
    let itemCount = 0
    let hasInfiniteLoop = false

    // Check if timeline has vis-timeline instance
    const visInstance = (element as any).timeline
    if (!visInstance) {
      issues.push('No vis-timeline instance found')
      status = 'error'
    } else {
      // Check timeline data
      try {
        const items = visInstance.itemsData?.get()
        const groups = visInstance.groupsData?.get()
        
        itemCount = items?.length || 0
        
        if (itemCount === 0) {
          issues.push('No timeline items found')
          status = 'warning'
        }

        // Check for problematic items
        if (items) {
          const problematicItems = items.filter((item: any) => {
            const startInvalid = !item.start || isNaN(new Date(item.start).getTime())
            const endInvalid = item.end && isNaN(new Date(item.end).getTime())
            const endBeforeStart = item.end && item.start && new Date(item.end) <= new Date(item.start)
            
            return startInvalid || endInvalid || endBeforeStart
          })

          if (problematicItems.length > 0) {
            issues.push(`${problematicItems.length} items have invalid dates`)
            status = 'error'
          }
        }

        // Check timeline options
        const options = visInstance.options
        if (options) {
          const optionDates = ['start', 'end', 'min', 'max']
          const invalidOptions = optionDates.filter(key => {
            const date = options[key]
            return date && (isNaN(date.getTime()) || !isFinite(date.getTime()))
          })

          if (invalidOptions.length > 0) {
            issues.push(`Invalid timeline options: ${invalidOptions.join(', ')}`)
            status = 'error'
          }

          // Check zoom limits
          if (options.zoomMin >= options.zoomMax) {
            issues.push('Invalid zoom limits (zoomMin >= zoomMax)')
            status = 'error'
          }
        }

      } catch (error) {
        issues.push(`Error inspecting timeline data: ${error.message}`)
        status = 'error'
      }
    }

    // Check for infinite loop indicators
    hasInfiniteLoop = this.checkForInfiniteLoop(element)
    if (hasInfiniteLoop) {
      issues.push('Infinite loop detected in timeline rendering')
      status = 'error'
    }

    // Check for error messages
    const errorMessage = element.querySelector('.timeline-error-message')
    if (errorMessage) {
      issues.push('Timeline has error message displayed')
      status = 'error'
    }

    return {
      element,
      type: 'horizontal',
      status,
      issues,
      itemCount,
      hasInfiniteLoop
    }
  }

  /**
   * Check a vertical timeline
   */
  private checkVerticalTimeline(element: HTMLElement): TimelineHealthCheck {
    const issues: string[] = []
    let status: 'healthy' | 'warning' | 'error' = 'healthy'
    let itemCount = 0

    // Count timeline cards
    const timelineCards = element.querySelectorAll('.timeline-card')
    itemCount = timelineCards.length

    if (itemCount === 0) {
      issues.push('No timeline cards found')
      status = 'warning'
    }

    // Check for timeline containers
    const timelineContainers = element.querySelectorAll('.timeline-container')
    if (timelineContainers.length === 0) {
      issues.push('No timeline containers found')
      status = 'error'
    }

    // Check for date headers
    const dateHeaders = element.querySelectorAll('h2')
    if (dateHeaders.length === 0) {
      issues.push('No date headers found')
      status = 'warning'
    }

    // Check for broken internal links
    const internalLinks = element.querySelectorAll('.internal-link')
    let brokenLinks = 0
    internalLinks.forEach(link => {
      if (!link.getAttribute('href')) {
        brokenLinks++
      }
    })

    if (brokenLinks > 0) {
      issues.push(`${brokenLinks} broken internal links`)
      status = 'warning'
    }

    return {
      element,
      type: 'vertical',
      status,
      issues,
      itemCount,
      hasInfiniteLoop: false // Vertical timelines don't have this issue
    }
  }

  /**
   * Check for infinite loop indicators
   */
  private checkForInfiniteLoop(element: HTMLElement): boolean {
    // Check console for infinite loop warnings
    const originalConsoleWarn = console.warn
    let infiniteLoopDetected = false

    // Temporarily override console.warn to catch infinite loop warnings
    console.warn = (...args: any[]) => {
      const message = args.join(' ')
      if (message.includes('infinite loop') && message.includes('redraw')) {
        infiniteLoopDetected = true
      }
      originalConsoleWarn.apply(console, args)
    }

    // Restore original console.warn after a short delay
    setTimeout(() => {
      console.warn = originalConsoleWarn
    }, 1000)

    return infiniteLoopDetected
  }

  /**
   * Generate health report
   */
  generateHealthReport(): string {
    const totalTimelines = this.checks.length
    const healthyTimelines = this.checks.filter(c => c.status === 'healthy').length
    const warningTimelines = this.checks.filter(c => c.status === 'warning').length
    const errorTimelines = this.checks.filter(c => c.status === 'error').length

    let report = `# Timeline Health Report\n\n`
    report += `**Total Timelines**: ${totalTimelines}\n`
    report += `**Healthy**: ${healthyTimelines} ✅\n`
    report += `**Warnings**: ${warningTimelines} ⚠️\n`
    report += `**Errors**: ${errorTimelines} ❌\n\n`

    if (errorTimelines === 0 && warningTimelines === 0) {
      report += `🎉 **All timelines are healthy!**\n\n`
    }

    // Detailed results
    this.checks.forEach((check, index) => {
      const statusIcon = check.status === 'healthy' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'
      report += `${statusIcon} **Timeline ${index + 1}** (${check.type})\n`
      report += `  - Items: ${check.itemCount}\n`
      
      if (check.hasInfiniteLoop) {
        report += `  - 🔄 **Infinite loop detected**\n`
      }

      if (check.issues.length > 0) {
        report += `  - Issues:\n`
        check.issues.forEach(issue => {
          report += `    - ${issue}\n`
        })
      }
      report += '\n'
    })

    return report
  }

  /**
   * Show health results to user
   */
  showHealthResults(): void {
    const totalTimelines = this.checks.length
    const errorTimelines = this.checks.filter(c => c.status === 'error').length
    const warningTimelines = this.checks.filter(c => c.status === 'warning').length

    if (totalTimelines === 0) {
      new Notice('No timelines found on this page', 3000)
      return
    }

    if (errorTimelines === 0 && warningTimelines === 0) {
      new Notice(`✅ All ${totalTimelines} timeline(s) are healthy!`, 5000)
    } else {
      const message = `⚠️ Timeline issues found: ${errorTimelines} errors, ${warningTimelines} warnings`
      new Notice(message, 8000)
      console.log(this.generateHealthReport())
    }
  }
}

/**
 * Quick health check function that can be called from console
 */
export const checkTimelineHealth = (): void => {
  console.log('🏥 Checking Timeline Health...')
  
  const checker = new TimelineHealthChecker()
  const results = checker.checkAllTimelines()
  
  console.log(checker.generateHealthReport())
  checker.showHealthResults()
  
  // Make results available globally for debugging
  ;(window as any).timelineHealthResults = results
  console.log('Health check results available at: window.timelineHealthResults')
}
