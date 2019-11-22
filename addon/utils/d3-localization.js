import moment from 'moment';
import d3 from 'd3';

export function getTickFormat({ periods = ['AM', 'PM'], dayFormat = '%a %d', weekFormat = '%d %b', hourFormat = '%I %p', monthFormat = '%B', yearFormat = '%Y' }) {
    let locale = d3.timeFormatLocale({
        dateTime: '',
        date: '',
        time: '',
        periods,
        days: moment.weekdays(),
        shortDays: moment.weekdaysShort(),
        months: moment.months(),
        shortMonths: moment.monthsShort()
    });

    let formatHour = locale.format(hourFormat),
        formatDay = locale.format(dayFormat),
        formatWeek = locale.format(weekFormat),
        formatMonth = locale.format(monthFormat),
        formatYear = locale.format(yearFormat);

    return function (date) {
        return (d3.timeDay(date) < date ? formatHour
            : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
            : d3.timeYear(date) < date ? formatMonth
            : formatYear)(date);
    };
}
