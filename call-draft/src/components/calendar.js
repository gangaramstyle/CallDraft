import React from 'react'
import { DateTime } from 'luxon'

import { useEngine } from '../engine/context'

import Assigner from './assigner'

import styles from './calendar.module.css'

import { weekNumber } from '../utils'

const Calendar = () => {
  const { requiredShifts } = useEngine()

  if (!requiredShifts || requiredShifts.length === 0) {
    return null
  }

  return <table className={styles.table}>
    <thead>
      <tr>
        { Object.keys(requiredShifts[0]).map(k => <th key={k}>{k}</th>)}
      </tr>
    </thead>
    <tbody>
      { requiredShifts.map(r => <Row key={r.date.toMillis()} row={r} />) }
    </tbody>
  </table>
}

const Row = ({ row }) => {
  return <tr
    className={ (weekNumber(row["date"]) % 2) === 1 ? styles.odd : styles.even }
  >
    {
      Object.keys(row).map(k => <Cell
        key={k}
        // TODO: make the names of each prop much more clear. Making some bad assumptions here
        date={row["date"]}
        shift={k}
        render={row[k]}
      />)
    }
  </tr>
}

const Cell = ({ date, shift, render }) => {
  if (shift === "date") {
    return <td className={styles.date}>
      {render.toLocaleString(DateTime.DATE_HUGE)}
    </td>
  }
  if(render === "0") {
    return <td/>
  }

  return <td>
    <Assigner date={date} shift={shift}/>
  </td>
}

export default Calendar
