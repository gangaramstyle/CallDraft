import React, { useRef } from 'react'
import { DateTime } from 'luxon'

import { useEngine, residentsView, useEngineDispatch } from '../context'
import { useOnClickOutside } from '../react-utils'
import {
  splitResidents,
} from '../restrictions'

import styles from './picker.module.css'

const Picker = ({ assigned, date, shift }) => {
  const engine = useEngine()
  const { holidays } = engine
  const residents = residentsView(engine)
  const dispatch = useEngineDispatch()

  const nullFocusDateAndShift = () => {
    dispatch({
    type: "setFocusDateAndShift",
    data: {
      date: null,
      shift: null,
    }})
  }

  const ref = useRef()
  useOnClickOutside(ref, () => nullFocusDateAndShift())

  const {preferredToWork, neutral, softRestricted, hardRestricted} = splitResidents(residents, holidays)(date)(shift)

  const assignResident = name => () => {
      dispatch({
      type: "assignShift",
      data: {
        name: name,
        shift,
        date,
      }})
      nullFocusDateAndShift()
    }

  return <div ref={ref} className={styles.picker}>
      <h3>
        {date.toLocaleString(DateTime.DATE_HUGE)} – { shift }
      </h3>
        { assigned &&
          <div>
            assigned: { assigned } &nbsp;
            <button onClick={() => dispatch({ type: "clearShift", data: { date, shift }})}>
              clear
            </button>
          </div>
        }
      <div className={styles.container}>
          <h4>Prefer to work</h4>
          <div className={styles.preferred}>
            { preferredToWork.map(r => <Resident
              key={r.name}
              name={r.name}
              constraints={r.preferred}
              assign={assignResident(r.name)}
              numTotalShifts={r.numTotalShifts}
              numSpecificShifts={r.numSpecificShifts}
              totalDifficulty={r.totalDifficulty}
            />)}
          </div>
          <h4>Neutral</h4>
          <div className={styles.neutral}>
            { neutral.map(r => <Resident
              key={r.name}
              name={r.name}
              constraints={r.constraints}
              assign={assignResident(r.name)}
              numTotalShifts={r.numTotalShifts}
              numSpecificShifts={r.numSpecificShifts}
              totalDifficulty={r.totalDifficulty}
            />)}
          </div>
          <h4>Preferred not</h4>
          <div className={styles.soft_restricted}>
              { softRestricted.map(r => <Resident
                key={r.name}
                name={r.name}
                constraints={r.constraints}
                assign={assignResident(r.name)}
                numTotalShifts={r.numTotalShifts}
                numSpecificShifts={r.numSpecificShifts}
                totalDifficulty={r.totalDifficulty}
              />)}
          </div>
          <h4> Restricted </h4>
          <div className={styles.hard_restricted}>
              { hardRestricted.map(r => <Resident
                name={r.name}
                constraints={r.constraints}
                assign={assignResident(r.name)}
                numTotalShifts={r.numTotalShifts}
                numSpecificShifts={r.numSpecificShifts}
                totalDifficulty={r.totalDifficulty}
              />)}
          </div>
      </div>
  </div>
}

const Resident = ({ name, constraints, assign, numTotalShifts, numSpecificShifts, totalDifficulty }) => {

  const dispatch = useEngineDispatch()

  const setFocusResident = name => () => {
      dispatch({
      type: "setFocusResident",
      data: {
        name: name,
      }})
    }

  return <div
    className={styles.resident}
    onMouseEnter={setFocusResident(name)}
    onMouseLeave={setFocusResident(null)}>
    <button
      onClick={assign}
    >
      {name}
    </button>
    <div className={styles.values}>
      {numSpecificShifts} | {numTotalShifts}
      <span
        className={styles.difficulty}
        style={{ [`--ratio`]: `${totalDifficulty/19}` }}
      >
          {totalDifficulty.toFixed(2)}
      </span>
    </div>
    <div className={styles.constraints}>
      { constraints.map(c =>
        <span> {c} </span>
      )}
    </div>
</div>
}


export default Picker
