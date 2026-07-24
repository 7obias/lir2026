import { useEffect, useMemo, useState } from 'react'

export type TimeMode = 'live' | 'simulated'

export type ActiveTimeState = {
  mode: TimeMode
  simulatedDateTime?: string
}

const DEFAULT_SIMULATED_TIME = '2026-07-30T22:00'

export function pragueLocalInputToDate(value: string): Date {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!match) return new Date(Number.NaN)

  const [, year, month, day, hour, minute] = match
  const targetAsUtc = Date.UTC(+year, +month - 1, +day, +hour, +minute)
  let guess = targetAsUtc

  for (let pass = 0; pass < 2; pass += 1) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Prague',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date(guess))
    const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value)
    const shownAsUtc = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'))
    guess += targetAsUtc - shownAsUtc
  }

  return new Date(guess)
}

export function formatPragueDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Prague',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${value('day')} ${value('month')} ${value('hour')}:${value('minute')}`
}

export function useActiveTime() {
  const [timeState, setTimeState] = useState<ActiveTimeState>({
    mode: 'live',
    simulatedDateTime: DEFAULT_SIMULATED_TIME,
  })
  const [liveNow, setLiveNow] = useState(() => new Date())

  useEffect(() => {
    if (timeState.mode !== 'live') return
    const timer = window.setInterval(() => setLiveNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [timeState.mode])

  const activeTime = useMemo(
    () => timeState.mode === 'simulated'
      ? pragueLocalInputToDate(timeState.simulatedDateTime ?? DEFAULT_SIMULATED_TIME)
      : liveNow,
    [liveNow, timeState],
  )

  const activateLive = () => {
    setLiveNow(new Date())
    setTimeState((current) => ({ ...current, mode: 'live' }))
  }

  return { activeTime, timeState, setTimeState, activateLive }
}
