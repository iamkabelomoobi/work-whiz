import { validateJob } from '@work-whiz/validators';

describe('Job Schema Validation', () => {
  const validJobData = {
    title: 'Software Engineer',
    description: 'Develop and maintain software applications.',
    responsibilities: ['Write clean code', 'Collaborate with team members'],
    requirements: ['3+ years of experience', 'Proficiency in TypeScript'],
    benefits: ['Health insurance', 'Remote work options'],
    location: 'Remote',
    type: 'Full-time' as 'Full-time' | 'Part-time' | 'Contract' | 'Internship',
    vacancy: 2,
    deadline: new Date('2025-12-31T00:00:00.000Z'),
    tags: ['Engineering', 'Software', 'TypeScript'],
    isPublic: true,
  };

  describe('jobCreateSchema', () => {
    it('should validate a valid job payload', () => {
      const error = validateJob(validJobData, false);
      expect(error).toBeUndefined();
    });

    it('should fail if required fields are missing', () => {
      const invalidData = { ...validJobData };
      delete invalidData.title;
      delete invalidData.description;

      const error = validateJob(invalidData, false);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Title is a required field.');
    });

    it('should fail if responsibilities is not an array', () => {
      const invalidData = {
        ...validJobData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responsibilities: 'Not an array' as any,
      };

      const error = validateJob(invalidData, false);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Responsibilities must be an array of strings.',
      );
    });

    it('should fail if tags exceed the maximum limit', () => {
      const invalidData = { ...validJobData, tags: Array(11).fill('Tag') };

      const error = validateJob(invalidData, false);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Tags cannot have more than 10 items.',
      );
    });

    it('should fail if deadline is in the past', () => {
      const invalidData = {
        ...validJobData,
        deadline: new Date('2020-01-01T00:00:00.000Z'),
      };

      const error = validateJob(invalidData, false);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Deadline must be in the future.');
    });

    it('should fail if type is invalid', () => {
      const invalidData = { ...validJobData, type: 'Invalid Type' as any };

      const error = validateJob(invalidData, false);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Type must be one of Full-time, Part-time, Contract, or Internship.',
      );
    });
  });

  describe('jobUpdateValidator', () => {
    it('should validate a partial update payload', () => {
      const updateData = { title: 'Updated Title' };

      const error = validateJob(updateData, true);
      expect(error).toBeUndefined();
    });

    it('should fail if no fields are provided', () => {
      const updateData = {};

      const error = validateJob(updateData, true);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        '"value" must have at least 1 key',
      );
    });

    it('should validate if optional fields are provided', () => {
      const updateData = { isPublic: false, vacancy: 5 };

      const error = validateJob(updateData, true);
      expect(error).toBeUndefined();
    });

    it('should fail if invalid data is provided in update', () => {
      const updateData = { tags: Array(15).fill('Invalid') };

      const error = validateJob(updateData, true);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Tags cannot have more than 10 items.',
      );
    });
  });
});
