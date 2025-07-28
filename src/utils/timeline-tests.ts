import { Notice } from 'obsidian'
import { parseSimplifiedDate, buildTimelineDate, validateTimelineType } from './dates'
import { DEFAULT_DATE_PARSING_CONFIG } from '../constants'
import { DateParsingConfig, CleanedDateResultObject } from '../types'

export interface TestResult {
  name: string
  passed: boolean
  message: string
  details?: any
}

export interface TimelineTestSuite {
  name: string
  tests: TestResult[]
  passed: boolean
  summary: string
}

/**
 * Run comprehensive timeline tests
 */
export class TimelineTestRunner {
  private config: DateParsingConfig
  private results: TimelineTestSuite[] = []

  constructor(config: DateParsingConfig = DEFAULT_DATE_PARSING_CONFIG) {
    this.config = config
  }

  /**
   * Run all timeline tests
   */
  async runAllTests(): Promise<TimelineTestSuite[]> {
    this.results = []
    
    // Run test suites
    await this.testDateParsing()
    await this.testDateValidation()
    await this.testTimelineTypes()
    await this.testEdgeCases()
    
    return this.results
  }

  /**
   * Test date parsing functionality
   */
  private async testDateParsing(): Promise<void> {
    const tests: TestResult[] = []
    
    // Test basic date parsing
    tests.push(this.testBasicDateParsing())
    tests.push(this.testPartialDates())
    tests.push(this.testEndDateGeneration())
    tests.push(this.testDateFormats())
    
    const passed = tests.every(t => t.passed)
    this.results.push({
      name: 'Date Parsing',
      tests,
      passed,
      summary: `${tests.filter(t => t.passed).length}/${tests.length} tests passed`
    })
  }

  /**
   * Test date validation
   */
  private async testDateValidation(): Promise<void> {
    const tests: TestResult[] = []
    
    tests.push(this.testInvalidDates())
    tests.push(this.testExtremeDates())
    tests.push(this.testDateOrdering())
    
    const passed = tests.every(t => t.passed)
    this.results.push({
      name: 'Date Validation',
      tests,
      passed,
      summary: `${tests.filter(t => t.passed).length}/${tests.length} tests passed`
    })
  }

  /**
   * Test timeline types
   */
  private async testTimelineTypes(): Promise<void> {
    const tests: TestResult[] = []
    
    tests.push(this.testValidTimelineTypes())
    tests.push(this.testInvalidTimelineTypes())
    
    const passed = tests.every(t => t.passed)
    this.results.push({
      name: 'Timeline Types',
      tests,
      passed,
      summary: `${tests.filter(t => t.passed).length}/${tests.length} tests passed`
    })
  }

  /**
   * Test edge cases
   */
  private async testEdgeCases(): Promise<void> {
    const tests: TestResult[] = []
    
    tests.push(this.testEmptyDates())
    tests.push(this.testSpecialCharacters())
    tests.push(this.testBoundaryValues())
    
    const passed = tests.every(t => t.passed)
    this.results.push({
      name: 'Edge Cases',
      tests,
      passed,
      summary: `${tests.filter(t => t.passed).length}/${tests.length} tests passed`
    })
  }

  // Individual test methods
  private testBasicDateParsing(): TestResult {
    try {
      const result = parseSimplifiedDate('20250725', this.config, false, 'box')
      if (!result) {
        return { name: 'Basic Date Parsing', passed: false, message: 'Failed to parse basic date' }
      }
      
      if (result.year !== 2025 || result.month !== 6 || result.day !== 25) {
        return { 
          name: 'Basic Date Parsing', 
          passed: false, 
          message: 'Parsed date components incorrect',
          details: { expected: { year: 2025, month: 6, day: 25 }, actual: result }
        }
      }
      
      return { name: 'Basic Date Parsing', passed: true, message: 'Successfully parsed basic date' }
    } catch (error) {
      return { name: 'Basic Date Parsing', passed: false, message: `Error: ${error.message}` }
    }
  }

  private testPartialDates(): TestResult {
    try {
      // Test year only
      const yearOnly = parseSimplifiedDate('2025', this.config, false, 'box')
      if (!yearOnly || yearOnly.year !== 2025 || yearOnly.month !== 0 || yearOnly.day !== 1) {
        return { name: 'Partial Dates', passed: false, message: 'Year-only parsing failed' }
      }

      // Test year and month
      const yearMonth = parseSimplifiedDate('202507', this.config, false, 'box')
      if (!yearMonth || yearMonth.year !== 2025 || yearMonth.month !== 6 || yearMonth.day !== 1) {
        return { name: 'Partial Dates', passed: false, message: 'Year-month parsing failed' }
      }

      return { name: 'Partial Dates', passed: true, message: 'Successfully parsed partial dates' }
    } catch (error) {
      return { name: 'Partial Dates', passed: false, message: `Error: ${error.message}` }
    }
  }

