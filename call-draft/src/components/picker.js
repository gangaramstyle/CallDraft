import React, { useRef } from 'react'
import { DateTime } from 'luxon'
import { TiWaves } from 'react-icons/ti'

import { useEngine, residentsView, useEngineDispatch } from '../engine/context'
import { useOnClickOutside } from '../react-utils'
import {
  mapConstraintToMessage,
  splitResidents,
} from '../restrictions'

import styles from './picker.module.css'

const Picker = ({ assigned, date, shift, close }) => {
  const ref = useRef()
  const engine = useEngine()
  const residents = residentsView(engine)
  const dispatch = useEngineDispatch()

  useOnClickOutside(ref, close)
  const {preferredToWork, neutral, softRestricted, hardRestricted} = splitResidents(residents)(date)(shift)

  const assignResident = name => () => {
    const func = async () => dispatch({
      type: "assignShift",
      data: {
        name: name,
        shift,
        date,
      }})
    close()
    setTimeout(func, 10)
  }

  const clearShift = () => {
    const func = async () => dispatch({
      type: "clearShift",
      data: {
        shift,
        date,
      }})
    close()
    setTimeout(func, 10)
  }

  return <div className={styles.parent}>
    <TiWaves/>
    <div ref={ref} className={styles.picker}>
      <h3>{date.toLocaleString(DateTime.DATE_HUGE)} – { shift } { assigned && <span> – { assigned } <button onClick={clearShift}>Clear</button></span> } </h3>
      <div className={styles.container}>
        <div className={styles.left}>
          <h4>Prefer to work</h4>
          <div className={styles.preferred}>
            { preferredToWork.map(r => <Resident
              key={r.name}
              name={r.name}
              constraints={r.preferred}
              assign={assignResident(r.name)}
            />)}
          </div>
          <h4>Neutral</h4>
          <div className={styles.neutral}>
            { neutral.map(r => <Resident
              key={r.name}
              name={r.name}
              constraints={r.constraints}
              assign={assignResident(r.name)}
            />)}
          </div>
        </div>
        <div className={styles.right}>
          <h4>Preferred not</h4>
          <div className={styles.soft_restricted}>
              { softRestricted.map(r => <Resident
                key={r.name}
                name={r.name}
                constraints={r.constraints}
                assign={assignResident(r.name)}
              />)}
          </div>
          <h4> Restricted </h4>
          <div className={styles.hard_restricted}>
              { hardRestricted.map(r => <Resident
                key={r.name}
                name={r.name}
                constraints={r.constraints}
                assign={assignResident(r.name)}
              />)}
          </div>
        </div>
      </div>
    </div>
  </div>
}

const Resident = ({ name, constraints, assign }) =>
<div className={styles.resident}>
  <button
    onClick={assign}
  >
    {name}
  </button>
  <div className={styles.constraints}>
    { constraints.map(c =>
      <span key={c}> {mapConstraintToMessage[c]} </span>
    )}
  </div>
</div>

export default Picker
