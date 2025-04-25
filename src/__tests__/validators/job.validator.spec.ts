/* eslint-disable @typescript-eslint/no-explicit-any */
import { IJob } from '@work-whiz/interfaces';
import { validateJob } from '@work-whiz/validators';

describe('validateJob', () => {
  const validJob: Partial<IJob> = {
    title: 'Software Engineer',
    description: 'Develop and maintain software.',
    responsibility: 'Write clean code',
    requirements: ['3+ years experience', 'Proficiency in TypeScript'],
    benefits: ['Health insurance', 'Remote work'],
    location: 'Lagos',
    type: 'Full-time',
    vacancy: 2,
    deadline: new Date(Date.now() + 86400000),
    tags: ['Engineering', 'JavaScript'],
    isPublic: true,
  };

  it('should return undefined for valid create input', () => {
    const result = validateJob(validJob);
    expect(result).toBeUndefined();
  });

  it('should return error for missing required fields (create)', () => {
    const invalidJob = { ...validJob };
    delete invalidJob.title;
    delete invalidJob.description;

    const error = validateJob(invalidJob);
    expect(error).toBeDefined();
    expect(error?.details.some(d => d.path.includes('title'))).toBe(true);
    expect(error?.details.some(d => d.path.includes('description'))).toBe(true);
  });

  it('should return undefined for valid update input (partial)', () => {
    const updateJob: Partial<IJob> = {
      title: 'Updated Title',
      description: 'Updated description',
      responsibility: 'Updated responsibility',
      requirements: ['Updated requirement'],
      location: 'Updated location',
      type: 'Full-time',
    };
    const result = validateJob(updateJob, true);
    expect(result).toBeUndefined();
  });

  it('should return error for invalid update input (html tag)', () => {
    const updateJob: Partial<IJob> = {
      title: '<b>Bad title</b>',
    };
    const error = validateJob(updateJob, true);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toMatch(/HTML tags are not allowed/);
  });
  it('should return error if update has no fields', () => {
    const error = validateJob({}, true);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toMatch(/at least 1 key/);
  });

  it('should return error for invalid type field', () => {
    const jobWithInvalidType = { ...validJob, type: 'Gig' } as any;
    const error = validateJob(jobWithInvalidType);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      'must be one of Full-time, Part-time, Contract, or Internship',
    );
  });

  it('should return error if deadline is in the past', () => {
    const jobWithPastDeadline = {
      ...validJob,
      deadline: new Date(Date.now() - 86400000),
    };
    const error = validateJob(jobWithPastDeadline);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe('must be in the future');
  });

  it('should return error if tags are more than 10', () => {
    const jobWithTooManyTags = {
      ...validJob,
      tags: Array(11).fill('tag'),
    };
    const error = validateJob(jobWithTooManyTags);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe('cannot have more than 10 tags');
  });
});
