/**
 * Environment utilities for the application
 */

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Database environment types - now matching app environments
export type DatabaseEnvironment = 'development' | 'staging' | 'production';

/**
 * Get the current environment the app is running in
 */
export const getEnvironment = (): Environment => {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  return env as Environment;
};

/**
 * Get the current database environment
 * Each app environment now has its own database environment
 */
export const getDatabaseEnvironment = (): DatabaseEnvironment => {
  const env = getEnvironment();
  return env as DatabaseEnvironment;
};

/**
 * Check if the app is running in development mode
 */
export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

/**
 * Check if the app is running in staging mode
 */
export const isStaging = (): boolean => {
  return getEnvironment() === 'staging';
};

/**
 * Check if the app is running in production mode
 */
export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

/**
 * Check if currently using the development database
 */
export const isDevelopmentDatabase = (): boolean => {
  return getDatabaseEnvironment() === 'development';
};

/**
 * Check if currently using the staging database
 */
export const isStagingDatabase = (): boolean => {
  return getDatabaseEnvironment() === 'staging';
};

/**
 * Check if currently using the production database
 */
export const isProductionDatabase = (): boolean => {
  return getDatabaseEnvironment() === 'production';
};

/**
 * Get a value based on the current environment
 * @param values Object with values for different environments
 * @returns The value for the current environment
 */
export const getEnvironmentValue = <T>(values: Partial<Record<Environment, T>>, defaultValue?: T): T => {
  const env = getEnvironment();
  return values[env] ?? defaultValue as T;
};

/**
 * Get a value based on the current database environment
 * @param values Object with values for different database environments
 * @returns The value for the current database environment
 */
export const getDatabaseValue = <T>(values: Partial<Record<DatabaseEnvironment, T>>, defaultValue?: T): T => {
  const dbEnv = getDatabaseEnvironment();
  return values[dbEnv] ?? defaultValue as T;
}; 