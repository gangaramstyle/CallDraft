import React from 'react'

import { useEngine, residentsView } from '../context'
import { isPartOfHolidayWeekend } from '../utils'
import {
  countShifts,
  getTotalDifficulty,
} from '../restrictions'

import styles from './tally.module.css'

const Tally = () => {
  const engine = useEngine()
  const { requiredShifts, holidays } = engine
  const residents = residentsView(engine)

  if (!requiredShifts || requiredShifts.length === 0) {
    return null
  }

  const shiftNames = Object.keys(requiredShifts[0]).filter(k => k !== "date")

  residents.sort((a, b) => a.name.localeCompare(b.name))

  return <div className={styles.tally}>
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Resident</th>
          { shiftNames.map(k => <th key={k}>{k}</th>)}
          <th># Shifts</th>
          <th>Difficulty</th>
        </tr>
      </thead>
      <tbody>
        { residents.map(r => <Row
          key={r.name}
          resident={r}
          holidays={holidays}
          shiftNames={shiftNames}
          shifts={r.assignedShifts}
        />) }
      </tbody>
    </table>
  </div>
}

const Row = ({ resident, shiftNames, shifts, holidays }) => {

  const { focusedResident } = useEngine()

  const counts = shifts.reduce((obj, s) => {
    const count = obj[s.shift] === undefined ? 0 : obj[s.shift]
    if (!isPartOfHolidayWeekend(holidays)(s.date)) {
      obj[s.shift] = count + 1
    }
    return obj
  }, {})
  const holidayCounts = shifts.reduce((obj, s) => {
    const count = obj[s.shift] === undefined ? 0 : obj[s.shift]
    if (isPartOfHolidayWeekend(holidays)(s.date)) {
      obj[s.shift] = count + 1
    }
    return obj
  }, {})
  const totalDifficulty = getTotalDifficulty(holidays)(resident)
  return <tr className={resident.name === focusedResident ? styles.active : ""}>
    <td className={styles.resident}>{resident.name}</td>
    { shiftNames.map(sn =>
      <td>
        <span>
          { counts[sn] === undefined ? 0 : counts[sn] }
        </span>
        <span className={holidayCounts[sn] === undefined ? styles.noholiday : styles.holiday}>
          { holidayCounts[sn] === undefined ? "0H" : `${holidayCounts[sn]}H` }
        </span>
      </td>
    )}
      <td>
        { countShifts(resident)("all") }
      </td>
      <td className={styles.difficulty} style={{ [`--ratio`]: `${totalDifficulty/19}` }}>
        { totalDifficulty.toFixed(2) }
      </td>
  </tr>
}

export default Tally
