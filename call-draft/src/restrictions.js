import { getPriorSaturday, getPriorSunday, getNextSaturday, getNextSunday, sameDay, isHoliday } from './utils'

// shift is adjacent to an assigned night float week
export const queryNFWeekends = ({ NF }) => date => shift => NF.reduce((okay, nf) =>
  okay &&
  !(getPriorSaturday(nf) <= date && date <= getNextSunday(nf)),
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

// shift conflicts with another shift that day at a different location
export const querySameDay = ({ assignedShifts }) => date => shift =>
  assignedShifts.reduce((okay, s) =>
  okay &&
  !sameDay(date, s.date),
  true
)

// shift is on the same weekend as a saturday night call
export const querySaturdayNightCallWeekend = ({ assignedShifts }) => date => shift =>
  assignedShifts.reduce((okay, s) =>
  okay &&
    !(
      (s.shift.includes("NF") && sameDay(getPriorSaturday(date), s.date))
      || (shift.includes("NF") && sameDay(getPriorSaturday(s.date), date))
    ),
  true
)

// shift is between two assigned CHOP weeks

export const queryCHOP = ({ CHOP }) => date => shift =>
  CHOP.reduce((conflict, cp) =>
    conflict + (
    sameDay(getPriorSaturday(cp), date)
    || sameDay(getPriorSunday(cp), date)
    || sameDay(getNextSaturday(cp), date)
    || sameDay(getNextSunday(cp), date)),
  0
) < 2


const PerShiftCaps = {
  "REGULAR" : {
    "DF HUP": 8,
    "DF PAH": 8,
    "Body Call": 2,
    "NF HUP": 3,
    "NF PAH": 3,
  },

  "HOLIDAY" : {
    "DF HUP": 1,
    "DF PAH": 1,
    "Body Call": 2,
    "NF HUP": 1,
    "NF PAH": 1,
  }
}

const queryBelowPerShiftCap = ( resident ) => date => shift => {
  if (isHoliday(date)) {
    return resident.assignedShifts.filter(s => isHoliday(s.date) && s.shift === shift).length < PerShiftCaps["HOLIDAY"][shift]
  } else {
    return resident.assignedShifts.filter(s => !isHoliday(s.date) && s.shift === shift).length < PerShiftCaps["REGULAR"][shift]
  }
}

export const queryBelowHUPHolidayDayFloatCap = ( resident ) => date => shift => {
  if (shift === "DF HUP" && isHoliday(date))
    return queryBelowPerShiftCap(resident)(date)(shift)
  return true
}

export const queryBelowHUPDayFloatCap = ( resident ) => date => shift => {
  if (shift === "DF HUP" && !isHoliday(date))
    return queryBelowPerShiftCap(resident)(date)(shift)
  return true
}

export const queryBelowPAHHolidayDayFloatCap = ( resident ) => date => shift => {
  if (shift === "DF PAH" && isHoliday(date))
    return queryBelowPerShiftCap(resident)(date)(shift)
  return true
}

export const queryBelowPAHDayFloatCap = ( resident ) => date => shift => {
  if (shift === "DF PAH" && !isHoliday(date))
    return queryBelowPerShiftCap(resident)(date)(shift)
  return true
}

export const queryBelowBodyHolidayCap = ( resident ) => date => shift => {
  if (shift === "Body Call" && isHoliday(date))
    return queryBelowPerShiftCap(resident)(date)(shift)
  return true
}

export const queryBelowBodyCap = ( resident ) => date => shift => {
  if (shift === "Body Call" && !isHoliday(date))
    return queryBelowPerShiftCap(resident)(date)(shift)
  return true
}

export const queryBelowHUPHolidayNightFloatCap = ( resident ) => date => shift => {
  if (shift === "NF HUP" && isHoliday(date))
    return queryBelowPerShiftCap(resident)(date)(shift)
  return true
}

export const queryBelowHUPNightFloatCap = ( resident ) => date => shift => {
  if (shift === "NF HUP" && !isHoliday(date))
    return queryBelowPerShiftCap(resident)(date)(shift)
  return true
}

export const queryBelowPAHHolidayNightFloatCap = ( resident ) => date => shift => {
  if (shift === "NF PAH" && isHoliday(date))
    return queryBelowPerShiftCap(resident)(date)(shift)
  return true
}

export const queryBelowPAHNightFloatCap = ( resident ) => date => shift => {
  if (shift === "NF PAH" && !isHoliday(date))
    return queryBelowPerShiftCap(resident)(date)(shift)
  return true
}

export const queryBelowAggregateNightFloatCap = ( resident ) => date => shift => {
  if (shift.includes("NF"))
    return resident.assignedShifts.filter(s => s.shift.includes("NF")).length < 5
  return true
}

export const queryBelowAggregateNormalDayFloatCap = ( resident ) => date => shift => {
  if (shift.includes("DF") && !isHoliday(date))
    return resident.assignedShifts.filter(s => !isHoliday(s.date) && s.shift.includes("DF")).length < 13
  return true
}

export const queryBelowAggregateHolidayDayFloatCap = ( resident ) => date => shift => {
  if (shift.includes("DF") && isHoliday(date))
    return resident.assignedShifts.filter(s => isHoliday(s.date) && s.shift.includes("DF")).length < 1
  return true
}

export const queryBelowBodyAggregateCap = ( resident ) => date => shift => {
  if (shift.includes("Body"))
    return resident.assignedShifts.filter(s => s.shift.includes("Body")).length < 3
  return true
}

export const queryBelowTotalCap = ( resident ) => date => shift =>
  resident.assignedShifts.length < 19

export const getUnrestrictedResidents = restrictions => residents => day => shift =>
  residents.filter(
    resident => restrictions.every(
      restriction => restriction(resident)(day)(shift)
    )
  )

export const getConstraintsForResidents = restrictions => residents => day => shift =>
  Object.fromEntries(residents.map(resident =>
    [
      resident.name,
      Object.fromEntries(restrictions.map(restriction =>
        [
          restriction.name,
          restriction(resident)(day)(shift)
        ]
      ))
    ]
  ))

export const getFlatListOfShifts = shifts =>
  shifts.map(shift => {
    const neededShifts = Object.keys(shift).filter(k => k !== "date" && shift[k] === "1")
    return neededShifts.map(shiftName => ({
      date: shift.date,
      shift: shiftName,
    }))
  }).flat()

export const getUnfilledShifts = shifts => assignedShifts => shifts.filter(s => assignedShifts[s.date][s.shift] === undefined)

export const getAllUnrestrictedResidentsPerShift = flatShifts => restrictions => residents =>
  flatShifts.map(shift => ({
      date: shift.date,
      shift: shift.shift,
      availableResidents: getUnrestrictedResidents(restrictions)(residents)(shift.date)(shift.shift),
  }))

export const hardRestrictions = [
  queryNFWeekends,
  querySameDay,
  querySaturdayNightCallWeekend,
  queryCHOP,
  queryBelowHUPHolidayDayFloatCap,
  queryBelowHUPDayFloatCap,
  queryBelowPAHHolidayDayFloatCap,
  queryBelowPAHDayFloatCap,
  queryBelowBodyHolidayCap,
  queryBelowBodyCap,
  queryBelowHUPHolidayNightFloatCap,
  queryBelowHUPNightFloatCap,
  queryBelowPAHHolidayNightFloatCap,
  queryBelowPAHNightFloatCap,
  queryBelowAggregateNightFloatCap,
  queryBelowAggregateNormalDayFloatCap,
  queryBelowAggregateHolidayDayFloatCap,
  queryBelowBodyAggregateCap,
  queryBelowTotalCap,
  queryBlackoutDays,
]

export const softRestrictions = [
  queryPreferNotDays,
]

export const preferToWorkFilters = [
  queryPreferToWorkDays
]

export const mapConstraintToMessage = {
    "queryNFWeekends": "Night float week",
    "queryBlackoutDays": "Blackout",
    "querySameDay": "Same day shift",
    "querySaturdayNightCallWeekend": "Night saturday call <> shift",
    "queryCHOP": "CHOP week",
    "queryBelowHUPHolidayDayFloatCap": "Max HUP holiday day shifts",
    "queryBelowHUPDayFloatCap": "Max HUP day shifts",
    "queryBelowPAHHolidayDayFloatCap": "Max PAH holiday day shifts",
    "queryBelowPAHDayFloatCap": "Max PAH day shifts",
    "queryBelowBodyHolidayCap": "Max holiday body shifts",
    "queryBelowBodyCap": "Max weekend body shifts",
    "queryBelowHUPHolidayNightFloatCap": "Max HUP holiday night shifts",
    "queryBelowHUPNightFloatCap": "Max HUP night shifts",
    "queryBelowPAHHolidayNightFloatCap": "Max PAH holiday night shifts",
    "queryBelowPAHNightFloatCap": "Max PAH night shifts",
    "queryBelowAggregateNightFloatCap": "Max night shifts",
    "queryBelowAggregateNormalDayFloatCap": "Max day shifts",
    "queryBelowAggregateHolidayDayFloatCap": "Max holiday day shifts",
    "queryBelowBodyAggregateCap": "Max body shifts",
    "queryBelowTotalCap": "Max shifts",
    "queryPreferNotDays": "Prefer to not work",
    "queryPreferToWorkDays": "Prefer to work",
  }

export const splitResidents = residents => date => shift => {

  const hardConstraints = getConstraintsForResidents(hardRestrictions)(residents)(date)(shift)
  const softConstraints = getConstraintsForResidents(softRestrictions)(residents)(date)(shift)
  const preferred = getConstraintsForResidents(preferToWorkFilters)(residents)(date)(shift)

  const hardRestricted = Object.keys(hardConstraints).map(name => ({
    name,
    constraints: Object.keys(hardConstraints[name]).filter(k => !hardConstraints[name][k])
  })).filter(o => o.constraints.length > 0)
  const hardRestrictedNames = hardRestricted.map(o => o.name)

  const softRestricted = Object.keys(softConstraints).map(name => ({
    name,
    constraints: Object.keys(softConstraints[name]).filter(k => !softConstraints[name][k])
  })).filter(o => o.constraints.length > 0 && hardRestrictedNames.find(q => q === o.name) === undefined)
  const softRestrictedNames = softRestricted.map(o => o.name)

  const preferredToWork = Object.keys(preferred).map(name => ({
    name,
    preferred: Object.keys(preferred[name]).filter(k => preferred[name][k])
  })).filter(
    o => o.preferred.length > 0
    && hardRestrictedNames.find(q => q === o.name) === undefined
    && softRestrictedNames.find(q => q === o.name) === undefined
  )
  const preferredToWorkNames = preferredToWork.map(o => o.name)

  const neutral = residents.filter(r =>
    hardRestrictedNames.find(q => q === r.name) === undefined
    && softRestrictedNames.find(q => q === r.name) === undefined
    && preferredToWorkNames.find(q => q === r.name) === undefined
  ).map(r => ({name: r.name, constraints: [] }))

  return {preferredToWork, neutral, softRestricted, hardRestricted}
}
