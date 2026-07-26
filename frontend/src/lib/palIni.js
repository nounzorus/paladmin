// Parser/serializer for Palworld's PalWorldSettings.ini OptionSettings line. Pure text
// transforms, no network/filesystem access: the panel has no way to write this file
// directly (the REST API doesn't support config writes), so this only ever produces text
// for the admin to copy onto their server themselves.

const SECTION_HEADER = '[/Script/Pal.PalGameWorldSettings]'

// Split a comma-separated list at depth 0, respecting quoted strings and nested parens
// (needed for array-type values like CrossplayPlatforms=(Steam,Xbox,PS5,Mac)).
function splitTopLevel(str) {
  const parts = []
  let depth = 0
  let inQuotes = false
  let current = ''
  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if (c === '"' && str[i - 1] !== '\\') inQuotes = !inQuotes
    if (!inQuotes) {
      if (c === '(') depth++
      else if (c === ')') depth--
    }
    if (c === ',' && depth === 0 && !inQuotes) {
      parts.push(current)
      current = ''
    } else {
      current += c
    }
  }
  if (current.length) parts.push(current)
  return parts
}

function unquote(raw) {
  if (raw.startsWith('"') && raw.endsWith('"')) {
    return raw.slice(1, -1).replace(/\\"/g, '"')
  }
  return raw
}

function unwrapArray(raw) {
  if (raw.startsWith('(') && raw.endsWith(')')) {
    const inner = raw.slice(1, -1)
    if (!inner.trim()) return []
    return splitTopLevel(inner).map((s) => s.trim())
  }
  return raw ? [raw] : []
}

// Parse a pasted PalWorldSettings.ini (or just the OptionSettings=(...) line) into a flat
// { key: rawValueString } map. Values are kept as their raw ini-text form (quotes, parens
// and all) so keys we don't recognize can be re-emitted byte-for-byte unchanged later.
export function parseOptionSettings(rawText) {
  const match = rawText.match(/OptionSettings\s*=\s*\(([\s\S]*)\)\s*$/m)
  const body = match ? match[1] : rawText.trim().replace(/^\(/, '').replace(/\)$/, '')
  const values = {}
  for (const pair of splitTopLevel(body)) {
    const eq = pair.indexOf('=')
    if (eq === -1) continue
    const key = pair.slice(0, eq).trim()
    const raw = pair.slice(eq + 1).trim()
    if (key) values[key] = raw
  }
  return values
}

// Raw ini-text value -> form-friendly JS value, for a known catalog setting.
function rawToFormValue(setting, raw) {
  if (raw === undefined) return setting.type === 'boolean' ? setting.default === 'True' : setting.default
  switch (setting.type) {
    case 'boolean': return raw === 'True'
    case 'string': return unquote(raw)
    case 'array': return unwrapArray(raw).join(',')
    default: return raw // integer/float/select: keep the literal text
  }
}

// Form value -> ini-text, for a known catalog setting.
function formValueToRaw(setting, value) {
  switch (setting.type) {
    case 'boolean':
      return value ? 'True' : 'False'
    case 'string':
      return `"${String(value ?? '').replace(/"/g, '\\"')}"`
    case 'array': {
      const items = String(value ?? '').split(',').map((s) => s.trim()).filter(Boolean)
      return `(${items.join(',')})`
    }
    case 'float': {
      const n = parseFloat(value)
      return Number.isFinite(n) ? n.toFixed(6) : setting.default
    }
    case 'integer': {
      const n = parseInt(value, 10)
      return Number.isFinite(n) ? String(n) : setting.default
    }
    default:
      return value === undefined || value === '' ? setting.default : String(value)
  }
}

// Split a freshly-parsed { key: rawValue } map (from parseOptionSettings) into known
// (catalog) values mapped to form-friendly JS values, and unknown values kept as raw
// ini-text for lossless passthrough when regenerating.
export function splitKnownUnknown(rawValues, settingsCatalog) {
  const knownIds = new Set(settingsCatalog.map((s) => s.id))
  const formValues = {}
  for (const setting of settingsCatalog) {
    formValues[setting.id] = rawToFormValue(setting, rawValues[setting.id])
  }
  const unknownRaw = {}
  for (const [key, raw] of Object.entries(rawValues)) {
    if (!knownIds.has(key)) unknownRaw[key] = raw
  }
  return { formValues, unknownRaw }
}

// The live /settings REST endpoint returns already-decoded JSON (no ini quoting/parens
// to strip), so it gets its own lightweight adapter instead of the raw-text parser above.
export function apiValuesToForm(apiValues, settingsCatalog) {
  const knownIds = new Set(settingsCatalog.map((s) => s.id))
  const formValues = {}
  for (const setting of settingsCatalog) {
    const v = apiValues[setting.id]
    if (v === undefined) { formValues[setting.id] = setting.type === 'boolean' ? setting.default === 'True' : setting.default; continue }
    if (setting.type === 'boolean') formValues[setting.id] = v === true || v === 'True'
    else if (setting.type === 'array') formValues[setting.id] = Array.isArray(v) ? v.join(',') : String(v)
    else formValues[setting.id] = String(v)
  }
  const unknownRaw = {}
  for (const [key, v] of Object.entries(apiValues)) {
    if (knownIds.has(key)) continue
    unknownRaw[key] = typeof v === 'string' ? `"${v.replace(/"/g, '\\"')}"` : String(v)
  }
  return { formValues, unknownRaw }
}

// Build the full [/Script/Pal.PalGameWorldSettings] block from form values plus any
// untouched/unknown raw values (settings not in our catalog, preserved exactly as parsed).
export function serializeOptionSettings(formValues, settingsCatalog, unknownRaw = {}) {
  const parts = settingsCatalog.map((setting) => `${setting.id}=${formValueToRaw(setting, formValues[setting.id])}`)
  for (const [key, raw] of Object.entries(unknownRaw)) {
    parts.push(`${key}=${raw}`)
  }
  return `${SECTION_HEADER}\nOptionSettings=(${parts.join(',')})\n`
}

export function defaultFormValues(settingsCatalog) {
  const formValues = {}
  for (const setting of settingsCatalog) {
    formValues[setting.id] = setting.type === 'boolean' ? setting.default === 'True' : setting.default
  }
  return formValues
}
