import { union } from 'lodash';

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
 * @returns {*} a list [paddedlowerbound, paddedupperbound] : moves upper bound up and lower bound down (leaves 0 as it is).
 */
export function padDomain(domain) {
    const paddingFactor = 0.4;
    return domain.map(d => d !== 0 ? d * (1 + paddingFactor) : 0);
}
