import { DateTime } from 'luxon'

export const parseFormsDate = d => DateTime.fromFormat(
    d.replace(" ", "").replace("[", "").replace("]", ""),
    "M/d/yyyy")

export const coerceLuxon = d => typeof d === "string" ? DateTime.fromISO(d) : d

export const coerceLuxonWrapper = f => d => f(coerceLuxon(d))

export const sameDay = (d1, d2) => coerceLuxon(d1).hasSame(coerceLuxon(d2), "day")

export const standardDate = d => DateTime.fromISO(d.toISOString().substring(0, 10))

// get Saturday prior to given day
// if current date is a Saturday, return the same Saturday
export const getPriorSaturday = coerceLuxonWrapper(day => day.minus({days: mod(day.weekday - 6, 7) }))

// get Sunday prior to given day
// if current date is a Sunday, return the same Sunday
export const getPriorSunday = coerceLuxonWrapper(day => day.minus({days: mod(day.weekday - 7, 7) }))

// get Saturday after given day
// if given day is a Sunday, return the same Sunday
export const getNextSaturday = coerceLuxonWrapper(day => day.plus({days: 6 - day.weekday}))

// get Sunday after given day
// if given day is a Sunday, return the same Sunday
export const getNextSunday = coerceLuxonWrapper(day => day.plus({days: 7 - day.weekday}))

// get day prior to given day
// if day is the same as the given day, return the same day
export const getPriorXDay = (day, xDay) => coerceLuxon(day.minus({days: mod(day.weekday - xDay, 7) }))

// get day after the given day
// if day is the same as the given day, give the day the next week
export const getNextXDay = (day, xDay) => coerceLuxon(day.plus({days: 7 - mod(day.weekday - xDay, 7) }))

export const mod = function (n, m) {
  // mod function that handles negative numbers, usage: mod(num, modulous)
  return ((n % m) + m) % m;
}

export const isHoliday = coerceLuxonWrapper(day => day.weekday !== 6 && day.weekday !== 7)

export const isPartOfHolidayWeekend = (holidays) => coerceLuxonWrapper(day => {
  return holidays.includes(`${day.c.year}-${day.c.month.toString().padStart(2, "0")}-${day.c.day.toString().padStart(2, "0")}`)
})

export const weekNumber = coerceLuxonWrapper(day =>
  day.weekday < 4
  ? day.weekNumber - 1
  : day.weekNumber
)

