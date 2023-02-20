import * as generic from './generic'
import { getPriorXDay, getNextXDay, getPriorSaturday, getNextSunday, sameDay, isPartOfHolidayWeekend } from '../utils'

export const yearName= "r3"
export const requiredShiftsURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdBkM4XlLYnuATduPs4eQBi77RNtIdaXX2HNVFPHzFgvl7tphlwcDYDiLs32RhDXuyIAZaMdFnJiAw/pub?gid=0&single=true&output=csv"
export const residentAssignedScheduleUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdBkM4XlLYnuATduPs4eQBi77RNtIdaXX2HNVFPHzFgvl7tphlwcDYDiLs32RhDXuyIAZaMdFnJiAw/pub?gid=2004341310&single=true&output=csv"
export const residentPreferencesUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdBkM4XlLYnuATduPs4eQBi77RNtIdaXX2HNVFPHzFgvl7tphlwcDYDiLs32RhDXuyIAZaMdFnJiAw/pub?gid=973200211&single=true&output=csv"

const PerShiftCaps = {
  "REGULAR" : {
    "Neuro": 6,
    "Body Call": 5,
    "NF HUP": 2,
    "NF PAH": 2,
  },

  "HOLIDAY" : {
    "Neuro": 3,
    "Body Call": 3,
    "NF HUP": 0,
    "NF PAH": 0,
  },
  "AGGREGATE NF": 3,
  "AGGREGATE NEURO": 6,
  "AGGREGATE BODY": 5,
  "TOTAL CAP": 14,
}

const DifficultyHeuristic = {
  "REGULAR" : {
    "Neuro": 1.0,
    "Body Call": 1.0,
    "NF HUP": 1.0,
    "NF PAH": 1.0,
  },

  "HOLIDAY" : {
    "Neuro": 1.25,
    "Body Call": 1.0,
    "NF HUP": 1.25,
    "NF PAH": 1.25,
  },
}

// shift is on the weekend of night float rotation
const queryNFWeekends = ({ NF }) => date => shift => NF.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

const queryPPWeekends = ({ PP }) => date => shift => PP.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

const queryGlobal = ({ GLOBAL }) => date => shift => GLOBAL.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

const queryAIRP = ({ AIRP }) => date => shift => AIRP.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

// shift is on the same day as a saturday night call
const querySaturdayNightCallWeekend = ({ assignedShifts }) => date => shift =>
  assignedShifts.reduce((okay, s) =>
  okay &&
    !(
      (s.shift.includes("NF") && sameDay(getPriorSaturday(date), s.date))
      || (shift.includes("NF") && sameDay(getPriorSaturday(s.date), date))
    ),
  true
)

// shift is between two assigned CHOP weeks

const queryCHOP = ({ CHOP }) => date => shift =>
  CHOP.reduce((conflict, cp) =>
    conflict + (
    sameDay(getPriorXDay(cp, date.weekData.weekday), date)
    || sameDay(getNextXDay(cp, date.weekData.weekday), date)),
  0
  ) < 2

const queryBelowNeuroHolidayCap           = generic.floatCap("Neuro", true, PerShiftCaps)
const queryBelowNeuroCap                  = generic.floatCap("Neuro", false, PerShiftCaps)
const queryBelowBodyHolidayCap            = generic.floatCap("Body Call", true, PerShiftCaps)
const queryBelowBodyCap                   = generic.floatCap("Body Call", true, PerShiftCaps)
const queryBelowHUPHolidayNightFloatCap   = generic.floatCap("NF HUP", true, PerShiftCaps)
const queryBelowHUPNightFloatCap          = generic.floatCap("NF HUP", false, PerShiftCaps)
const queryBelowPAHHolidayNightFloatCap   = generic.floatCap("NF PAH", true, PerShiftCaps)
const queryBelowPAHNightFloatCap          = generic.floatCap("NF PAH", false, PerShiftCaps)

