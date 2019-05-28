import { zip, union } from 'lodash';

/**
 * function to add custom ticks to the chart.
 * @param {*} chart is the chart being referred - column-chart, barchart.
 * @param {*} domain the un-padded domain.
 * @param {*} otherTicks also add other ticks along with domain ticks because existing ticks are overwritten.
 */
export function addDomainTicks(chart, domain, otherTicks = undefined) {
    if (!chart || !domain) {
        return;
    }

    const yAxis = chart.yAxis && chart.yAxis();
    if (!yAxis) {
        return;
    }

    const yAxisTicks = yAxis.ticks && yAxis.ticks();

    if (!yAxisTicks) {
        return;
    }

    otherTicks = otherTicks || [];
    yAxisTicks.tickValues(union(domain, otherTicks));
}

/**
 * Adds extra padding to the domain to accomodate datavalues and min/max indicator on top of the bars/columns.
 * @param {*} domain is a alist : [upperbound, lowerbound]
 * @returns {*} an object {actualDomain: [lowerbound, upper], paddedDomain: [paddedlowerbound, paddedupperbound]}
 */
export function padDomain(domain) {
    return zip(domain, ['lower', 'upper']).map(([d, indicator]) => {
        const domainPadding = Math.abs(d) * .4;
        /* if the value is an upper bound then -
                if the value is negative then add negative padding.
                else add positive padding
            if the value is lower bound then -
                if the value is negative then add a negative padding.
                else dont add padding because then the bars/columns won't start from zero, they will start from paddded value (undesirable).
        */
        return indicator === 'upper' ? (d < 0 ? d - domainPadding : d + domainPadding) : (d < 0 ? d - domainPadding : d);
    });
}
