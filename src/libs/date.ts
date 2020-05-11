import { set, setDay, isPast, addBusinessDays, addDays, addWeeks, addMonths, addYears, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { Localization } from '../localization';

import logger from '../utils/logger';

const dateNames = {  // can depend on locale, can be fetched from CONFIG
  weekshort: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  weeklong: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  weekday: ''
};

dateNames.weekday = `(${dateNames.weekshort.join('|')})\\b|(${dateNames.weeklong.join('|')})`;

const parseHumanDate = function(input: string): Date | undefined {
  // const weekday: string = '(mon|fri|sun)(\\b|day)|tue(sday)?|wed(nesday)?|thu(rsday)?|sat(urday)?';
  const periods = ['day', 'week', 'month', 'year'];
  const addFuncs: Array<Function> = [addDays, addWeeks, addMonths, addYears];
  const startFuncs: Array<Function> = [startOfDay, startOfWeek, startOfMonth, startOfYear];
  const options = { weekStartsOn: 1 } as const;  // fetch from CONFIG
  // this would've been neat but TypeScript doesn't like it
  //const add_funcs: Array<Function> = periods.map(p => datefns[`add${this.capitalize(p)}s`]);

  let matchArray;
  let parsedDate: Date;
  const now: Date = new Date();
  const today: Date = set(now, { hours: 18, minutes: 0, seconds: 0, milliseconds: 0});  // fetch from config
  //parsedDate = datefns.set(parsedDate, { hours: 18, minutes: 0, seconds: 0 });

  // case 1: next <period>|<weekday>
  // case 1a: next <period>
  const case1a: RegExp = new RegExp(`next (${periods.join('|')})`, 'gi');
  if (matchArray = case1a.exec(input)) {
    logger.debug(matchArray);
    logger.debug('case 1a: next <period>');
    const periodIndex: number = periods.indexOf(matchArray[1]);
    parsedDate = startFuncs[periodIndex](now, options);
    parsedDate = addFuncs[periodIndex](parsedDate, 1);
    // should there be a modifier to indicate the requirement of a business day ?
    // some syntax to allow the user to choose if he wants a business day or any day ?
    return getNextBusinessDay(parsedDate);
  }

  // case 1b: next <weekday>
  const case1b: RegExp = new RegExp(`next (${dateNames.weekday})`, 'gi');
  if (matchArray = case1b.exec(input)) {
    logger.debug(matchArray);
    logger.debug('case 1b: next <weekday>');
    const weekdayIndex = getWeekdayIndex(matchArray[1]);
    parsedDate = startOfWeek(today);
    //parsedDate = datefns.addWeeks(parsedDate, 1);
    parsedDate = addDays(parsedDate, 7 + weekdayIndex);
    return parsedDate;
  }


  // case 2: in <num> period(s)
  const case2: RegExp = new RegExp(`in (\\d+) (${periods.join('|')})s?`, 'gi');
  parsedDate = new Date();  // get fresh date and time
  if (matchArray = case2.exec(input)) {
    logger.debug(matchArray);
    logger.debug('case 2: in <x> <period>');
    const num: number = parseInt(matchArray[1]);
    const periodIndex: number = periods.indexOf(matchArray[2]);
    parsedDate = addFuncs[periodIndex](parsedDate, num);
    return parsedDate;
  }


  // case 3: today/tonight/tomorrow/weekday
  // case 3a: today/tonight/tomorrow
  if (input == 'today' || input == 'tomorrow' || input == 'tonight') {
    logger.debug('case 3a: today/tonight/tomorrow');
    if (input == 'tomorrow') {
      parsedDate = addDays(today, 1);
    } else if (input == 'tonight') {
      parsedDate = set(today, { hours: 21 });  // fetch from config
    } else {
      parsedDate = today;
    }
    return parsedDate;
  }

  // case 1b: <weekday>
  const case3b: RegExp = new RegExp(`^\\s*${dateNames.weekday}\\s*$`, 'gi');
  if (matchArray = case3b.exec(input)) {
    logger.debug(matchArray);
    logger.debug('case3b: <weekday>');
    const weekdayIndex: number = getWeekdayIndex(matchArray[0]);
    parsedDate = setDay(today, weekdayIndex);
    // if past, get day in next week for same weekday
    // might be a problem if user uses weekday name instead of today,
    // safe to assume duedate always in future ?
    if (isPast(parsedDate)) {
      parsedDate = addDays(parsedDate, 7);
    }
    return parsedDate;
  }

  return undefined;
};

const getWeekdayIndex = function(weekday: string): number {
  let weekdayIndex: number;
  if (weekday.length == 3) {  // short weekday (might need to change based on locale)
    weekdayIndex = dateNames.weekshort.indexOf(weekday);
  } else {  // full weekday
    weekdayIndex = dateNames.weeklong.indexOf(weekday);
  }
  return weekdayIndex;
};

const getNextBusinessDay = function(day: Date): Date {
  const businessDay: Date = addBusinessDays(day, 0);
  if (businessDay != day) console.info('(adjusted for business day)');
  return businessDay;
};

export const parseDate = function(input: string, format: string): Date {
  format = format || 'yyyy-mm-dd HH:MM'; // Default format
  let humanDate: Date | undefined = parseHumanDate(input);
  if (humanDate) {  // successfully parsed as human date
    return humanDate;
  }
  let parts: Array<number>;
  try {
    parts = input.match(/(\d+)/g)!.map((item: string) => {
      return parseInt(item, 10);
    });
  } catch (error) {
    throw new Error('Cant parse to date');
  }

  const fmt: any = {};
  let i = 0;
  let date;

  // Extract date-part indexes from the format
  format.replace(/(yyyy|dd|mm|HH|MM|SS)/g, (part: string) => {
    fmt[part] = i++;
    return part;
  });

  // Some simple date checks
  if (parts[fmt.dd] < 1 || parts[fmt.dd] > 31 || parts[fmt.yyyy] < 0 || parts[fmt.mm] < 1 || parts[fmt.mm] > 12) {
    throw new Error('Cant parse to date');
  }

  try {
    date = new Date(parts[fmt.yyyy], parts[fmt.mm] - 1, parts[fmt.dd]);
  } catch (error) {
    throw new Error('Cant parse to date');
  }

  if (parts[fmt.HH]) {
    date.setHours(parts[fmt.HH]);
    if (parts[fmt.MM]) {
      date.setMinutes(parts[fmt.MM]);
      if (parts[fmt.SS]) {
        date.setSeconds(parts[fmt.SS]);
      }
    }
  }

  return date;
};

export const getRelativeHumanizedDate = function(dueDate: Date, now?: Date): string {
  if (!now) now = new Date();

  // get date diff
  const diffTime: number = dueDate.getTime() - now.getTime();
  const diffSeconds: number = Math.ceil(diffTime / 1000);
  let unit = '';
  let value = 0;

  if (Math.abs(diffSeconds) < 60) {
    value = diffSeconds;
    unit = 'second';
  } else if (Math.abs(diffSeconds) < 60 * 60) {
    value = Math.round(diffSeconds / 60);
    unit = 'minute';
  } else if (Math.abs(diffSeconds) < 60 * 60 * 24) {
    value = Math.round(diffSeconds / (60 * 60));
    unit = 'hour';
  } else if (Math.abs(diffSeconds) < 60 * 60 * 24 * 7) {
    value = Math.round(diffSeconds / (60 * 60 * 24));
    unit = 'day';
  } else if (Math.abs(diffSeconds) < 60 * 60 * 24 * 30) {
    value = Math.round(diffSeconds / (60 * 60 * 24 * 7));
    unit = 'week';
  } else {
    value = Math.round(diffSeconds / (60 * 60 * 24 * 30));
    unit = 'month';
  }

  const absValue = Math.abs(value);
  unit = Localization.instance.get('date.units.' + unit, { type: absValue === 1 ? 0 : 1 });
  const humanizedDate = value >= 1 ? `${value} ${unit}` : `${absValue} ${unit}`;
  const humanizedRelativeDate = value >= 1 ? Localization.instance.getf('date.due_in', { params: [humanizedDate] }) : Localization.instance.getf('date.due_ago', { params: [humanizedDate] });
  return humanizedRelativeDate;
};
