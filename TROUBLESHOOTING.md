# Troubleshooting Guide

## Infinite Loop Warning

If you see "WARNING: infinite loop in redraw?" in the console, this indicates that the vis-timeline library is having trouble rendering the timeline data. This is usually caused by invalid or problematic date data.

### Quick Fixes

1. **Check Your Date Format**: Ensure your dates follow the expected format based on your settings
2. **Verify Date Values**: Make sure all dates are valid (no impossible dates like February 30th)
3. **Check End Dates**: Ensure end dates are after start dates for non-point events

### Debugging Steps

1. **Enable Debug Mode**: 
   - Open the plugin settings
   - Enable debug mode if available
   - Check the console for detailed logging

2. **Use the Timeline Debugger**:
   - Open the browser console (F12)
   - Type `window.debugTimeline()` and press Enter
   - This will show detailed information about your timeline data

3. **Check for Common Issues**:
   - Invalid date formats
   - End dates before start dates
   - Missing required date components
   - Extremely large or small date values

### Common Causes and Solutions

#### Extreme Default Date Values (FIXED)
**Problem**: Timeline uses extreme default dates (like year -3000 or 3000) causing infinite loops
**Solution**: This has been fixed in the latest version. Default dates now use reasonable ranges (current year ±50-100 years)
**If you still see this**: Update to the latest plugin version

#### Invalid Date Formats
**Problem**: Dates that don't match your configured character lengths
**Solution**: Check your date parsing settings and ensure your dates match the expected format

#### End Dates Before Start Dates
**Problem**: Timeline items with end dates that are the same as or before start dates
**Solution**: The plugin now automatically adjusts these, but you may want to fix them in your source data

#### Missing Date Components
**Problem**: Dates missing required components (like year)
**Solution**: Ensure all dates have at least a year component

#### Extreme Date Values
**Problem**: Dates that are too far in the past or future
**Solution**: Use reasonable date ranges (avoid dates before year 1 or after year 9999)

### Advanced Debugging

If the basic steps don't resolve the issue:

1. **Check Timeline Options**:
   ```javascript
   window.debugTimeline()
   // Look for invalid start, end, min, max dates in the output
   ```

2. **Inspect Individual Items**:
   ```javascript
   // The debugger will show problematic items
   // Look for items with invalid start/end dates
   ```

3. **Validate Zoom Settings**:
   - Check if zoomMin and zoomMax values are reasonable
   - Ensure zoomMin < zoomMax

### Plugin Safeguards

The plugin includes several automatic fixes:

- **Date Validation**: Invalid dates are caught and logged
- **End Date Adjustment**: End dates that aren't after start dates are automatically adjusted
- **Fallback Timeline**: If timeline creation fails, a safe fallback is created
- **Zoom Limit Validation**: Invalid zoom limits are corrected

### Reporting Issues

If you continue to experience infinite loop warnings:

1. Run `window.debugTimeline()` in the console
2. Copy the output
3. Note which timeline is causing the issue
4. Report the issue with the debug output

### Prevention

To prevent infinite loop issues:

- Use consistent date formats
- Validate your dates before adding them to notes
- Use the simplified date parsing system with appropriate character lengths
- Test with a small number of timeline items first

## Other Common Issues

### Timeline Not Rendering
- Check that your timeline block syntax is correct
- Ensure you have timeline items with the correct tags
- Verify your date formats match the plugin settings

### Dates Not Parsing Correctly
- Check your date parsing configuration
- Ensure character lengths match your date format
- Use the debugger to inspect parsed dates

### Performance Issues
- Reduce the number of timeline items
- Use more specific date ranges
- Consider breaking large timelines into smaller ones
