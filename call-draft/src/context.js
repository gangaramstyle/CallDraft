import { createContext, useContext, useEffect } from 'react'
import { useImmerReducer } from 'use-immer'
import { freeze } from 'immer'

import { cleanResidentCSV, extractRotations } from './csv-handling'
import { sameDay, isHoliday, parseFormsDate } from './utils'

import Papa from 'papaparse'

import {
  yearName,
  requiredShiftsURL,
  residentAssignedScheduleUrl,
  residentPreferencesUrl,
} from './restrictions'

const assignedShiftsLocalStorageKey = `assignedShifts-${yearName}`
const assignedShiftsByResidentLocalStorageKey = `assignedShiftsByResident-${yearName}`

const EngineContext = createContext(null)
const EngineDispatchContext = createContext(null)

export const EngineProvider = ({ children }) => {
  const [engine, dispatch] = useImmerReducer(
    engineReducer,
    initialEngine,
  )

  useEffect(() => {
    // download shifts
    const downloadShifts = async () => {
      const data = await fetch(requiredShiftsURL)
        .then((r) => r.text())
        .then(t => Papa.parse(t, {header: true}).data)

      const parsedData = data
        .map(d => {
          const { Date: dateUpper, date: dateLower, ...rest } = d
          const raw = (dateLower || dateUpper || '').trim()
          if (!raw) return null
          const parsed = parseFormsDate(raw.replace(/^-\s*/, ''))
          if (!parsed || !parsed.isValid) return null
          return { ...rest, date: parsed }
        })
        .filter(Boolean)

      for (var i = 0; i < parsedData.length; i++) {
        let date = parsedData[i].date
        if (isHoliday(date)) {
          var holidayList = [date.toISODate()]

          // holiday falls on a Monday or Tuesday
          if (date.weekday < 3) {
            if (i > 0) { holidayList.push(parsedData[i - 1].date.toISODate()) }
            if (i > 1) { holidayList.push(parsedData[i - 2].date.toISODate()) }
          // holiday falls on a Thursday or Friday
          } else if (date.weekday > 3) {
            if (i < parsedData.length - 1) { holidayList.push(parsedData[i + 1].date.toISODate()) }
            if (i < parsedData.length - 2) { holidayList.push(parsedData[i + 2].date.toISODate()) }
          } else {
            console.log("Weird year. Holiday is on a Wednesday. Is that even a holiday?")
          }

          dispatch({
            type: "addHolidays",
            data: holidayList,
          })
        }
      }

      dispatch({
        type: "addRequiredShifts",
        data: freeze(parsedData),
      })
    }

    const downloadRotations = async () => {
      const data = await fetch(residentAssignedScheduleUrl)
        .then((r) => r.text())
        .then(t => Papa.parse(t, {header: true}).data)

      const parsedData = data.map(extractRotations)

      dispatch({
        type: "addRotations",
        data: parsedData,
      })
    }

    const downloadPreferences = async () => {
      const data = await fetch(residentPreferencesUrl)
        .then((r) => r.text())
        .then(t => Papa.parse(t, {header: true}).data)

      const parsedData = data.map(cleanResidentCSV)

      dispatch({
        type: "addPreferences",
        data: parsedData,
      })
    }

    downloadShifts()
      .then(downloadRotations)
      .then(downloadPreferences)
  }, [dispatch])

  const { assignedShifts, assignedShiftsByResident } = engine
  useEffect(() => {
    localStorage.setItem(assignedShiftsLocalStorageKey, JSON.stringify(assignedShifts));
    localStorage.setItem(assignedShiftsByResidentLocalStorageKey, JSON.stringify(assignedShiftsByResident));
  }, [assignedShifts, assignedShiftsByResident, dispatch]);

  return <EngineContext.Provider value={engine}>
    <EngineDispatchContext.Provider value={dispatch}>
      {children}
    </EngineDispatchContext.Provider>
  </EngineContext.Provider>
}

export const useEngine = () => useContext(EngineContext)
export const useEngineDispatch = () => useContext(EngineDispatchContext)

const engineReducer = (engine, action) => {
  switch (action.type) {

    case 'addRequiredShifts': {
      engine.requiredShifts = action.data
      break;
    }

    case 'addHolidays': {
      engine.holidays = engine.holidays.concat(action.data)
      break;
    }

    case 'addRotations': {
      engine.rotations = action.data
      break;
    }

    case 'addPreferences': {
      engine.preferences = action.data
      engine.residents = action.data
        .map(d => {
          const rot = engine.rotations.find(({ name }) => name === d.name)
          if (!rot) {
            console.warn(
              `[CallDraft] No rotation entry for resident "${d.name}" — dropping from draft. ` +
              `Fix the name in the rotation sheet (or the preferences sheet) so the two match.`
            )
            return null
          }
          return { ...d, ...rot }
        })
        .filter(Boolean)
      console.log(engine.residents)

      const { assignedShifts } = engine

      if (Object.keys(assignedShifts).length === 0) {
        resetAllShifts(engine)
      }
      break;
    }

    case 'assignShift': {
      clearShift(engine, action) // first remove all other residents who have the same shift
      engine.focusedResident = null
      const { date, shift, name } = action.data

      engine.assignedShiftsByResident[name].push({ date: date.toISO(), shift })

      engine.assignedShifts[date.toISO()][shift] = name
      break;
    }
    case 'clearShift': {
      clearShift(engine, action)
      break;
    }

    case 'resetShifts': {
      resetAllShifts(engine)
      break;
    }

    case 'setFocusDateAndShift': {
      engine.focusedDate = action.data.date
      engine.focusedShift = action.data.shift
      break;
    }

    case 'setFocusResident': {
      engine.focusedResident = action.data.name
      break;
    }

    default: {
      throw Error('Unknown action: ' + action.type)
    }
  }
}


const initialEngine = {
  requiredShifts: [],
  rotations: [],
  preferences: [],
  residents: [],
  holidays: [],

  focusedShift: null,
  focusedDate: null,
  focusedResident: null,

  assignedShifts: JSON.parse(localStorage.getItem(assignedShiftsLocalStorageKey)) || {},
  assignedShiftsByResident: JSON.parse(localStorage.getItem(assignedShiftsByResidentLocalStorageKey)) || {},
}

// reducers

const clearShift = (engine, action) => {
  const { date, shift } = action.data

  Object.keys(engine.assignedShiftsByResident).forEach(k => {
    engine.assignedShiftsByResident[k] = engine.assignedShiftsByResident[k].filter(s => !(sameDay(s.date, date) && shift === s.shift))
  })

  delete engine.assignedShifts[date.toISO()][shift]
}

const resetAllShifts = engine => {

  const { residents, requiredShifts } = engine

  residents.forEach(r => {
    engine.assignedShiftsByResident[r.name] = []
  })

  engine.assignedShifts = Object.fromEntries(requiredShifts.map(s => [
    s.date.toISO(),
    Object.fromEntries(Object.keys(s).map(k =>[k, undefined]))
  ]))

}

// views
export const residentsView = ({ residents, assignedShiftsByResident }) => residents.map(r => ({
  ...r,
  assignedShifts: assignedShiftsByResident[r.name],
}))
