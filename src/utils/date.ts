import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(buddhistEra)
dayjs.extend(relativeTime)
dayjs.locale('th')

export function today(): string {
  return dayjs().format('YYYY-MM-DD')
}

export function formatDate(date: string, format = 'DD-MM-YYYY'): string {
  return dayjs(date).format(format)
}

export function formatDateThai(date: string): string {
  return dayjs(date).format('D MMMM BBBB')
}

export function formatDateTime(date: string): string {
  return dayjs(date).format('DD-MM-YYYY HH:mm')
}

export function startOfWeek(): string {
  return dayjs().startOf('week').format('YYYY-MM-DD')
}

export function startOfMonth(): string {
  return dayjs().startOf('month').format('YYYY-MM-DD')
}

export function endOfMonth(): string {
  return dayjs().endOf('month').format('YYYY-MM-DD')
}

export function nDaysAgo(n: number): string {
  return dayjs().subtract(n, 'day').format('YYYY-MM-DD')
}

export function daysInRange(start: string, end: string): string[] {
  const days: string[] = []
  let current = dayjs(start)
  const endDay = dayjs(end)
  while (current.isBefore(endDay) || current.isSame(endDay, 'day')) {
    days.push(current.format('YYYY-MM-DD'))
    current = current.add(1, 'day')
  }
  return days
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} นาที`
  return `${h} ชม. ${m > 0 ? `${m} นาที` : ''}`
}

export function formatPace(pace: string): string {
  return pace ? `${pace} นาที/กม.` : '-'
}
