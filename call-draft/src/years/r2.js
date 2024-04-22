import * as generic from './generic'
import { getPriorXDay, getNextXDay, getPriorSaturday, getNextSunday, sameDay, isPartOfHolidayWeekend } from '../utils'

export const yearName = "r2"
// export const requiredShiftsURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNefnctzjWPpE-rWcQyTesFq0GJaYjMQ-Ux20oO8bx-3GgLTCT7vkOxMzD0nq_dTviZ_SIyMMmlqt8/pub?gid=1433333551&single=true&output=csv"
// export const residentAssignedScheduleUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNefnctzjWPpE-rWcQyTesFq0GJaYjMQ-Ux20oO8bx-3GgLTCT7vkOxMzD0nq_dTviZ_SIyMMmlqt8/pub?gid=530426204&single=true&output=csv"
// export const residentPreferencesUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNefnctzjWPpE-rWcQyTesFq0GJaYjMQ-Ux20oO8bx-3GgLTCT7vkOxMzD0nq_dTviZ_SIyMMmlqt8/pub?gid=0&single=true&output=csv"

export const requiredShiftsURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsvF-8mREle8q3pup7n785hpMAcKFYkAiBvQ-kIUMIdtN-MFTOM5vtN1vt-FwOk3_zx93d1z95sdNb/pub?gid=0&single=true&output=csv"
export const residentAssignedScheduleUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsvF-8mREle8q3pup7n785hpMAcKFYkAiBvQ-kIUMIdtN-MFTOM5vtN1vt-FwOk3_zx93d1z95sdNb/pub?gid=1197904990&single=true&output=csv"
export const residentPreferencesUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsvF-8mREle8q3pup7n785hpMAcKFYkAiBvQ-kIUMIdtN-MFTOM5vtN1vt-FwOk3_zx93d1z95sdNb/pub?gid=128226207&single=true&output=csv"

const PerShiftCaps = {
  "REGULAR" : {
    "DF HUP": 6,
    "DF PAH": 6,
    "Body Call": 2,
    "NF HUP": 2,
    "NF PAH": 2,
  },

  "HOLIDAY" : {
    "DF HUP": 3,
    "DF PAH": 3,
    "Body Call": 1,
    "NF HUP": 1,
    "NF PAH": 1,
  },
  "AGGREGATE NF": 5,
  "AGGREGATE DF": 13,
  "AGGREGATE HOLIDAY DF": 3,
  "AGGREGATE BODY": 3,
  "TOTAL CAP": 19,
}

const DifficultyHeuristic = {
  "REGULAR" : {
    "DF HUP": 1.0,
    "DF PAH": 1.0,
    "Body Call": 0.75,
    "NF HUP": 1.0,
    "NF PAH": 1.0,
  },

  "HOLIDAY" : {
    "DF HUP": 1.25,
    "DF PAH": 1.25,
    "Body Call": 1,
    "NF HUP": 1.25,
    "NF PAH": 1.25,
  },
}

