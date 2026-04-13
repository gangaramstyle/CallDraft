import { parseFormsDate } from './utils'

// Helper to normalize date column names (strip "- " prefix if present)
const normalizeDateColumn = columnName => columnName.replace(/^-\s*/, '')

// Helper to extract name from either Name column or Email Address column.
// Names are lowercased so prefs/rotation sheets can mismatch case (e.g.
// "Justin.Shanahan" in one sheet, "justin.shanahan" in the other).
const extractName = o => {
  const raw =
    o["Name"] ||
    o["name"] ||
    (o["Email Address"] && o["Email Address"].split("@")[0]) ||
    (o["email"] && o["email"].split("@")[0])
  return raw ? raw.toLowerCase() : null
}

// Helper to check if a value matches "Blackout" (case-insensitive)
const isBlackout = val => {
  if (!val) return false
  return val.toLowerCase().trim() === "blackout"
}

// Helper to check if a value matches "Prefer Not" variations
const isPreferNot = val => {
  if (!val) return false
  const normalized = val.toLowerCase().trim()
  return normalized === "prefer not" ||
         normalized === "prefer not to work" ||
         normalized.includes("prefer not")
}

// Helper to check if a value matches "Prefer to Work" variations
const isPreferToWork = val => {
  if (!val) return false
  const normalized = val.toLowerCase().trim()
  return normalized === "prefer to work" ||
         normalized === "prefer work" ||
         (normalized.includes("prefer") && normalized.includes("work") && !normalized.includes("not"))
}

export const cleanResidentCSV = o => {
  let availableDates = Object.keys(o).filter(c => c.includes("["))
  return {
    name: extractName(o),
    blackout: availableDates.filter(d => isBlackout(o[d])).map(c => parseFormsDate(normalizeDateColumn(c))),
    preferNot: availableDates.filter(d => isPreferNot(o[d])).map(c => parseFormsDate(normalizeDateColumn(c))),
    preferToWork: availableDates.filter(d => isPreferToWork(o[d])).map(c => parseFormsDate(normalizeDateColumn(c))),
  }
}

export const extractRotations = schedule => ({
  name: schedule.name ? schedule.name.toLowerCase() : schedule.name,
  CHOP: Object.keys(schedule).filter(k => k !== "name" && schedule[k] === "CHOP").map(parseFormsDate),
  NF: Object.keys(schedule).filter(k => k !== "name" && schedule[k] !== null && schedule[k].includes("NF")).map(parseFormsDate),

  PP: Object.keys(schedule).filter(k => k !== "name" && schedule[k] === "PP").map(parseFormsDate),
  AIRP: Object.keys(schedule).filter(k => k !== "name" && schedule[k] === "AIRP").map(parseFormsDate),
  IR: Object.keys(schedule).filter(k => k !== "name" && schedule[k] !== null && (schedule[k].split(" ").findIndex(i => i === "IR") !== -1)).map(parseFormsDate),
  VAC: Object.keys(schedule).filter(k => k !== "name" && (schedule[k] === "Vac" || schedule[k] === "vacation")).map(parseFormsDate),
  FMLA: Object.keys(schedule).filter(k => k !== "name" && schedule[k] === "FMLA").map(parseFormsDate),
  GLOBAL: Object.keys(schedule).filter(k => k !== "name" && schedule[k] === "GLOBAL").map(parseFormsDate),
  PRN: Object.keys(schedule).filter(k => k !== "name" && schedule[k] === "PrN").map(parseFormsDate),
})
