import {
  getTotalDifficulty,
  constraints,
} from './years/r4'
export * from './years/r4'

export const splitConstraints = constraints => {
  const constraintMap = constraints.reduce((acc, curr) => {
    acc[curr.name] = curr
    return acc
  }, {})

  const hardRestrictions = constraints.filter(c => c.type === "hard").map(c => c.name)
  const softRestrictions = constraints.filter(c => c.type === "soft").map(c => c.name)
  const preferToWorkFilters = constraints.filter(c => c.type === "prefer").map(c => c.name)

  return {
    hardRestrictions,
    softRestrictions,
    preferToWorkFilters,
    constraintMap,
  }
}

export const { constraintMap, hardRestrictions } = splitConstraints(constraints)

const _getUnrestrictedResidents = constraintMap => restrictions => (residents, holidays) => day => shift =>
  residents.filter(
    resident => restrictions.every(
      restriction => constraintMap[restriction].fn(resident, holidays)(day)(shift)
    )
  )
export const getUnrestrictedResidents = _getUnrestrictedResidents(constraintMap)

const _getConstraintsForResidents = constraintMap => restrictions => (residents, holidays) => day => shift =>
  Object.fromEntries(residents.map(resident =>
    [
      resident.name,
      Object.fromEntries(restrictions.map(restriction =>
        [
          constraintMap[restriction].msg,
          constraintMap[restriction].fn(resident, holidays)(day)(shift)
        ]
      ))
    ]
  ))
export const getConstraintsForResidents = _getConstraintsForResidents(constraintMap)

export const getFlatListOfShifts = shifts =>
  shifts.map(shift => {
    const neededShifts = Object.keys(shift).filter(k => k !== "date" && shift[k] === "1")
    return neededShifts.map(shiftName => ({
      date: shift.date,
      shift: shiftName,
    }))
  }).flat()

export const getUnfilledShifts = shifts => assignedShifts => shifts.filter(s => assignedShifts[s.date][s.shift] === undefined)

export const getAllUnrestrictedResidentsPerShift = flatShifts => restrictions => (residents, holidays) =>
  flatShifts.map(shift => ({
      date: shift.date,
      shift: shift.shift,
      availableResidents: getUnrestrictedResidents(restrictions)(residents, holidays)(shift.date)(shift.shift),
  }))

const metadata = (residents, holidays) => (shift, name) => ({
  numTotalShifts: countShifts(residents.find(res => res.name === name))("all"),
  numSpecificShifts: countShifts(residents.find(res => res.name === name))(shift),
  totalDifficulty: getTotalDifficulty(holidays)(residents.find(res => res.name === name)),
})

const _splitResidents = constraints => (residents, holidays) => date => shift => {
  const {
    hardRestrictions,
    softRestrictions,
    preferToWorkFilters,
  } =  splitConstraints(constraints)

  const hardConstraints = getConstraintsForResidents(hardRestrictions)(residents, holidays)(date)(shift)
  const softConstraints = getConstraintsForResidents(softRestrictions)(residents, holidays)(date)(shift)
  const preferred = getConstraintsForResidents(preferToWorkFilters)(residents, holidays)(date)(shift)

  const hardRestricted = Object.keys(hardConstraints).map(name => ({
    name,
    constraints: Object.keys(hardConstraints[name]).filter(k => !hardConstraints[name][k]),
    ...metadata(residents, holidays)(shift, name),
  })).filter(o => o.constraints.length > 0)
  const hardRestrictedNames = hardRestricted.map(o => o.name)

  const softRestricted = Object.keys(softConstraints).map(name => ({
    name,
    constraints: Object.keys(softConstraints[name]).filter(k => !softConstraints[name][k]),
    ...metadata(residents, holidays)(shift, name),
  })).filter(o => o.constraints.length > 0 && hardRestrictedNames.find(q => q === o.name) === undefined)
  const softRestrictedNames = softRestricted.map(o => o.name)

  const preferredToWork = Object.keys(preferred).map(name => ({
    name,
    preferred: Object.keys(preferred[name]).filter(k => preferred[name][k]),
    ...metadata(residents, holidays)(shift, name),
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
  ).map(r => ({
    name: r.name,
    constraints: [],
    ...metadata(residents, holidays)(shift, r.name),
  }))

  preferredToWork.sort((a, b) => a.totalDifficulty - b.totalDifficulty)
  neutral.sort((a, b) => a.totalDifficulty - b.totalDifficulty)
  softRestricted.sort((a, b) => a.totalDifficulty - b.totalDifficulty)
  hardRestricted.sort((a, b) => a.totalDifficulty - b.totalDifficulty)

  return {
    preferredToWork,
    neutral,
    softRestricted,
    hardRestricted,
  }
}

export const splitResidents = _splitResidents(constraints)

export const countShifts = resident => shift => {
  if (shift === "all") {
    return resident.assignedShifts.length
  }
  return resident.assignedShifts.filter(s => s.shift === shift).length
}

