import * as generic from './generic'
import { getPriorSaturday, getNextSunday, isPartOfHolidayWeekend } from '../utils'

export const yearName="r4"
export const requiredShiftsURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ8POx_2ekDFfj-3rHdkpuonPJGM8eTfAccsC_OjiqWTo3C22rDkH-fF6FEBS3CxtsqdukyplaiJKb/pub?gid=0&single=true&output=csv"
export const residentAssignedScheduleUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ8POx_2ekDFfj-3rHdkpuonPJGM8eTfAccsC_OjiqWTo3C22rDkH-fF6FEBS3CxtsqdukyplaiJKb/pub?gid=1947318660&single=true&output=csv"
export const residentPreferencesUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ8POx_2ekDFfj-3rHdkpuonPJGM8eTfAccsC_OjiqWTo3C22rDkH-fF6FEBS3CxtsqdukyplaiJKb/pub?gid=396610078&single=true&output=csv"

const PerShiftCaps = {
  "REGULAR" : {
    "Neuro": 2,
    "Swing PAH": 8,
  },

  "HOLIDAY" : {
    "Neuro": 3,
    "Swing PAH": 3,
  },
  "AGGREGATE NEURO": 3,
  "AGGREGATE SWING PAH": 8,
  "TOTAL CAP": 14,
}

const DifficultyHeuristic = {
  "REGULAR" : {
    "Neuro": 1.0,
    "Swing PAH": 1.0,
  },

  "HOLIDAY" : {
    "Neuro": 1.25,
    "Swing PAH": 1.25,
  },
}

const queryPPWeekends = ({ PP }) => date => shift => PP.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

const queryPrNWeekends = ({ PRN }) => date => shift => PRN.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

const queryBelowNeuroHolidayCap      = generic.floatCap("Neuro", true, PerShiftCaps)
const queryBelowNeuroCap             = generic.floatCap("Neuro", false, PerShiftCaps)
const queryBelowSwingPAHHolidayCap   = generic.floatCap("Swing PAH", true, PerShiftCaps)
const queryBelowSwingPAHCap          = generic.floatCap("Swing PAH", false, PerShiftCaps)

const queryBelowNeuroAggregateCap = ( resident, holidays ) => date => shift => {
  if (shift.includes("Neuro"))
    return resident.assignedShifts.filter(s => s.shift.includes("Neuro")).length < PerShiftCaps["AGGREGATE NEURO"]
  return true
}

const queryBelowTotalCap = ( resident, holidays ) => date => shift =>
  resident.assignedShifts.length < PerShiftCaps["TOTAL CAP"]

export const constraints = [
  ...generic.constraints,
  { "name": "queryPPWeekends", "fn": queryPPWeekends, "msg": "Private practice week", "type": "hard" },
  { "name": "queryPrNWeekends", "fn": queryPrNWeekends, "msg": "Prebsy nights week", "type": "hard" },
  { "name": "queryBelowNeuroHolidayCap", "fn": queryBelowNeuroHolidayCap, "msg": "Max Neuro shifts", "type": "hard" },
  { "name": "queryBelowNeuroCap", "fn": queryBelowNeuroCap, "msg": "Max Neuro shifts", "type": "hard" },
  { "name": "queryBelowNeuroAggregateCap", "fn": queryBelowNeuroAggregateCap, "msg": "Max night shifts", "type": "hard" },
  { "name": "queryBelowSwingPAHHolidayCap", "fn": queryBelowSwingPAHHolidayCap, "msg": "Max Swing PAH holiday shifts", "type": "hard" },
  { "name": "queryBelowSwingPAHCap", "fn": queryBelowSwingPAHCap, "msg": "Max Swing PAH shifts", "type": "hard" },
  { "name": "queryBelowTotalCap", "fn": queryBelowTotalCap, "msg": "Max shifts", "type": "hard" },
]

export const getTotalDifficulty = holidays => resident =>
  resident.assignedShifts.reduce((total, s) =>
    isPartOfHolidayWeekend(holidays)(s.date)
    ? total + DifficultyHeuristic["HOLIDAY"][s.shift]
    : total + DifficultyHeuristic["REGULAR"][s.shift]
  , 0)

