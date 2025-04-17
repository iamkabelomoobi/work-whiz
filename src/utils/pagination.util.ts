import { IPaginationQueryOptions } from '@work-whiz/interfaces';

/**
 * Pagination configuration with defaults and validation
 * @class Pagination
 * @implements {IPaginationQueryOptions}
 */
export class Pagination implements IPaginationQueryOptions {
  public page: number;
  public limit: number;
  public sort?: Record<string, 'ASC' | 'DESC'>;

  constructor(options: Partial<IPaginationQueryOptions> = {}) {
    this.page = options.page || 1;
    this.limit = Math.min(options.limit || 10, 100);
    this.sort = options.sort;

    if (this.page < 1) throw new Error('Page must be at least 1');
    if (this.limit < 1) throw new Error('Limit must be at least 1');
  }

  /**
   * Calculates the offset for Sequelize queries
   * @returns {number}
   */
  public getOffset(): number {
    return (this.page - 1) * this.limit;
  }

  /**
   * Get the order clause for Sequelize
   * @returns {[string, 'ASC' | 'DESC'][] | undefined}
   */
  public getOrder(): [string, 'ASC' | 'DESC'][] | undefined {
    return this.sort ? Object.entries(this.sort) : undefined;
  }

  /**
   * Calculate total pages
   * @param {number} totalCount - Total items count
   * @returns {number}
   */
  public getTotalPages(totalCount: number): number {
    return Math.ceil(totalCount / this.limit);
  }
}
