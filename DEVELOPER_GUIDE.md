# Developer Guide - Obsidian Timelines (Revamped)

This guide provides comprehensive information for developers working on the Obsidian Timelines plugin.

## 🏗️ Project Structure

```
obsidian-timelines-extended/
├── src/                          # Source code
│   ├── main.ts                   # Main plugin entry point
│   ├── block.ts                  # Timeline block processor
│   ├── commands.ts               # Plugin commands
│   ├── settings.ts               # Settings UI and management
│   ├── constants.ts              # Constants and default values
│   ├── types.ts                  # TypeScript type definitions
│   ├── timelines/                # Timeline rendering logic
│   │   ├── horizontal.ts         # Horizontal timeline implementation
│   │   ├── vertical.ts           # Vertical timeline implementation
│   │   └── index.ts              # Timeline utilities
│   └── utils/                    # Utility functions
│       ├── dates.ts              # Date parsing and validation
│       ├── events.ts             # Event processing
│       ├── debug.ts              # Debugging utilities
│       ├── timeline-tests.ts     # Testing framework
│       ├── timeline-health.ts    # Health checking system
│       └── index.ts              # Utility exports
├── styles/                       # SCSS stylesheets
│   ├── global.scss               # Global styles
│   ├── horizontal-timeline.scss  # Horizontal timeline styles
│   ├── vertical-timeline.scss    # Vertical timeline styles
│   └── colors.scss               # Color definitions
├── scripts/                      # Build scripts
│   └── build.sh                  # Main build script
├── dist/                         # Built plugin files
│   ├── main.js                   # Compiled plugin
│   └── styles.css                # Compiled styles
└── docs/                         # Documentation files
```

## 🚀 Building the Plugin

### Prerequisites
- Node.js (v20.17.0+ or v22.9.0+)
- npm

### Build Commands

```bash
# Install dependencies
npm install

# Build the plugin (development)
npm run build

# Build for production
npm run build:prod

# Watch mode for development
npm run dev

# Clean build artifacts
npm run clean
```

### Build Process
The build uses Rollup with TypeScript and SCSS compilation:
1. TypeScript files are compiled from `src/` to `dist/main.js`
2. SCSS files are compiled from `styles/` to `dist/styles.css`
3. The build script (`scripts/build.sh`) orchestrates the process

## 🧩 Core Architecture

### Plugin Entry Point (`src/main.ts`)
- **Purpose**: Main plugin class extending Obsidian's Plugin
- **Key Methods**:
  - `onload()`: Initialize plugin, register commands, setup debugger
  - `initialize()`: Load settings and setup processors
  - `onunload()`: Cleanup when plugin is disabled

### Block Processor (`src/block.ts`)
- **Purpose**: Processes `ob-timeline` code blocks
- **Key Class**: `TimelineBlockProcessor`
- **Flow**:
  1. Parse timeline arguments from code block
  2. Collect timeline events from vault
  3. Process and validate dates
  4. Route to appropriate timeline renderer

### Timeline Renderers (`src/timelines/`)

#### Horizontal Timeline (`horizontal.ts`)
- **Purpose**: Renders interactive horizontal timelines using vis-timeline
- **Key Function**: `buildHorizontalTimeline()`
- **Dependencies**: vis-timeline, vis-data, timeline-arrows
- **Features**:
  - Interactive timeline with zoom/pan
  - Groups and subgroups
  - Timeline arrows between events
  - Hover effects and tooltips

#### Vertical Timeline (`vertical.ts`)
- **Purpose**: Renders static vertical timelines
- **Key Function**: `buildVerticalTimeline()`
- **Features**:
  - Chronological card layout
  - Date headers and grouping
  - Custom date formatting
  - Responsive design

### Date System (`src/utils/dates.ts`)
- **Purpose**: Simplified character-based date parsing
- **Key Functions**:
  - `parseSimplifiedDate()`: Parse dates based on character positions
  - `buildTimelineDate()`: Create JavaScript Date objects
  - `validateTimelineType()`: Validate timeline item types
- **Features**:
  - Configurable character lengths
  - Automatic end date generation
  - Comprehensive validation
  - Support for partial dates

### Event Processing (`src/utils/events.ts`)
- **Purpose**: Extract and process timeline events from notes
- **Key Functions**:
  - `getEventsFromNotes()`: Extract events from note collection
  - `retrieveEventValue()`: Get event properties from frontmatter/inline
  - `processTimelineEvents()`: Process and validate event data

## 🎛️ Configuration System

### Settings (`src/settings.ts`)
- **Class**: `TimelinesSettingTab`
- **Key Settings**:
  - Date parsing configuration (character lengths)
  - Timeline appearance options
  - Default values and limits

### Constants (`src/constants.ts`)
- **Default Settings**: `DEFAULT_SETTINGS`
- **Date Parsing Config**: `DEFAULT_DATE_PARSING_CONFIG`
- **Developer Settings**: `DEVELOPER_SETTINGS`

### Types (`src/types.ts`)
- **Core Interfaces**:
  - `TimelinesSettings`: Plugin settings structure
  - `DateParsingConfig`: Date parsing configuration
  - `CleanedDateResultObject`: Parsed date structure
  - `EventItem`: Timeline event data
  - `CardContainer`: Event container structure

## 🧪 Testing & Debugging System

### Testing Framework (`src/utils/timeline-tests.ts`)
- **Class**: `TimelineTestRunner`
- **Test Suites**:
  - Date parsing tests
  - Date validation tests
  - Timeline type tests
  - Edge case tests
- **Usage**: Run via "Test Timeline System" command

