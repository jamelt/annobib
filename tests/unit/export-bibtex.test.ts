import { describe, it, expect } from 'vitest'
import { generateBibtex, parseBibtex } from '~/server/services/export/bibtex'
import type { Entry, EntryType } from '~/shared/types'

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'test-id',
    userId: 'user-1',
    entryType: 'book',
    title: 'Test Title',
    authors: [{ firstName: 'John', lastName: 'Doe' }],
    year: 2024,
    metadata: {},
    customFields: {},
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function extractCiteKey(bibtex: string): string {
  const match = bibtex.match(/@\w+\{([^,]+),/)
  return match?.[1] ?? ''
}

function extractField(bibtex: string, field: string): string | null {
  const regex = new RegExp(`${field}\\s*=\\s*\\{([^}]*)\\}`)
  const match = bibtex.match(regex)
  return match?.[1] ?? null
}

describe('BibTeX cite key generation', () => {
  it('generates key from author lastName + year + first title word', () => {
    const entry = makeEntry({ title: 'Software Engineering Principles' })
    const key = extractCiteKey(generateBibtex([entry]))
    expect(key).toBe('doe2024software')
  })

  it('uses "unknown" when no authors exist', () => {
    const entry = makeEntry({ authors: [], title: 'Orphan Book' })
    const key = extractCiteKey(generateBibtex([entry]))
    expect(key).toBe('unknown2024orphan')
  })

  it('uses "nd" when no year exists', () => {
    const entry = makeEntry({ year: undefined, title: 'Timeless Work' })
    const key = extractCiteKey(generateBibtex([entry]))
    expect(key).toBe('doendtimeless')
  })

  it('strips non-alpha characters from author name', () => {
    const entry = makeEntry({
      authors: [{ firstName: 'Jean-Paul', lastName: "O'Brien" }],
      title: 'Naming Conventions',
    })
    const key = extractCiteKey(generateBibtex([entry]))
    expect(key).toBe('obrien2024naming')
  })

  it('skips common stop words in title', () => {
    const entry = makeEntry({ title: 'The Art of Programming' })
    const key = extractCiteKey(generateBibtex([entry]))
    expect(key).toBe('doe2024art')
  })

  it('uses "untitled" when title is all stop words or empty after filtering', () => {
    const entry = makeEntry({ title: 'The A An' })
    const key = extractCiteKey(generateBibtex([entry]))
    expect(key).toBe('doe2024untitled')
  })

  it('uses first author for multi-author entries', () => {
    const entry = makeEntry({
      authors: [
        { firstName: 'Alice', lastName: 'Smith' },
        { firstName: 'Bob', lastName: 'Jones' },
      ],
      title: 'Collaboration',
    })
    const key = extractCiteKey(generateBibtex([entry]))
    expect(key).toBe('smith2024collaboration')
  })
})

describe('BibTeX special character escaping', () => {
  it('escapes ampersands', () => {
    const entry = makeEntry({ title: 'Research & Development' })
    const titleField = extractField(generateBibtex([entry]), 'title')
    expect(titleField).toContain('\\&')
  })

  it('escapes percent signs', () => {
    const entry = makeEntry({ title: 'A 100% Success Rate' })
    const titleField = extractField(generateBibtex([entry]), 'title')
    expect(titleField).toContain('\\%')
  })

  it('escapes hash signs', () => {
    const entry = makeEntry({ title: 'Issue #42' })
    const titleField = extractField(generateBibtex([entry]), 'title')
    expect(titleField).toContain('\\#')
  })

  it('escapes underscores', () => {
    const entry = makeEntry({ title: 'snake_case_title' })
    const titleField = extractField(generateBibtex([entry]), 'title')
    expect(titleField).toContain('\\_')
  })

  it('escapes dollar signs', () => {
    const entry = makeEntry({ title: 'Cost: $100' })
    const titleField = extractField(generateBibtex([entry]), 'title')
    expect(titleField).toContain('\\$')
  })

  it('escapes curly braces', () => {
    const entry = makeEntry({ title: 'Using {LaTeX}' })
    const result = generateBibtex([entry])
    expect(result).toContain('Using \\{LaTeX\\}')
  })

  it('escapes backslashes', () => {
    const entry = makeEntry({ title: 'Path: C:\\Users' })
    const result = generateBibtex([entry])
    expect(result).toContain('\\textbackslash')
  })

  it('escapes tilde characters', () => {
    const entry = makeEntry({ title: 'Approx~100' })
    const result = generateBibtex([entry])
    expect(result).toContain('\\textasciitilde{}')
  })

  it('escapes caret characters', () => {
    const entry = makeEntry({ title: 'X^2 Analysis' })
    const result = generateBibtex([entry])
    expect(result).toContain('\\textasciicircum{}')
  })
})

describe('BibTeX author formatting', () => {
  it('formats single author as "Last, First"', () => {
    const entry = makeEntry({
      authors: [{ firstName: 'Jane', lastName: 'Smith' }],
    })
    const authorField = extractField(generateBibtex([entry]), 'author')
    expect(authorField).toBe('Smith, Jane')
  })

  it('formats multiple authors separated by " and "', () => {
    const entry = makeEntry({
      authors: [
        { firstName: 'Alice', lastName: 'Smith' },
        { firstName: 'Bob', lastName: 'Jones' },
      ],
    })
    const authorField = extractField(generateBibtex([entry]), 'author')
    expect(authorField).toBe('Smith, Alice and Jones, Bob')
  })

  it('includes middle names', () => {
    const entry = makeEntry({
      authors: [{ firstName: 'John', lastName: 'Doe', middleName: 'Michael' }],
    })
    const authorField = extractField(generateBibtex([entry]), 'author')
    expect(authorField).toBe('Doe, John Michael')
  })

  it('omits author field when authors array is empty', () => {
    const entry = makeEntry({ authors: [] })
    const result = generateBibtex([entry])
    expect(result).not.toContain('author = ')
  })
})

describe('BibTeX entry type mapping', () => {
  const typeMap: [EntryType, string][] = [
    ['book', '@book'],
    ['journal_article', '@article'],
    ['conference_paper', '@inproceedings'],
    ['thesis', '@phdthesis'],
    ['report', '@techreport'],
    ['website', '@misc'],
    ['software', '@software'],
    ['custom', '@misc'],
    ['video', '@misc'],
    ['podcast', '@misc'],
    ['interview', '@misc'],
    ['newspaper_article', '@article'],
    ['magazine_article', '@article'],
  ]

  it.each(typeMap)('maps %s to %s', (entryType, expected) => {
    const entry = makeEntry({ entryType })
    const result = generateBibtex([entry])
    expect(result).toMatch(new RegExp(`^${expected.replace('@', '@')}\\{`))
  })
})

describe('BibTeX parsing of external formats', () => {
  it('parses a standard BibTeX article entry', () => {
    const bibtex = `@article{smith2020testing,
  author = {Smith, John and Jones, Alice},
  title = {Modern Testing Approaches},
  journal = {Software Engineering Review},
  year = {2020},
  volume = {15},
  number = {3},
  pages = {45--67},
  doi = {10.1000/test.2020}
}`
    const parsed = parseBibtex(bibtex)

    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.title).toBe('Modern Testing Approaches')
    expect(parsed[0]?.year).toBe(2020)
    expect(parsed[0]?.entryType).toBe('journal_article')
    expect(parsed[0]?.authors).toHaveLength(2)
    expect(parsed[0]?.authors?.[0]?.lastName).toBe('Smith')
    expect(parsed[0]?.authors?.[0]?.firstName).toBe('John')
    expect(parsed[0]?.authors?.[1]?.lastName).toBe('Jones')
    expect(parsed[0]?.authors?.[1]?.firstName).toBe('Alice')
    expect(parsed[0]?.metadata?.journal).toBe('Software Engineering Review')
    expect(parsed[0]?.metadata?.volume).toBe('15')
    expect(parsed[0]?.metadata?.issue).toBe('3')
    expect(parsed[0]?.metadata?.pages).toBe('45-67')
    expect(parsed[0]?.metadata?.doi).toBe('10.1000/test.2020')
  })

  it('parses a BibTeX book entry', () => {
    const bibtex = `@book{knuth1997art,
  author = {Knuth, Donald E.},
  title = {The Art of Computer Programming},
  publisher = {Addison-Wesley},
  year = {1997},
  isbn = {978-0-201-89684-8}
}`
    const parsed = parseBibtex(bibtex)

    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.entryType).toBe('book')
    expect(parsed[0]?.title).toBe('The Art of Computer Programming')
    expect(parsed[0]?.metadata?.publisher).toBe('Addison-Wesley')
    expect(parsed[0]?.metadata?.isbn).toBe('978-0-201-89684-8')
  })

  it('parses multiple entries', () => {
    const bibtex = `@book{first,
  title = {First Book},
  year = {2020}
}

@article{second,
  title = {Second Article},
  year = {2021}
}`
    const parsed = parseBibtex(bibtex)
    expect(parsed).toHaveLength(2)
    expect(parsed[0]?.title).toBe('First Book')
    expect(parsed[1]?.title).toBe('Second Article')
  })

  it('skips entries without a title', () => {
    const bibtex = `@misc{notitle,
  author = {Nobody},
  year = {2024}
}`
    const parsed = parseBibtex(bibtex)
    expect(parsed).toHaveLength(0)
  })

  it('maps inproceedings to conference_paper', () => {
    const bibtex = `@inproceedings{conf2024,
  title = {Conference Paper},
  booktitle = {Proceedings of Something},
  year = {2024}
}`
    const parsed = parseBibtex(bibtex)
    expect(parsed[0]?.entryType).toBe('conference_paper')
    expect(parsed[0]?.metadata?.container).toBe('Proceedings of Something')
  })

  it('maps phdthesis to thesis', () => {
    const bibtex = `@phdthesis{thesis2023,
  title = {My Thesis},
  school = {University},
  year = {2023}
}`
    const parsed = parseBibtex(bibtex)
    expect(parsed[0]?.entryType).toBe('thesis')
    expect(parsed[0]?.metadata?.publisher).toBe('University')
  })
})
