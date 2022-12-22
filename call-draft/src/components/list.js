import React, { useState, useEffect, useCallback } from 'react'
import { DateTime } from 'luxon'

import { useEngine, residentsView } from '../engine/context'
import {
  getFlatListOfShifts,
  getAllUnrestrictedResidentsPerShift,
  getUnfilledShifts,
  hardRestrictions,
} from '../restrictions'

import styles from './list.module.css'

const List = () => {
  const engine = useEngine()

  const [sortedShiftsNeeded, setSortedShiftsNeeded] = useState([])

  const refresh = useCallback(async set => {
    const { requiredShifts, assignedShifts } = engine
    const flatShifts = getFlatListOfShifts(requiredShifts)
    const unfilledShifts = getUnfilledShifts(flatShifts)(assignedShifts)
    const residents = residentsView(engine)
    const shiftsNeeded = getAllUnrestrictedResidentsPerShift(unfilledShifts)(hardRestrictions)(residents)
    shiftsNeeded.sort((a, b) => a.availableResidents.length - b.availableResidents.length)

    setSortedShiftsNeeded(shiftsNeeded)
  }, [engine])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (sortedShiftsNeeded === undefined) {
    return <div/>
  }

  return <div className={styles.list}>
    {
      sortedShiftsNeeded.map(s => <div key={`${s.date.toMillis()}-${s.shift}`}>
        {s.availableResidents.length} – {s.date.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)} – {s.shift}
      </div>)
    }

  </div>
}

export default List