### Health Monitoring (`src/utils/timeline-health.ts`)
- **Class**: `TimelineHealthChecker`
- **Checks**:
  - Timeline rendering status
  - Data validation
  - Infinite loop detection
  - Performance monitoring
- **Usage**: Run via "Check Timeline Health" command

### Debug Utilities (`src/utils/debug.ts`)
- **Functions**:
  - `logger()`: Conditional logging
  - `setupTimelineDebugger()`: Global debug functions
- **Console Functions**:
  - `window.debugTimeline()`: Inspect timeline data

## 🎨 Styling System

### SCSS Architecture
- **Global Styles** (`styles/global.scss`): Base styles and variables
- **Timeline Specific**:
  - `horizontal-timeline.scss`: Vis-timeline customizations
  - `vertical-timeline.scss`: Vertical timeline layout
- **Color System** (`styles/colors.scss`): Dynamic color generation

### CSS Classes
- `.timeline-vis`: Horizontal timeline container
- `.timeline`: Vertical timeline container
- `.timeline-card`: Individual event cards
- `.timeline-container`: Event grouping containers

## 🔧 Key Development Patterns

### Date Parsing Flow
```typescript
// 1. Parse date string with character-based system
const dateResult = parseSimplifiedDate(dateString, config, isEndDate, eventType)

// 2. Validate parsed components
if (!dateResult || dateResult.year === 0) return null

// 3. Build JavaScript Date object
const dateObj = buildTimelineDate(dateResult)

// 4. Additional validation
if (!dateObj || isNaN(dateObj.getTime())) return null
```

### Event Processing Flow
```typescript
// 1. Collect notes with timeline tags
const notes = getNotesWithTags(vault, tags)

// 2. Extract events from each note
const events = getEventsFromNotes(notes, settings)

// 3. Process and validate dates
const processedEvents = events.map(event => ({
  ...event,
  startDate: parseSimplifiedDate(event.startDate, config),
  endDate: parseSimplifiedDate(event.endDate, config, true)
}))

// 4. Render timeline
buildHorizontalTimeline({ events: processedEvents, ... })
```

### Error Handling Pattern
```typescript
try {
  // Attempt operation
  const result = riskyOperation()
  
  // Validate result
  if (!isValid(result)) {
    logger('Operation failed validation', { result })
    return fallbackValue
  }
  
  return result
} catch (error) {
  console.error('Operation failed:', error)
  return fallbackValue
}
```

## 🚨 Common Development Tasks

### Adding New Date Format Support
1. Update `DateParsingConfig` in `types.ts`
2. Modify `parseSimplifiedDate()` in `dates.ts`
3. Add tests in `timeline-tests.ts`
4. Update settings UI in `settings.ts`

### Adding New Timeline Type
1. Add type to `validateTimelineType()` in `dates.ts`
2. Update vis-timeline configuration in `horizontal.ts`
3. Add styling in appropriate SCSS file
4. Add tests for new type

### Adding New Event Property
1. Update `CardContainer` interface in `types.ts`
2. Modify `retrieveEventValue()` in `events.ts`
3. Update timeline renderers to use new property
4. Add to insert commands in `commands.ts`

### Debugging Timeline Issues
1. Enable debug mode in `constants.ts`
2. Use `window.debugTimeline()` to inspect data
3. Run "Test Timeline System" to validate functionality
4. Check "Timeline Health" for specific issues
5. Review console logs for detailed error information

## 📦 Dependencies

### Core Dependencies
- **obsidian**: Obsidian API
- **vis-timeline**: Horizontal timeline rendering
- **vis-data**: Data management for vis-timeline
- **timeline-arrows**: Arrow connections between events
- **luxon**: Advanced date handling

### Development Dependencies
- **typescript**: Type checking and compilation
- **rollup**: Module bundling
- **sass**: SCSS compilation
- **eslint**: Code linting

## 🔄 Release Process

### Version Management
1. Update version in `manifest.json`
2. Update `versions.json` with compatibility info
3. Update changelog with new features/fixes
4. Tag release in git

### Build for Release
```bash
# Clean and build
npm run clean
npm run build:prod

# Test the build
npm run test  # If tests exist

# Verify dist/ contains main.js, styles.css, manifest.json
```

## 🐛 Debugging Tips

### Common Issues
1. **Timeline not rendering**: Check console for errors, verify date formats
2. **Infinite loop warnings**: Use health checker to identify problematic data
3. **Date parsing failures**: Enable debug mode and check parsed date objects
4. **Performance issues**: Monitor timeline item count and complexity

### Debug Tools
- Browser DevTools Console
- `window.debugTimeline()` function
- Plugin command palette testing commands
- Debug mode logging (set `DEVELOPER_SETTINGS.debug = true`)

## 📝 Code Style Guidelines

### TypeScript
- Use strict typing
- Prefer interfaces over types for object shapes
- Use meaningful variable names
- Add JSDoc comments for public functions

### Error Handling
- Always validate inputs
- Provide fallback values
- Log errors with context
- Use try-catch for risky operations

### Performance
- Validate data early to prevent processing invalid items
- Use efficient DOM manipulation
- Minimize timeline item count for large datasets
- Cache expensive computations

## 🤝 Contributing

### Before Making Changes
1. Run existing tests: "Test Timeline System"
2. Check current health: "Check Timeline Health"
3. Review relevant documentation

### After Making Changes
1. Test your changes thoroughly
2. Run the full test suite
3. Update documentation if needed
4. Verify no regressions in existing functionality

This guide should provide everything needed to understand, modify, and extend the Obsidian Timelines plugin effectively.
