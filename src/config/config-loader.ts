/**
 * Configuration Loader
 * Loads and manages configuration from file or defaults
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration structure for ESPN Corner Data Collector
 */
export interface CollectorConfig {
  /** API client configuration */
  api?: {
    /** Base URL for ESPN API (default: https://site.api.espn.com/apis/site/v2/sports/soccer) */
    baseUrl?: string;
    /** Delay between requests in milliseconds (default: 100) */
    requestDelay?: number;
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Maximum concurrent requests (default: 5) */
    maxConcurrentRequests?: number;
    /** Enable request logging (default: true) */
    enableLogging?: boolean;
    /** Request timeout in milliseconds (default: 30000) */
    requestTimeout?: number;
  };

  /** League codes configuration */
  leagues?: {
    /** Custom league codes to add to defaults */
    customCodes?: string[];
    /** Whether to use default league codes (default: true) */
    useDefaults?: boolean;
  };
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: CollectorConfig = {
  api: {
    baseUrl: 'https://site.api.espn.com/apis/site/v2/sports/soccer',
    requestDelay: 100,
    maxRetries: 3,
    maxConcurrentRequests: 5,
    enableLogging: true,
    requestTimeout: 30000,
  },
  leagues: {
    customCodes: [],
    useDefaults: true,
  },
};

/**
 * Configuration loader class
 */
export class ConfigLoader {
  private config: CollectorConfig;

  constructor(configPath?: string) {
    this.config = this.loadConfig(configPath);
  }

  /**
   * Load configuration from file or use defaults
   * @param configPath - Optional path to configuration file
   * @returns Loaded configuration
   */
  private loadConfig(configPath?: string): CollectorConfig {
    // Start with default config
    let config: CollectorConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

    // Try to load from file if path provided
    if (configPath) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const fileConfig = JSON.parse(fileContent);
        config = this.mergeConfig(config, fileConfig);
      } catch (error) {
        if (error instanceof Error) {
          console.warn(`Warning: Could not load config from ${configPath}: ${error.message}`);
        }
        console.warn('Using default configuration');
      }
    } else {
      // Try to load from default locations
      const defaultPaths = [
        path.join(process.cwd(), 'espn-collector.config.json'),
        path.join(process.cwd(), '.espn-collector.json'),
        path.join(process.env.HOME || '~', '.espn-collector.json'),
      ];

      for (const defaultPath of defaultPaths) {
        if (fs.existsSync(defaultPath)) {
          try {
            const fileContent = fs.readFileSync(defaultPath, 'utf-8');
            const fileConfig = JSON.parse(fileContent);
            config = this.mergeConfig(config, fileConfig);
            console.log(`Loaded configuration from: ${defaultPath}`);
            break;
          } catch (error) {
            // Continue to next path
            continue;
          }
        }
      }
    }

    return config;
  }

  /**
   * Deep-merge user config with default config so partial league/api settings are preserved.
   */
  private mergeConfig(
    defaultConfig: CollectorConfig,
    userConfig: Partial<CollectorConfig>
  ): CollectorConfig {
    return {
      api: {
        ...defaultConfig.api,
        ...userConfig.api,
      },
      leagues: {
        ...defaultConfig.leagues,
        ...userConfig.leagues,
      },
    };
  }

  /**
   * Get the loaded configuration
   * @returns Current configuration
   */
  getConfig(): CollectorConfig {
    return this.config;
  }

  /**
   * Get API configuration
   * @returns API configuration
   */
  getAPIConfig() {
    return this.config.api || DEFAULT_CONFIG.api!;
  }

  /**
   * Get league codes configuration
   * @returns League codes configuration
   */
  getLeagueConfig() {
    return this.config.leagues || DEFAULT_CONFIG.leagues!;
  }

  /**
   * Create a sample configuration file
   * @param outputPath - Path to write the sample config
   */
  static createSampleConfig(outputPath: string): void {
    const sampleConfig: CollectorConfig = {
      api: {
        baseUrl: 'https://site.api.espn.com/apis/site/v2/sports/soccer',
        requestDelay: 100,
        maxRetries: 3,
        maxConcurrentRequests: 5,
        enableLogging: true,
        requestTimeout: 30000,
      },
      leagues: {
        customCodes: [
          // Add custom league codes here
          // Examples:
          // "ned.1",  // Eredivisie
          // "por.1",  // Primeira Liga
        ],
        useDefaults: true,
      },
    };

    const content = JSON.stringify(sampleConfig, null, 2);
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`Sample configuration created at: ${outputPath}`);
  }
}