  private testEndDateGeneration(): TestResult {
    try {
      const endDate = parseSimplifiedDate('2025', this.config, true, 'box')
      if (!endDate || endDate.year !== 2026) {
        return { name: 'End Date Generation', passed: false, message: 'End date generation failed' }
      }

      // Point events should not generate end dates differently
      const pointEndDate = parseSimplifiedDate('2025', this.config, true, 'point')
      if (!pointEndDate || pointEndDate.year !== 2025) {
        return { name: 'End Date Generation', passed: false, message: 'Point event end date handling failed' }
      }

      return { name: 'End Date Generation', passed: true, message: 'End date generation working correctly' }
    } catch (error) {
      return { name: 'End Date Generation', passed: false, message: `Error: ${error.message}` }
    }
  }

  private testDateFormats(): TestResult {
    try {
      // Test with separators
      const withSeparators = parseSimplifiedDate('2025-07-25', this.config, false, 'box')
      if (!withSeparators || withSeparators.year !== 2025) {
        return { name: 'Date Formats', passed: false, message: 'Date with separators failed' }
      }

      // Test with different separators
      const withDots = parseSimplifiedDate('2025.07.25', this.config, false, 'box')
      if (!withDots || withDots.year !== 2025) {
        return { name: 'Date Formats', passed: false, message: 'Date with dots failed' }
      }

      return { name: 'Date Formats', passed: true, message: 'Various date formats parsed correctly' }
    } catch (error) {
      return { name: 'Date Formats', passed: false, message: `Error: ${error.message}` }
    }
  }

  private testInvalidDates(): TestResult {
    try {
      // Test empty string
      const empty = parseSimplifiedDate('', this.config, false, 'box')
      if (empty !== null) {
        return { name: 'Invalid Dates', passed: false, message: 'Empty string should return null' }
      }

      // Test invalid year
      const invalidYear = parseSimplifiedDate('abcd', this.config, false, 'box')
      if (invalidYear !== null) {
        return { name: 'Invalid Dates', passed: false, message: 'Invalid year should return null' }
      }

      return { name: 'Invalid Dates', passed: true, message: 'Invalid dates handled correctly' }
    } catch (error) {
      return { name: 'Invalid Dates', passed: false, message: `Error: ${error.message}` }
    }
  }

  private testExtremeDates(): TestResult {
    try {
      // Test very old date
      const oldDate = parseSimplifiedDate('0001', this.config, false, 'box')
      if (!oldDate || oldDate.year !== 1) {
        return { name: 'Extreme Dates', passed: false, message: 'Very old date parsing failed' }
      }

      // Test future date
      const futureDate = parseSimplifiedDate('9999', this.config, false, 'box')
      if (!futureDate || futureDate.year !== 9999) {
        return { name: 'Extreme Dates', passed: false, message: 'Future date parsing failed' }
      }

      return { name: 'Extreme Dates', passed: true, message: 'Extreme dates handled correctly' }
    } catch (error) {
      return { name: 'Extreme Dates', passed: false, message: `Error: ${error.message}` }
    }
  }

  private testDateOrdering(): TestResult {
    try {
      const startDate = parseSimplifiedDate('2025', this.config, false, 'box')
      const endDate = parseSimplifiedDate('2025', this.config, true, 'box')
      
      if (!startDate || !endDate) {
        return { name: 'Date Ordering', passed: false, message: 'Failed to create test dates' }
      }

      const startDateObj = buildTimelineDate(startDate)
      const endDateObj = buildTimelineDate(endDate)

      if (!startDateObj || !endDateObj) {
        return { name: 'Date Ordering', passed: false, message: 'Failed to build timeline dates' }
      }

      if (endDateObj <= startDateObj) {
        return { name: 'Date Ordering', passed: false, message: 'End date should be after start date' }
      }

      return { name: 'Date Ordering', passed: true, message: 'Date ordering correct' }
    } catch (error) {
      return { name: 'Date Ordering', passed: false, message: `Error: ${error.message}` }
    }
  }

  private testValidTimelineTypes(): TestResult {
    try {
      const validTypes = ['box', 'point', 'range', 'background']
      
      for (const type of validTypes) {
        const result = validateTimelineType(type)
        if (result !== type) {
          return { name: 'Valid Timeline Types', passed: false, message: `Type ${type} validation failed` }
        }
      }

      return { name: 'Valid Timeline Types', passed: true, message: 'All valid types accepted' }
    } catch (error) {
      return { name: 'Valid Timeline Types', passed: false, message: `Error: ${error.message}` }
    }
  }

  private testInvalidTimelineTypes(): TestResult {
    try {
      const invalidTypes = ['event', 'invalid', '', null, undefined]
      
      for (const type of invalidTypes) {
        const result = validateTimelineType(type)
        if (result !== 'box') {
          return { name: 'Invalid Timeline Types', passed: false, message: `Invalid type ${type} should default to box` }
        }
      }

      return { name: 'Invalid Timeline Types', passed: true, message: 'Invalid types correctly default to box' }
    } catch (error) {
      return { name: 'Invalid Timeline Types', passed: false, message: `Error: ${error.message}` }
    }
  }

