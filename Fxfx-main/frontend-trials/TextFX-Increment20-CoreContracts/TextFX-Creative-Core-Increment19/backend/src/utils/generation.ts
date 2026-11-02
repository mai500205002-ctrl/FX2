export type GenerationLanguage = 'en' | 'ar'

export function resolveLanguage(text: string, requested?: string): GenerationLanguage {
  const letters = text.match(/[A-Za-z\u0600-\u06FF]/g) || []
  const arabicLetters = text.match(/[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FC]/g) || []
  if (arabicLetters.length >= 3 && arabicLetters.length / Math.max(letters.length, 1) >= 0.2) {
    return 'ar'
  }
  return requested === 'ar' ? 'ar' : 'en'
}

export function assertLanguageMatch(value: unknown, language: GenerationLanguage, label: string): void {
  const strings: string[] = []
  const visit = (item: unknown) => {
    if (typeof item === 'string') strings.push(item)
    else if (Array.isArray(item)) item.forEach(visit)
    else if (item && typeof item === 'object') Object.values(item).forEach(visit)
  }
  visit(value)
  const text = strings.join(' ')
  const letters = text.match(/[A-Za-z\u0621-\u064A\u066E-\u06D3\u06FA-\u06FC]/g) || []
  const arabicLetters = text.match(/[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FC]/g) || []
  const ratio = arabicLetters.length / Math.max(letters.length, 1)
  if (language === 'ar' && (arabicLetters.length < 3 || ratio < 0.12)) {
    throw new Error(`${label}: Gemini output does not match the requested Arabic language.`)
  }
  if (language === 'en' && ratio >= 0.2) {
    throw new Error(`${label}: Gemini output does not match the requested English language.`)
  }
}

export function parseJsonObject<T extends object>(text: string, label: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  let parsed: unknown

  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    if (start < 0) throw new Error(`${label}: Gemini response did not contain a JSON object.`)

    let depth = 0
    let quoted = false
    let escaped = false
    let end = -1
    for (let index = start; index < cleaned.length; index++) {
      const character = cleaned[index]
      if (quoted) {
        if (escaped) escaped = false
        else if (character === '\\') escaped = true
        else if (character === '"') quoted = false
        continue
      }
      if (character === '"') quoted = true
      else if (character === '{') depth++
      else if (character === '}' && --depth === 0) {
        end = index + 1
        break
      }
    }
    if (end < 0) throw new Error(`${label}: Gemini returned incomplete JSON.`)
    try {
      parsed = JSON.parse(cleaned.slice(start, end))
    } catch {
      throw new Error(`${label}: Gemini returned invalid JSON.`)
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label}: Gemini response must be a JSON object.`)
  }
  return parsed as T
}