import type { TimelinesSettings } from './types'

import { TimelineBlockProcessor } from './block'
import { DEFAULT_SETTINGS } from './constants'
import { Plugin, MarkdownView } from 'obsidian'
import { TimelinesSettingTab } from './settings'
import { TimelineCommandProcessor } from './commands'
import { logger, setupTimelineDebugger } from './utils'
import { runTimelineTests } from './utils/timeline-tests'
import { checkTimelineHealth } from './utils/timeline-health'

export default class TimelinesPlugin extends Plugin {
  pluginName: string = this.manifest.name
  settings: TimelinesSettings
  statusBarItem: HTMLElement
  blocks: TimelineBlockProcessor
  commands: TimelineCommandProcessor

  initialize = async () => {
    console.log( `Initializing Plugin: ${this.pluginName}` )

    const loaded = await this.loadData()
    this.settings = { ...DEFAULT_SETTINGS, ...loaded }
    
    // Migrate from old regex-based system to new simplified system
    if ( 'dateParsingRegex' in this.settings && !this.settings.dateParsingConfig ) {
      console.log( 'Migrating timeline settings from regex-based to simplified date parsing' )
      
      // Set default config for migration
      this.settings.dateParsingConfig = {
        yearLength: 4,
        monthLength: 2,
        dayLength: 2,
        hourLength: 2,
        minuteLength: 2,
      }
      
      // Remove old properties
      delete (this.settings as any).dateParsingRegex
      delete (this.settings as any).dateParsingFormat
      
      // Save migrated settings
      await this.saveData( this.settings )
    }
    
    this.blocks = new TimelineBlockProcessor( this.settings, this.app.metadataCache, this.app.vault )
    this.commands = new TimelineCommandProcessor( this, this.blocks.run.bind( this.blocks ))
  }

  onload = async () => {
    await this.initialize()
    console.log( `Loaded Plugin: ${this.pluginName}` )

    // Setup debugging helper
    setupTimelineDebugger()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.registerMarkdownCodeBlockProcessor( 'ob-timeline', async ( source, el, ctx ) => {
      await this.blocks.run( source, el )
    })

    this.addCommand({
      id: 'render-static-timeline',
      name: 'Render static timeline',
      checkCallback: ( checking: boolean ) => {
        const markdownView = this.app.workspace.getActiveViewOfType( MarkdownView )
        if ( markdownView ) {
          // If checking is true, we're simply "checking" if the command can be run.
          // If checking is false, then we want to actually perform the operation.
          if ( !checking ) {
            this.commands.insertTimelineIntoCurrentNote( markdownView )
          }

          return true
        }
      }
    })

    this.addCommand({
      id: 'insert-timeline-event',
      name: 'Insert timeline event',
      checkCallback: ( checking: boolean ) => {
        const markdownView = this.app.workspace.getActiveViewOfType( MarkdownView )
        if ( markdownView ) {
          if ( !checking ) {
            this.commands.createTimelineEventInCurrentNote()
          }

          return true
        }
      }
    })

    this.addCommand({
      id: 'insert-timeline-event-frontmatter',
      name: 'Insert timeline event (frontmatter)',
      checkCallback: ( checking: boolean ) => {
        const markdownView = this.app.workspace.getActiveViewOfType( MarkdownView )
        if ( markdownView ) {
          if ( !checking ) {
            this.commands.createTimelineEventFrontMatterInCurrentNote()
          }

          return true
        }
      }
    })

    this.addCommand({
      id: 'reload-open-note',
      name: 'Reload current note',
      checkCallback: ( checking: boolean ) => {
        const markdownView = this.app.workspace.getActiveViewOfType( MarkdownView )
        if ( markdownView ) {
          if ( !checking ) {
            this.commands.reloadNote( markdownView )
          }

          return true
        }
      },
    })

    // Timeline testing and debugging commands
    this.addCommand({
      id: 'test-timeline-system',
      name: 'Test Timeline System',
      callback: async () => {
        await runTimelineTests(this.settings.dateParsingConfig)
      }
    })

    this.addCommand({
      id: 'check-timeline-health',
      name: 'Check Timeline Health',
      callback: () => {
        checkTimelineHealth()
      }
    })

    this.addCommand({
      id: 'debug-timeline-data',
      name: 'Debug Timeline Data',
      callback: () => {
        if (typeof window !== 'undefined') {
          ;(window as any).debugTimeline()
        }
      }
    })

    this.addSettingTab( new TimelinesSettingTab( this.app, this ))

    this.addRibbonIcon( 'code-2', 'Insert Timeline Event', async () => {
      await this.commands.createTimelineEventInCurrentNote()
    })

    this.addRibbonIcon( 'list-plus', 'Insert Timeline Event (Frontmatter)', async () => {
      await this.commands.createTimelineEventFrontMatterInCurrentNote()
    })

    if ( this.settings.showEventCounter ) {
      this.commands.createStatusBar( this )
    }
  }

  onFileOpen = async () => {
    if ( !this.commands ) {
      logger( 'main | Command processor was not initialized' )

      await this.initialize()
    }

    this.commands.handleStatusBarUpdates( this )
  }

  onunload = () => {
    console.log( `Unloaded Plugin: ${this.pluginName}` )
  }

  saveSettings = async () => {
    this.commands.handleStatusBarUpdates( this )

    await this.saveData( this.settings )
  }
}
