import React from 'react'
import { useState } from 'react'

import { TiUserAdd, TiWaves } from "react-icons/ti"

import { useEngine, useEngineDispatch } from '../engine/context'
import styles from './assigner.module.css'

const Assigner = ({ date, shift }) => {
  const { assignedShifts, focusedResident, focusedDate, focusedShift } = useEngine()
  const dispatch = useEngineDispatch()

  const workingResident = assignedShifts[date.toISO()] && assignedShifts[date.toISO()][shift]

  const setFocusDateAndShift = (date, shift) => () => {
    dispatch({
    type: "setFocusDateAndShift",
    data: {
      date: date,
      shift: shift,
    }})
  }

  //if focused date and shift, replace button with __
  if (date == focusedDate && shift == focusedShift) {
    return <div className={styles.parent}><TiWaves/></div>
  }

  return <button
    onClick={setFocusDateAndShift(date, shift)}
    className={styles.add}
  >
      { workingResident !== undefined
        ? <div className={workingResident === focusedResident ? styles.active : ""}>{ workingResident }</div>
        : <TiUserAdd/>
      }
  </button>
}

export default Assigner