const queryNFWeekends = ({ NF }) => date => shift => NF.reduce((okay, nf) =>
  okay &&
  !(getPriorSaturday(nf) <= date && date <= getNextSunday(nf)),
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


const queryBelowHUPHolidayDayFloatCap     = generic.floatCap("DF HUP", true, PerShiftCaps)
const queryBelowHUPDayFloatCap            = generic.floatCap("DF HUP", false, PerShiftCaps)
const queryBelowPAHHolidayDayFloatCap     = generic.floatCap("DF PAH", true, PerShiftCaps)
const queryBelowPAHDayFloatCap            = generic.floatCap("DF PAH", false, PerShiftCaps)
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

const queryBelowAggregateNormalDayFloatCap = ( resident, holidays ) => date => shift => {
  if (shift.includes("DF") && !isPartOfHolidayWeekend(holidays)(date))
    return resident.assignedShifts.filter(s => !isPartOfHolidayWeekend(holidays)(s.date) && s.shift.includes("DF")).length < PerShiftCaps["AGGREGATE DF"]
  return true
}

const queryBelowAggregateHolidayDayFloatCap = ( resident, holidays ) => date => shift => {
  if (shift.includes("DF") && isPartOfHolidayWeekend(holidays)(date))
    return resident.assignedShifts.filter(s => isPartOfHolidayWeekend(holidays)(s.date) && s.shift.includes("DF")).length < PerShiftCaps["AGGREGATE HOLIDAY DF"]
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
  // Hard restrictions
  { "name": "queryNFWeekends", "fn": queryNFWeekends, "msg": "Night float week", "type": "hard" },
  { "name": "querySaturdayNightCallWeekend", "fn": querySaturdayNightCallWeekend, "msg": "Night saturday call <> shift", "type": "hard" },
  { "name": "queryCHOP", "fn": queryCHOP, "msg": "CHOP week", "type": "hard" },
  { "name": "queryBelowHUPHolidayDayFloatCap", "fn": queryBelowHUPHolidayDayFloatCap, "msg": "Max HUP holiday day shifts", "type": "hard" },
  { "name": "queryBelowHUPDayFloatCap", "fn": queryBelowHUPDayFloatCap, "msg": "Max HUP day shifts", "type": "hard" },
  { "name": "queryBelowPAHHolidayDayFloatCap", "fn": queryBelowPAHHolidayDayFloatCap, "msg": "Max PAH holiday day shifts", "type": "hard" },
  { "name": "queryBelowPAHDayFloatCap", "fn": queryBelowPAHDayFloatCap, "msg": "Max PAH day shifts", "type": "hard" },
  { "name": "queryBelowBodyHolidayCap", "fn": queryBelowBodyHolidayCap, "msg": "Max holiday body shifts", "type": "hard" },
  { "name": "queryBelowBodyCap", "fn": queryBelowBodyCap, "msg": "Max weekend body shifts", "type": "hard" },
  { "name": "queryBelowHUPHolidayNightFloatCap", "fn": queryBelowHUPHolidayNightFloatCap, "msg": "Max HUP holiday night shifts", "type": "hard" },
  { "name": "queryBelowHUPNightFloatCap", "fn": queryBelowHUPNightFloatCap, "msg": "Max HUP night shifts", "type": "hard" },
  { "name": "queryBelowPAHHolidayNightFloatCap", "fn": queryBelowPAHHolidayNightFloatCap, "msg": "Max PAH holiday night shifts", "type": "hard" },
  { "name": "queryBelowPAHNightFloatCap", "fn": queryBelowPAHNightFloatCap, "msg": "Max PAH night shifts", "type": "hard" },
  { "name": "queryBelowAggregateNightFloatCap", "fn": queryBelowAggregateNightFloatCap, "msg": "Max night shifts", "type": "hard" },
  { "name": "queryBelowAggregateNormalDayFloatCap", "fn": queryBelowAggregateNormalDayFloatCap, "msg": "Max day shifts", "type": "hard" },
  { "name": "queryBelowAggregateHolidayDayFloatCap", "fn": queryBelowAggregateHolidayDayFloatCap, "msg": "Max holiday day shifts", "type": "hard" },
  { "name": "queryBelowBodyAggregateCap", "fn": queryBelowBodyAggregateCap, "msg": "Max body shifts", "type": "hard" },
  { "name": "queryBelowTotalCap", "fn": queryBelowTotalCap, "msg": "Max shifts", "type": "hard" },
]

export const getTotalDifficulty = holidays => resident =>
  resident.assignedShifts.reduce((total, s) =>
    isPartOfHolidayWeekend(holidays)(s.date)
    ? total + DifficultyHeuristic["HOLIDAY"][s.shift]
    : total + DifficultyHeuristic["REGULAR"][s.shift]
  , 0)

