import { getPriorSaturday, getPriorSunday, getNextSaturday, getNextSunday, sameDay, isHoliday } from './utils'

// shift is adjacent to an assigned night float week
export const queryNFWeekends = ({ NF }) => weekend => shift =>
  NF.reduce((okay, nf) =>
    okay &&
    !(getPriorSaturday(nf) <= weekend && weekend <= getNextSunday(nf)),
    true
  )

// shift is on resident's blackout day
export const queryBlackoutDays = ({ blackout }) => weekend => shift =>
  blackout.reduce((okay, bo) =>
  okay &&
  !sameDay(weekend, bo),
  true
)

export const queryPreferNotDays = ({ preferNot }) => weekend => shift =>
  preferNot.reduce((okay, pn) =>
  okay &&
  !sameDay(weekend, pn),
  true
)

export const queryPreferToWorkDays = ({ preferToWork }) => weekend => shift =>
  preferToWork.reduce((containsDay, ptw) =>
  containsDay ||
  sameDay(weekend, ptw),
  false
)

// shift conflicts with another shift that day at a different location
export const querySameDay = ({ assignedShifts }) => weekend => shift =>
  assignedShifts.reduce((okay, s) =>
  okay &&
  !sameDay(weekend, s.date),
  true
)

// day shift is adjacent to a night shift
// TODO: IMPLEMENT THIS

// night shift is adjacent to a day shift
// TODO: IMPLEMENT THIS

// shift is between two assigned CHOP weeks

export const queryCHOP = ({ CHOP }) => weekend => shift =>
  CHOP.reduce((conflict, cp) =>
    conflict + (
    sameDay(getPriorSaturday(cp), weekend)
    || sameDay(getPriorSunday(cp), weekend)
    || sameDay(getNextSaturday(cp), weekend)
    || sameDay(getNextSunday(cp), weekend)),
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

const queryBelowPerShiftCap = ( resident ) => weekend => shift => {
  if (isHoliday(weekend)) {
    return resident.assignedShifts.filter(s => isHoliday(s.date) && s.shift === shift).length < PerShiftCaps["HOLIDAY"][shift]
  } else {
    return resident.assignedShifts.filter(s => !isHoliday(s.date) && s.shift === shift).length < PerShiftCaps["REGULAR"][shift]
  }
}

export const queryBelowHUPHolidayDayFloatCap = ( resident ) => weekend => shift => {
  if (shift === "DF HUP" && isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowHUPDayFloatCap = ( resident ) => weekend => shift => {
  if (shift === "DF HUP" && !isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowPAHHolidayDayFloatCap = ( resident ) => weekend => shift => {
  if (shift === "DF PAH" && isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowPAHDayFloatCap = ( resident ) => weekend => shift => {
  if (shift === "DF PAH" && !isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowBodyHolidayCap = ( resident ) => weekend => shift => {
  if (shift === "Body Call" && isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowBodyCap = ( resident ) => weekend => shift => {
  if (shift === "Body Call" && !isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowHUPHolidayNightFloatCap = ( resident ) => weekend => shift => {
  if (shift === "NF HUP" && isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowHUPNightFloatCap = ( resident ) => weekend => shift => {
  if (shift === "NF HUP" && !isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowPAHHolidayNightFloatCap = ( resident ) => weekend => shift => {
  if (shift === "NF PAH" && isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowPAHNightFloatCap = ( resident ) => weekend => shift => {
  if (shift === "NF PAH" && !isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowAggregateNightFloatCap = ( resident ) => weekend => shift => {
  if (shift.includes("NF"))
    return resident.assignedShifts.filter(s => s.shift.includes("NF")).length < 5
  return true
}

export const queryBelowAggregateNormalDayFloatCap = ( resident ) => weekend => shift => {
  if (shift.includes("DF") && !isHoliday(weekend))
    return resident.assignedShifts.filter(s => !isHoliday(s.date) && s.shift.includes("DF")).length < 13
  return true
}

export const queryBelowAggregateHolidayDayFloatCap = ( resident ) => weekend => shift => {
  if (shift.includes("DF") && isHoliday(weekend))
    return resident.assignedShifts.filter(s => isHoliday(s.date) && s.shift.includes("DF")).length < 1
  return true
}

export const queryBelowBodyAggregateCap = ( resident ) => weekend => shift => {
  if (shift.includes("Body"))
    return resident.assignedShifts.filter(s => s.shift.includes("Body")).length < 2
  return true
}

export const queryBelowTotalCap = ( resident ) => weekend => shift =>
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

export const getAllUnrestrictedResidentsPerShift = shifts => restrictions => residents =>
  shifts.map(shift => {
    const neededShifts = Object.keys(shift).filter(k => k !== "date" && shift[k])
    return neededShifts.map(shiftName => ({
      date: shift.date,
      shift: shiftName,
      availableResidents: getUnrestrictedResidents(restrictions)(residents)(shift.date)(shiftName),
    }))
  })

export const hardRestrictions = [
  queryNFWeekends,
  querySameDay,
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
  queryBelowTotalCap
]

export const softRestrictions = [
  queryBlackoutDays,
  queryPreferNotDays,
]

export const preferToWorkFilters = [
  queryPreferToWorkDays
]

export const mapConstraintToMessage = {
    "queryNFWeekends": "Night float week",
    "queryBlackoutDays": "Blackout",
    "querySameDay": "Same day shift",
    "queryCHOP": "CHOP week",
    "queryBelowHUPHolidayDayFloatCap": "Max HUP holiday day shifts",
    "queryBelowHUPDayFloatCap": "Max HUP day shifts",
    "queryBelowPAHHolidayDayFloatCap": "Max PAH holiday day shifts",
    "queryBelowPAHDayFloatCap": "Max PAH day shifts",
    "queryBelowBodyHolidayCap": "Max body shifts",
    "queryBelowBodyCap": "Max body shifts",
    "queryBelowHUPHolidayNightFloatCap": "Max HUP holiday night shifts",
    "queryBelowHUPNightFloatCap": "Max HUP night shifts",
    "queryBelowPAHHolidayNightFloatCap": "Max PAH holiday night shifts",
    "queryBelowPAHNightFloatCap": "Max PAH night shifts",
    "queryBelowAggregateNightFloatCap": "Max night shifts",
    "queryBelowAggregateNormalDayFloatCap": "Max day shifts",
    "queryBelowAggregateHolidayDayFloatCap": "Max holiday shifts",
    "queryBelowBodyAggregateCap": "Max body shifts",
    "queryBelowTotalCap": "Max shifts",
    "queryPreferNotDays": "Preferred to not work",
    "queryPreferToWorkDays": "Preferred to work",
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
