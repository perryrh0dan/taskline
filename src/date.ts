import * as datefns from 'date-fns';

import { Renderer } from './renderer';

export class DateParser {
  private static _instance: DateParser
  private dateNames: { weekshort: Array<string>, weeklong: Array<string>, weekday?: string };

  public static get instance(): DateParser {
    if (!this._instance) {
      this._instance = new DateParser();
    }

    return this._instance;
  }

  private constructor() {
    this.dateNames = {  // can depend on locale, can be fetched from CONFIG
      weekshort: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      weeklong: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    };
    this.dateNames.weekday = `(${this.dateNames.weekshort.join('|')})\\b|(${this.dateNames.weeklong.join('|')})`;
  }

  private parseHumanDate(input: string): Date | undefined {
    // const weekday: string = '(mon|fri|sun)(\\b|day)|tue(sday)?|wed(nesday)?|thu(rsday)?|sat(urday)?';
    const periods = ['day', 'week', 'month', 'year'];
    const addFuncs: Array<Function> = [datefns.addDays, datefns.addWeeks, datefns.addMonths, datefns.addYears];
    const startFuncs: Array<Function> = [datefns.startOfDay, datefns.startOfWeek, datefns.startOfMonth, datefns.startOfYear];
    const options = { weekStartsOn: 1 } as const;  // fetch from CONFIG
    // this would've been neat but TypeScript doesn't like it
    //const add_funcs: Array<Function> = periods.map(p => datefns[`add${this.capitalize(p)}s`]);

    let matchArray;
    let parsedDate: Date;
    const now: Date = new Date();
    const today: Date = datefns.set(now, { hours: 18, minutes: 0, seconds: 0 });  // fetch from config
    //parsedDate = datefns.set(parsedDate, { hours: 18, minutes: 0, seconds: 0 });

    // case 1: next <period>|<weekday>
    // case 1a: next <period>
    const case1a: RegExp = new RegExp(`next (${periods.join('|')})`, 'gi');
    if (matchArray = case1a.exec(input)) {
      // console.log(matchArray);
      console.log('case 1a: next <period>');
      const periodIndex: number = periods.indexOf(matchArray[1]);
      parsedDate = startFuncs[periodIndex](now, options);
      parsedDate = addFuncs[periodIndex](parsedDate, 1);
      // should there be a modifier to indicate the requirement of a business day ?
      // some syntax to allow the user to choose if he wants a business day or any day ?
      return this.getNextBusinessDay(parsedDate);
    }

    // case 1b: next <weekday>
    const case1b: RegExp = new RegExp(`next (${this.dateNames.weekday})`, 'gi');
    if (matchArray = case1b.exec(input)) {
      // console.log(matchArray);
      console.log('case 1b: next <weekday>');
      const weekdayIndex = this.getWeekdayIndex(matchArray[1]);
      parsedDate = datefns.startOfWeek(today);
      //parsedDate = datefns.addWeeks(parsedDate, 1);
      parsedDate = datefns.addDays(parsedDate, 7 + weekdayIndex);
      return parsedDate;
    }


    // case 2: in <num> period(s)
    const case2: RegExp = new RegExp(`in (\\d+) (${periods.join('|')})s?`, 'gi');
    parsedDate = new Date();  // get fresh date and time
    if (matchArray = case2.exec(input)) {
      // console.log(matchArray);
      console.log('case 2: in <x> <period>');
      const num: number = parseInt(matchArray[1]);
      const periodIndex: number = periods.indexOf(matchArray[2]);
      parsedDate = addFuncs[periodIndex](parsedDate, num);
      return parsedDate;
    }


    // case 3: today/tonight/tomorrow/weekday
    // case 3a: today/tonight/tomorrow
    if (input == 'today' || input == 'tomorrow' || input == 'tonight') {
      console.log('case 3a: today/tonight/tomorrow');
      if (input == 'tomorrow') {
        parsedDate = datefns.addDays(today, 1);
      } else if (input == 'tonight') {
        parsedDate = datefns.set(today, { hours: 21 });  // fetch from config
      } else {
        parsedDate = today;
      }
      return parsedDate;
    }

    // case 1b: <weekday>
    const case3b: RegExp = new RegExp(`^\\s*${this.dateNames.weekday}\\s*$`, 'gi');
    if (matchArray = case3b.exec(input)) {
      // console.log(matchArray);
      console.log('case3b: <weekday>');
      const weekdayIndex: number = this.getWeekdayIndex(matchArray[0]);
      parsedDate = datefns.setDay(today, weekdayIndex);
      // if past, get day in next week for same weekday
      // might be a problem if user uses weekday name instead of today,
      // safe to assume duedate always in future ?
      if (datefns.isPast(parsedDate)) {
        parsedDate = datefns.addDays(parsedDate, 7);
      }
      return parsedDate;
    }

    return undefined;
  }

  private getWeekdayIndex(weekday: string): number {
    let weekdayIndex: number;
    if (weekday.length == 3) {  // short weekday (might need to change based on locale)
      weekdayIndex = this.dateNames.weekshort.indexOf(weekday);
    } else {  // full weekday
      weekdayIndex = this.dateNames.weeklong.indexOf(weekday);
    }
    return weekdayIndex;
  }

  private getNextBusinessDay(day: Date): Date {
    const businessDay: Date = datefns.addBusinessDays(day, 0);
    if (businessDay != day) console.info('(adjusted for business day)');
    return businessDay;
  }

  public parseDate(input: string, format: string): Date {
    format = format || 'yyyy-mm-dd HH:MM'; // Default format
    let humanDate: Date | undefined = this.parseHumanDate(input);
    if (humanDate) {  // successfully parsed as human date
      console.log('human date:', datefns.format(humanDate, 'PPPPp'));
      return humanDate;
    }
    let parts: Array<number>;
    try {
      parts = input.match(/(\d+)/g)!.map((item: string) => {
        return parseInt(item, 10);
      });
    } catch (error) {
      Renderer.instance.invalidDateFormat(input);
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
    if (parts[fmt.dd] < 1 || parts[fmt.dd] > 31 || parts[fmt.yyyy] < 0 || parts[fmt.mm] < 1 || parts[fmt.mm] > 12 ) {
      Renderer.instance.invalidDateFormat(input);
      throw new Error('Cant parse to date');
    }

    try {
      date = new Date(parts[fmt.yyyy], parts[fmt.mm] - 1, parts[fmt.dd]);
    } catch (error) {
      Renderer.instance.invalidDateFormat(input);
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
  }
}
