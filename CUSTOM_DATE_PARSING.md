# Simplified Date Parsing System

This plugin now uses a simplified date parsing system that allows you to configure how many characters to parse for each date component. This replaces the previous regex-based system with a more intuitive approach.

## Key Features

### Configurable Character Lengths
Configure how many characters to parse for each date component:
- **Year Length**: Default 4 characters (e.g., "2025")
- **Month Length**: Default 2 characters (e.g., "07")
- **Day Length**: Default 2 characters (e.g., "25")
- **Hour Length**: Default 2 characters (e.g., "14")
- **Minute Length**: Default 2 characters (e.g., "30")

### Partial Date Support
You can use partial dates where higher-level components are present but lower ones are missing:
- **Year only**: "2025" → Parsed as 2025-01-01-00-00
- **Year + Month**: "202507" → Parsed as 2025-07-01-00-00
- **Year + Month + Day**: "20250725" → Parsed as 2025-07-25-00-00
- **Full date**: "2025072514" → Parsed as 2025-07-25-14-00
- **With minutes**: "202507251430" → Parsed as 2025-07-25-14-30

### Automatic End Date Generation
When an end date is not specified, the plugin automatically generates one by rounding up to the next unit:
- **Year only** (2025) → End date: 2026-01-01
- **Year + Month** (2025-07) → End date: 2025-08-01
- **Year + Month + Day** (2025-07-25) → End date: 2025-07-26
- **With hour** (2025-07-25-14) → End date: 2025-07-25-15
- **With minute** (2025-07-25-14-30) → End date: 2025-07-25-14-31

### Point Events
Events with type "point" do not get auto-generated end dates, as they represent single moments in time.

## Configuration

Access the settings through:
`Settings → Community Plugins → Timelines (Revamped) → Date Parsing Configuration`

### Settings Options:
- **Year Length**: Number of characters for year (default: 4)
- **Month Length**: Number of characters for month (default: 2)
- **Day Length**: Number of characters for day (default: 2)
- **Hour Length**: Number of characters for hour (default: 2)
- **Minute Length**: Number of characters for minute (default: 2)

## Usage Examples

### Frontmatter
```yaml
---
start-date: 2025
end-date: 2026
type: box
---
```

```yaml
---
start-date: 20250725
end-date: 20250726
type: range
---
```

### HTML Data Attributes
```html
<div data-start-date="2025" data-type="point">
  Event content here
</div>
```

## Migration from Previous System

If you're upgrading from the previous regex-based system, your settings will be automatically migrated to use the default character lengths (4-2-2-2-2). You can adjust these in the settings if needed.

## Date Processing Flow

1. **Input**: Raw date string from frontmatter or HTML attributes
2. **Cleaning**: Remove all non-digit characters
3. **Parsing**: Extract components based on configured character lengths
4. **Validation**: Ensure year is present (minimum requirement)
5. **End Date Generation**: Auto-generate end dates for non-point events
6. **Normalization**: Convert to internal YYYY-MM-DD-HH-MM format
7. **Display**: Format for timeline rendering

## Benefits

- **Simpler Configuration**: No need to write complex regex patterns
- **More Intuitive**: Character-based parsing is easier to understand
- **Flexible**: Supports various date formats through character length configuration
- **Automatic**: End date generation reduces manual work
- **Backward Compatible**: Existing timelines continue to work after migration
- **Robust**: Includes validation to prevent timeline rendering issues

## Error Prevention

The system includes several safeguards to prevent common timeline issues:

- **Date Validation**: Ensures all date components are valid before creating timeline items
- **End Date Adjustment**: Automatically adjusts end dates that are not after start dates
- **Invalid Date Handling**: Gracefully handles invalid dates by logging warnings and skipping problematic events
- **Timeline Type Validation**: Ensures only valid vis-timeline types are used

## Timeline Types

The plugin validates timeline item types. Valid types are:
- `box` (default) - Rectangular items with content
- `point` - Point items for single moments
- `range` - Range items spanning time periods
- `background` - Background items

Invalid types are automatically converted to "box" type.
