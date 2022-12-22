import React from 'react'
import { useState } from 'react'

import { TiUserAdd } from "react-icons/ti"

import { useEngine } from '../engine/context'
import styles from './assigner.module.css'

import Picker from './picker'

const Assigner = ({ date, shift }) => {
  const [open, setOpen] = useState(false)
  const { assignedShifts } = useEngine()

  const workingResident = assignedShifts[date.toISO()] && assignedShifts[date.toISO()][shift]

  if (open) {
    return <Picker
      assigned={workingResident}
      date={date}
      shift={shift}
      close={async () => setOpen(false)}
    />
  }

  return <button
    onClick={() => setOpen(true)}
    className={styles.add}
  >
      { workingResident !== undefined
        ? workingResident
        : <TiUserAdd/>
      }
  </button>
}

export default Assigner
