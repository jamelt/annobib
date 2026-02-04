import { describe, it, expect } from 'vitest'
import {
  createEntrySchema,
  createProjectSchema,
  createTagSchema,
  authorSchema,
} from '~/shared/validation'

describe('Validation Schemas', () => {
  describe('authorSchema', () => {
    it('should validate a valid author', () => {
      const result = authorSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
      })

      expect(result.success).toBe(true)
    })

    it('should validate an author with optional fields', () => {
      const result = authorSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'A',
        suffix: 'Jr.',
        orcid: '0000-0001-2345-6789',
      })

      expect(result.success).toBe(true)
    })

    it('should reject an author without firstName', () => {
      const result = authorSchema.safeParse({
        lastName: 'Doe',
      })

      expect(result.success).toBe(false)
    })

    it('should reject an author without lastName', () => {
      const result = authorSchema.safeParse({
        firstName: 'John',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('createEntrySchema', () => {
    it('should validate a minimal entry', () => {
      const result = createEntrySchema.safeParse({
        entryType: 'book',
        title: 'Test Book',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.entryType).toBe('book')
        expect(result.data.title).toBe('Test Book')
        expect(result.data.authors).toEqual([])
        expect(result.data.isFavorite).toBe(false)
      }
    })

    it('should validate a complete entry', () => {
      const result = createEntrySchema.safeParse({
        entryType: 'journal_article',
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        year: 2024,
        metadata: {
          doi: '10.1234/test',
          journal: 'Test Journal',
          volume: '1',
          issue: '2',
          pages: '1-10',
        },
        isFavorite: true,
        projectIds: ['123e4567-e89b-12d3-a456-426614174000'],
      })

      expect(result.success).toBe(true)
    })

    it('should reject an entry without title', () => {
      const result = createEntrySchema.safeParse({
        entryType: 'book',
      })

      expect(result.success).toBe(false)
    })

    it('should reject an entry with invalid entry type', () => {
      const result = createEntrySchema.safeParse({
        entryType: 'invalid_type',
        title: 'Test',
      })

      expect(result.success).toBe(false)
    })

    it('should reject an entry with invalid year', () => {
      const result = createEntrySchema.safeParse({
        entryType: 'book',
        title: 'Test',
        year: 10000,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('createProjectSchema', () => {
    it('should validate a minimal project', () => {
      const result = createProjectSchema.safeParse({
        name: 'Test Project',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test Project')
        expect(result.data.color).toBe('#4F46E5')
      }
    })

    it('should validate a project with all fields', () => {
      const result = createProjectSchema.safeParse({
        name: 'Test Project',
        description: 'A test project',
        color: '#FF5733',
        settings: {
          defaultCitationStyle: 'apa',
          sortOrder: 'title',
        },
      })

      expect(result.success).toBe(true)
    })

    it('should reject a project without name', () => {
      const result = createProjectSchema.safeParse({
        description: 'No name',
      })

      expect(result.success).toBe(false)
    })

    it('should reject a project with invalid color', () => {
      const result = createProjectSchema.safeParse({
        name: 'Test',
        color: 'invalid',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('createTagSchema', () => {
    it('should validate a minimal tag', () => {
      const result = createTagSchema.safeParse({
        name: 'Test Tag',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test Tag')
        expect(result.data.color).toBe('#6B7280')
      }
    })

    it('should validate a tag with custom color', () => {
      const result = createTagSchema.safeParse({
        name: 'Important',
        color: '#EF4444',
        description: 'Important sources',
      })

      expect(result.success).toBe(true)
    })

    it('should reject a tag without name', () => {
      const result = createTagSchema.safeParse({
        color: '#EF4444',
      })

      expect(result.success).toBe(false)
    })
  })
})