const queryBelowAggregateNightFloatCap = ( resident, holidays ) => date => shift => {
  if (shift.includes("NF"))
    return resident.assignedShifts.filter(s => s.shift.includes("NF")).length < PerShiftCaps["AGGREGATE NF"]
  return true
}


const queryBelowNeuroAggregateCap = ( resident, holidays ) => date => shift => {
  if (shift.includes("Neuro"))
    return resident.assignedShifts.filter(s => s.shift.includes("Neuro")).length < PerShiftCaps["AGGREGATE NEURO"]
  return true
}

const queryBelowBodyAggregateCap = ( resident, holidays ) => date => shift => {
  if (shift.includes("Body"))
    return resident.assignedShifts.filter(s => s.shift.includes("Body")).length < PerShiftCaps["AGGREGATE BODY"]
  return true
}

const queryBelowTotalCap = ( resident, holidays ) => date => shift =>
  resident.assignedShifts.length < PerShiftCaps["TOTAL CAP"]

export const constraints = [
  ...generic.constraints,
  //Hard constraints
  { "name": "queryNFWeekends", "fn": queryNFWeekends, "msg": "Night float week", "type": "hard" },
  { "name": "queryPPWeekends", "fn": queryPPWeekends, "msg": "Private practice week", "type": "hard" },
  { "name": "querySaturdayNightCallWeekend", "fn": querySaturdayNightCallWeekend, "msg": "Night saturday call <> shift" , "type": "hard"},
  { "name": "queryGlobal", "fn": queryGlobal, "msg": "Global studies week", "type": "hard" },
  { "name": "queryCHOP", "fn": queryCHOP, "msg": "CHOP week", "type": "hard" },
  { "name": "queryBelowNeuroHolidayCap", "fn": queryBelowNeuroHolidayCap, "msg": "Max Neuro holiday shifts", "type": "hard" },
  { "name": "queryBelowNeuroCap", "fn": queryBelowNeuroCap, "msg": "Max Neuro shifts", "type": "hard" },
  { "name": "queryBelowBodyHolidayCap", "fn": queryBelowBodyHolidayCap, "msg": "Max holiday body shifts", "type": "hard" },
  { "name": "queryBelowBodyCap", "fn": queryBelowBodyCap, "msg": "Max weekend body shifts", "type": "hard" },
  { "name": "queryBelowHUPHolidayNightFloatCap", "fn": queryBelowHUPHolidayNightFloatCap, "msg": "Max HUP holiday night shifts", "type": "hard" },
  { "name": "queryBelowHUPNightFloatCap", "fn": queryBelowHUPNightFloatCap, "msg": "Max HUP night shifts", "type": "hard" },
  { "name": "queryBelowPAHHolidayNightFloatCap", "fn": queryBelowPAHHolidayNightFloatCap, "msg": "Max PAH holiday night shifts", "type": "hard" },
  { "name": "queryBelowPAHNightFloatCap", "fn": queryBelowPAHNightFloatCap, "msg": "Max PAH night shifts", "type": "hard" },
  { "name": "queryBelowAggregateNightFloatCap", "fn": queryBelowAggregateNightFloatCap, "msg": "Max night shifts", "type": "hard" },
  { "name": "queryBelowBodyAggregateCap", "fn": queryBelowBodyAggregateCap, "msg": "Max body shifts", "type": "hard" },
  { "name": "queryBelowNeuroAggregateCap", "fn": queryBelowNeuroAggregateCap, "msg": "Max aggregate neuro shifts", "type": "hard" },
  { "name": "queryBelowTotalCap", "fn": queryBelowTotalCap, "msg": "Max shifts", "type": "hard" },

  //Soft constraints
  { "name": "queryAIRP", "fn": queryAIRP, "msg": "AIRP week", "type": "soft" },
]


export const getTotalDifficulty = holidays => resident =>
  resident.assignedShifts.reduce((total, s) =>
    isPartOfHolidayWeekend(holidays)(s.date)
    ? total + DifficultyHeuristic["HOLIDAY"][s.shift]
    : total + DifficultyHeuristic["REGULAR"][s.shift]
  , 0)

