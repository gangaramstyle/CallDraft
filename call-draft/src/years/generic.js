import { sameDay,  isPartOfHolidayWeekend, getPriorSaturday, getNextSunday} from '../utils'

// shift conflicts with another shift that day at a different location
export const querySameDay = ({ assignedShifts }) => date => shift =>
  assignedShifts.reduce((okay, s) =>
  okay &&
  !sameDay(date, s.date),
  true
)

// shift is on resident's blackout day
export const queryBlackoutDays = ({ blackout }) => date => shift =>
  blackout.reduce((okay, bo) =>
  okay &&
  !sameDay(date, bo),
  true
)

export const queryPreferNotDays = ({ preferNot }) => date => shift =>
  preferNot.reduce((okay, pn) =>
  okay &&
  !sameDay(date, pn),
  true
)

export const queryPreferToWorkDays = ({ preferToWork }) => date => shift =>
  preferToWork.reduce((containsDay, ptw) =>
  containsDay ||
  sameDay(date, ptw),
  false
)


export const queryVacation = ({ VAC }) => date => shift => VAC.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

export const queryFMLA= ({ FMLA }) => date => shift => FMLA.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

const queryGlobal = ({ GLOBAL }) => date => shift => GLOBAL.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

export const queryIR = ({ IR }) => date => shift => IR.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)


export const floatCap = (SHIFT, HOLIDAY, PerShiftCaps) => ( resident, holidays ) => date => shift => {
  if (
    shift === SHIFT &&
    (HOLIDAY
    ? isPartOfHolidayWeekend(holidays)(date)
      : !isPartOfHolidayWeekend(holidays)(date)
    )
  )
    if (isPartOfHolidayWeekend(holidays)(date)) {
      return resident.assignedShifts.filter(s => isPartOfHolidayWeekend(holidays)(s.date) && s.shift === shift).length < PerShiftCaps["HOLIDAY"][shift]
    } else {
      return resident.assignedShifts.filter(s => !isPartOfHolidayWeekend(holidays)(s.date) && s.shift === shift).length < PerShiftCaps["REGULAR"][shift]
    }
  return true
}

export const constraints = [
  // hard restrictions
  { "name": "queryBlackoutDays", "fn": queryBlackoutDays, "msg": "Blackout", "type": "hard" },
  { "name": "querySameDay", "fn": querySameDay, "msg": "Same day shift", "type": "hard" },
  { "name": "queryVacation", "fn": queryVacation, "msg": "Vacation week", "type": "hard" },
  { "name": "queryFMLA", "fn": queryFMLA, "msg": "FMLA week", "type": "hard" },
  { "name": "queryGlobal", "fn": queryGlobal, "msg": "Global health week", "type": "hard" },

  // soft restrictions
  { "name": "queryPreferNotDays", "fn": queryPreferNotDays, "msg": "Prefer to not work", "type": "soft" },
  { "name": "queryIR", "fn": queryIR, "msg": "IR week", "type": "soft"},

  // prefer to work filter
  { "name": "queryPreferToWorkDays", "fn": queryPreferToWorkDays, "msg": "Prefer to work", "type": "prefer" },
]

export const genericGetTotalDifficulty = DifficultyHeuristic => holidays => resident =>
  resident.assignedShifts.reduce((total, s) =>
    isPartOfHolidayWeekend(holidays)(s.date)
    ? total + DifficultyHeuristic["HOLIDAY"][s.shift]
    : total + DifficultyHeuristic["REGULAR"][s.shift]
  , 0)

