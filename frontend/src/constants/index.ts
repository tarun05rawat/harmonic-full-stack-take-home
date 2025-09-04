/**
 * Application-wide constants
 */

/**
 * API Configuration Constants
 */
export const API_CONSTANTS = {
  /** Default page size for pagination */
  DEFAULT_PAGE_SIZE: 25,
  /** Maximum page size allowed */
  MAX_PAGE_SIZE: 100,
  /** Timeout for API requests in milliseconds */
  REQUEST_TIMEOUT: 10000,
} as const;

/**
 * Collection IDs for system collections
 */
export const SYSTEM_COLLECTIONS = {
  /** UUID for the favorites collection */
  FAVORITES: "8234603c-c6e6-40cb-882c-c3d1e9c4ade8",
  /** UUID for the all companies collection */
  ALL_COMPANIES: "all",
} as const;

/**
 * Job polling configuration
 */
export const JOB_POLLING = {
  /** Interval between status checks in milliseconds */
  POLL_INTERVAL: 500,
  /** Maximum polling duration before timeout */
  MAX_POLL_TIME: 30000,
} as const;

/**
 * UI Constants
 */
export const UI_CONSTANTS = {
  /** Debounce delay for search input */
  SEARCH_DEBOUNCE: 300,
  /** Animation duration for state transitions */
  ANIMATION_DURATION: 200,
} as const;

/**
 * Collection types for business logic
 */
export const COLLECTION_TYPES = {
  SYSTEM: "system",
  USER: "user",
} as const;

/**
 * Transfer job statuses
 */
export const JOB_STATUS = {
  QUEUED: "queued",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type JobStatusType = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];
