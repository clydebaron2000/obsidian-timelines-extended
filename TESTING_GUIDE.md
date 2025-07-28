# Timeline Testing & Health Check Guide

This plugin includes a comprehensive testing system to ensure both horizontal and vertical timelines are working properly and to help diagnose issues.

## 🧪 Testing Commands

The plugin provides three main testing commands accessible through the Command Palette (Ctrl/Cmd + P):

### 1. **Test Timeline System**
- **Command**: `Test Timeline System`
- **Purpose**: Runs comprehensive tests on the date parsing and timeline functionality
- **What it tests**:
  - Date parsing with various formats
  - Partial date handling (year-only, year+month, etc.)
  - End date auto-generation
  - Date validation and edge cases
  - Timeline type validation
  - Boundary value testing

### 2. **Check Timeline Health**
- **Command**: `Check Timeline Health`
- **Purpose**: Analyzes all rendered timelines on the current page
- **What it checks**:
  - Timeline rendering status
  - Item count and validity
  - Date consistency
  - Infinite loop detection
  - Error messages and warnings

### 3. **Debug Timeline Data**
- **Command**: `Debug Timeline Data`
- **Purpose**: Provides detailed debugging information about timeline data
- **What it shows**:
  - Timeline elements and their data
  - Item details and validation
  - Timeline options and settings
  - Problematic items identification

## 🖥️ Console Functions

You can also run these tests directly from the browser console:

```javascript
// Run comprehensive timeline tests
window.runTimelineTests()

// Check health of all timelines on page
window.checkTimelineHealth()

// Debug timeline data and structure
window.debugTimeline()
```

## 📊 Understanding Test Results

### Test System Results
- **✅ Green**: All tests passed - system is working correctly
- **⚠️ Yellow**: Some warnings - minor issues that don't break functionality
- **❌ Red**: Test failures - issues that need attention

### Health Check Results
- **Healthy**: Timeline is rendering correctly with no issues
- **Warning**: Timeline works but has minor issues (empty timeline, broken links, etc.)
- **Error**: Timeline has serious issues (invalid dates, infinite loops, rendering failures)

## 🔧 Common Issues and Solutions

### Infinite Loop Warnings
**Symptoms**: Console shows "WARNING: infinite loop in redraw?"
**Causes**:
- Invalid date objects
- End dates before start dates
- Extreme date values
- Invalid timeline options

**Solutions**:
1. Run `window.checkTimelineHealth()` to identify the problem
2. Check your date formats match the plugin settings
3. Ensure end dates are after start dates
4. Verify dates are within reasonable ranges

### Timeline Not Rendering
**Symptoms**: Empty timeline or error message displayed
**Causes**:
- No timeline items found
- All items have invalid dates
- Timeline creation failed

**Solutions**:
1. Run `window.debugTimeline()` to see detailed information
2. Check that your notes have the correct timeline tags
3. Verify date formats match your settings
4. Run `Test Timeline System` to check date parsing

### Date Parsing Issues
**Symptoms**: Dates not appearing correctly on timeline
**Causes**:
- Date format doesn't match settings
- Missing date components
- Invalid date values

**Solutions**:
1. Check your Date Parsing Configuration in settings
2. Ensure character lengths match your date format
3. Run `Test Timeline System` to verify parsing works
4. Use consistent date formats across your notes

## 🚀 Best Practices

### Before Creating Timelines
1. Run `Test Timeline System` to ensure the system is working
2. Verify your date parsing settings match your date format
3. Test with a small number of timeline items first

### When Issues Occur
1. Run `Check Timeline Health` to identify problems
2. Use `Debug Timeline Data` for detailed investigation
3. Check the browser console for error messages
4. Refer to the troubleshooting guide

### Regular Maintenance
1. Run health checks periodically, especially after:
   - Changing date parsing settings
   - Adding many new timeline items
   - Updating the plugin
2. Monitor console for warnings during timeline creation
3. Test both horizontal and vertical timeline types

## 📋 Test Coverage

The testing system covers:

### Date Parsing Tests
- ✅ Basic date parsing (YYYYMMDD format)
- ✅ Partial dates (year-only, year+month)
- ✅ Date formats with separators
- ✅ End date auto-generation
- ✅ Invalid date handling
- ✅ Extreme date values
- ✅ Boundary conditions

### Timeline Validation Tests
- ✅ Valid timeline types (box, point, range, background)
- ✅ Invalid type handling
- ✅ Date ordering validation
- ✅ Empty data handling

### Health Check Tests
- ✅ Timeline rendering status
- ✅ Item count and validity
- ✅ Date consistency checks
- ✅ Infinite loop detection
- ✅ Error message identification

## 🆘 Getting Help

If tests fail or health checks show errors:

1. **Check the Console**: Look for detailed error messages
2. **Run All Tests**: Use all three testing commands to get complete picture
3. **Review Settings**: Ensure date parsing configuration is correct
4. **Check Documentation**: Refer to the troubleshooting guide
5. **Report Issues**: If problems persist, report with test results

## 🔄 Automated Checks

The plugin automatically:
- Runs basic health checks after creating horizontal timelines
- Logs warnings for problematic timeline items
- Validates dates during parsing
- Provides fallback timelines when creation fails

These automated checks help catch issues early and provide better error messages for debugging.

## 📈 Performance Monitoring

The testing system also helps monitor performance:
- Tracks timeline creation time
- Identifies slow-rendering timelines
- Detects infinite loop conditions
- Monitors memory usage patterns

Regular testing helps ensure your timelines remain fast and responsive as your vault grows.
