import { parseFormsDate } from './utils'

export const cleanResidentCSV = o => {
  let availableDates = Object.keys(o).filter(c => c.includes("["))
  return {
    name: o["What is your name? "],
    blackout: availableDates.filter(d => o[d] === "Blackout").map(parseFormsDate),
    preferNot: availableDates.filter(d => o[d] === "Prefer Not").map(parseFormsDate),
    preferToWork: availableDates.filter(d => o[d] === "Prefer to Work").map(parseFormsDate),
  }
}

export const extractRotations = schedule => ({
  name: schedule.name,
  CHOP: Object.keys(schedule).filter(k => k !== "name" && schedule[k] === "CHOP").map(parseFormsDate),
  NF: Object.keys(schedule).filter(k => k !== "name" && schedule[k] !== null && schedule[k].includes("NF")).map(parseFormsDate),

  PP: Object.keys(schedule).filter(k => k !== "name" && schedule[k] === "PP").map(parseFormsDate),
  AIRP: Object.keys(schedule).filter(k => k !== "name" && schedule[k] === "AIRP").map(parseFormsDate),
  IR: Object.keys(schedule).filter(k => k !== "name" && schedule[k] !== null && (schedule[k].split(" ").findIndex(i => i === "IR") !== -1)).map(parseFormsDate),
  VAC: Object.keys(schedule).filter(k => k !== "name" && schedule[k] === "Vac").map(parseFormsDate),
  GLOBAL: Object.keys(schedule).filter(k => k !== "name" && schedule[k] === "Global").map(parseFormsDate),
  PRN: Object.keys(schedule).filter(k => k !== "name" && schedule[k] === "PrN").map(parseFormsDate),
})