  private testEmptyDates(): TestResult {
    try {
      const nullResult = parseSimplifiedDate(null as any, this.config, false, 'box')
      const undefinedResult = parseSimplifiedDate(undefined as any, this.config, false, 'box')
      
      if (nullResult !== null || undefinedResult !== null) {
        return { name: 'Empty Dates', passed: false, message: 'Null/undefined dates should return null' }
      }

      return { name: 'Empty Dates', passed: true, message: 'Empty dates handled correctly' }
    } catch (error) {
      return { name: 'Empty Dates', passed: false, message: `Error: ${error.message}` }
    }
  }

  private testSpecialCharacters(): TestResult {
    try {
      // Test with various separators and special characters
      const testCases = ['2025/07/25', '2025.07.25', '2025_07_25', '2025 07 25']
      
      for (const testCase of testCases) {
        const result = parseSimplifiedDate(testCase, this.config, false, 'box')
        if (!result || result.year !== 2025 || result.month !== 6 || result.day !== 25) {
          return { name: 'Special Characters', passed: false, message: `Failed to parse: ${testCase}` }
        }
      }

      return { name: 'Special Characters', passed: true, message: 'Special characters handled correctly' }
    } catch (error) {
      return { name: 'Special Characters', passed: false, message: `Error: ${error.message}` }
    }
  }

  private testBoundaryValues(): TestResult {
    try {
      // Test month boundaries
      const jan = parseSimplifiedDate('202501', this.config, false, 'box')
      const dec = parseSimplifiedDate('202512', this.config, false, 'box')
      
      if (!jan || jan.month !== 0 || !dec || dec.month !== 11) {
        return { name: 'Boundary Values', passed: false, message: 'Month boundary values failed' }
      }

      // Test day boundaries
      const day1 = parseSimplifiedDate('20250101', this.config, false, 'box')
      const day31 = parseSimplifiedDate('20250131', this.config, false, 'box')
      
      if (!day1 || day1.day !== 1 || !day31 || day31.day !== 31) {
        return { name: 'Boundary Values', passed: false, message: 'Day boundary values failed' }
      }

      return { name: 'Boundary Values', passed: true, message: 'Boundary values handled correctly' }
    } catch (error) {
      return { name: 'Boundary Values', passed: false, message: `Error: ${error.message}` }
    }
  }

  /**
   * Generate a comprehensive test report
   */
  generateReport(): string {
    const totalTests = this.results.reduce((sum, suite) => sum + suite.tests.length, 0)
    const passedTests = this.results.reduce((sum, suite) => sum + suite.tests.filter(t => t.passed).length, 0)
    const failedSuites = this.results.filter(suite => !suite.passed)

    let report = `# Timeline Test Report\n\n`
    report += `**Overall Result**: ${passedTests}/${totalTests} tests passed\n\n`

    if (failedSuites.length === 0) {
      report += `✅ **All test suites passed!** The timeline system is working correctly.\n\n`
    } else {
      report += `⚠️ **${failedSuites.length} test suite(s) failed.** Issues detected:\n\n`
    }

    // Detailed results
    for (const suite of this.results) {
      const icon = suite.passed ? '✅' : '❌'
      report += `${icon} **${suite.name}**: ${suite.summary}\n`
      
      if (!suite.passed) {
        const failedTests = suite.tests.filter(t => !t.passed)
        for (const test of failedTests) {
          report += `  - ❌ ${test.name}: ${test.message}\n`
          if (test.details) {
            report += `    Details: ${JSON.stringify(test.details, null, 2)}\n`
          }
        }
      }
      report += '\n'
    }

    return report
  }

  /**
   * Show test results to user
   */
  showResults(): void {
    const totalTests = this.results.reduce((sum, suite) => sum + suite.tests.length, 0)
    const passedTests = this.results.reduce((sum, suite) => sum + suite.tests.filter(t => t.passed).length, 0)
    const failedSuites = this.results.filter(suite => !suite.passed)

    if (failedSuites.length === 0) {
      new Notice(`✅ Timeline tests passed! (${passedTests}/${totalTests})`, 5000)
    } else {
      new Notice(`⚠️ Timeline tests failed! (${passedTests}/${totalTests}) - Check console for details`, 8000)
      console.log(this.generateReport())
    }
  }
}

/**
 * Quick test function that can be called from console
 */
export const runTimelineTests = async (config?: DateParsingConfig): Promise<void> => {
  console.log('🧪 Running Timeline Tests...')
  
  const runner = new TimelineTestRunner(config)
  const results = await runner.runAllTests()
  
  console.log(runner.generateReport())
  runner.showResults()
  
  // Make results available globally for debugging
  ;(window as any).timelineTestResults = results
  console.log('Test results available at: window.timelineTestResults')
}
