import { A } from '@ember/array';

/**
 * function to add custom ticks to the chart.
 * @param {Object} chart is the chart being referred - column-chart, barchart.
 * @param {Array[number]} domain the un-padded domain.
 * @param {Array[number]} otherTicks also add other ticks along with domain ticks because existing ticks are overwritten.
 */
export function addDomainTicks(chart, domain, otherTicks = []) {
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

    yAxisTicks.tickValues(A([...domain, ...otherTicks]).uniq());
}

/**
 * Adds extra padding to the domain to accomodate datavalues and min/max indicator on top of the bars/columns.
 * @param {Array[number]} domain is a alist : [upperbound, lowerbound]
 * @returns {Array[number]} a list [paddedlowerbound, paddedupperbound] : moves upper bound up and lower bound down (leaves 0 as it is).
 */
export function padDomain(domain) {
    const paddingFactor = 0.6;
    return domain.map(d => d * (1 + paddingFactor));
}
