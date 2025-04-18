/**
 * Interface for pagination configuration options
 * @interface IPaginationQueryOptions
 * @property {number} page - The current page number (1-based index)
 * @property {number} limit - The number of items per page
 * @property {Record<string, 'ASC' | 'DESC'>} [sort] - Sorting configuration object
 * @example
 * {
 *   page: 1,
 *   limit: 10,
 *   sort: {
 *     createdAt: 'DESC',
 *     lastName: 'ASC'
 *   }
 * }
 */
export interface IPaginationQueryOptions {
  /**
   * The current page number (1-based index)
   * @type {number}
   * @minimum 1
   */
  page: number;

  /**
   * The number of items per page
   * @type {number}
   * @minimum 1
   * @maximum 100
   */
  limit: number;

  /**
   * Optional sorting configuration
   * @type {Record<string, 'ASC' | 'DESC'>}
   * @example
   * {
   *   createdAt: 'DESC',
   *   lastName: 'ASC'
   * }
   */
  sort?: Record<string, 'ASC' | 'DESC'>;
}
