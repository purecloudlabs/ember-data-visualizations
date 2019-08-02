ember-data-visualizations
==============================================================================

Ember addon to support visualizations with dc.js (d3 & crossfiltering)

[![Build Status](https://travis-ci.org/purecloudlabs/ember-data-visualizations.svg?branch=master)](https://travis-ci.org/purecloudlabs/ember-data-visualizations)

Installation
------------------------------------------------------------------------------

```
ember install ember-data-visualizations
```


Usage
------------------------------------------------------------------------------

### All charts
All charts must have a group and a dimension. All charts use `d3-tip` (an npm package which can be found [here](https://github.com/Caged/d3-tip)) to create and style tooltips. 
See the dummy app for an example of each type of chart. The code for the dummy can be found in `tests/dummy`. In particular, `tests/dummy/controllers/application.js` and `tests/dummy/templates/application.hbs` will be useful in understanding the use of this addon.

##### Optional parameters
* `height` (number): height in pixels of the chart
* `colors` (Array): Hex strings to color the chart
* `showLegend` (boolean): Whether or not to show an interactive legend. Heatmaps do not have this option, however, as a heatmap doesn't make sense without a legend.
* `legendWidth` (number): width in pixels of the legend. Not applicable if `showLegend` is `false`. If not specified, defaults to 250.
* `isChartAvailable` (boolean, defaults to `true`): if `true`, shows normal view. If `false`, shows chart-not-available view.
* `chartNotAvailableMessage` (String): message to display on top of chart if `isChartAvailable` is false
* `chartNotAvailableTextColor` (String): Hexadecimal color value to color the text of `chartNotAvailableMessage`
* `chartNotAvailableColor`: (String): Hexadecimal color value to color the chart if `isChartAvailable` is false

All optional boolean parameters except `isChartAvailable` default to `false`.

### Column chart
The column chart uses an *array* of crossfilter groups to display different types of column charts (vertical bar charts). If there is only one group, *you must still pass an array of 1 group to the column chart*. This is true for many of the charts in this addon.

##### Required parameters
* `dimension`: crossfilter dimension to use for chart
* `group`: *array* of crossfilter groups to use for chart
* `xAxis` (Object): `domain` (Array, probably of `moment` objects) and `ticks` (number of ticks to show)

##### Optional parameters
* `yAxis` (Object): `domain` (Array, probably of numbers) (optional): autofits bars, `ticks` (number of ticks to show), and `formatter` (function to apply to every y-axis value for tick display), `bottomLabelPosition` (boolean): whether to display labels on the top, or on the bottom of x-axis.
* `type` (String) (defaults to `GROUPED`):
    * `GROUPED` is for "ordinary" data and is most likely what should be used if there is only one crossfilter group.
    * `LAYERED` is for "overlapping data: e.g. there are 10 fruits, 6 of which are citrus, 3 of which are oranges. If this chart is `LAYERED`, the `series` option tells the chart how to format the bars (hatching).
    * `STACKED` creates a stacked bar chart: e.g. there are 10 fruits, 20 vegetables, and 15 meats and we want to display them on top of each other.
* `series` (Array):  Each object in the array has properties:
    * `title`: the name of `this.get('group')` at the same index (used in tooltip creation)
    * `hatch`: `pos` (for a hatch from bottom left to top right), `neg` (for a hatch from top left to bottom right), or `false` (for no hatch)
* `labelOptions`(Object): display options for labels on top of bars/columns.
    * `showMaxMin` (boolean): whether or not to show max/min indicators for the maximum and minimum values of one of the groups on the column chart.
    * `showDataValues` (boolean): whether or not to display the y-value of each point above each bar.
    * `labelCollisionResolution` (string) ['auto' | 'default']: runs collision detection algorithm to determine if a label is too wide, and skips next labels accordingly.
* `seriesMaxMin` (index): index of `this.get('group')` to use to determine the maximum and minimum values (only used if `showMaxMin` is `true`)
* `width` (number): width in pixels of chart. If not specified, the chart will fill to the width of its container.
* `showComparisonLines` (boolean): whether or not to show the comparison lines
* `comparisonLines` (Array of Objects): horizontal lines to mark a target, average, or any kind of comparison value. Properties: 
    * `value` (number): value on y axis on which to show line
    * `color` (Hex string): color of the comparison line
    * `alert` (String; acceptable values: `above`, `below`, `''`): whether to change the color of rectangles above or below this line. Use an empty string for no color changing.
    * `alertColorIndex` (number): index of the `colors` array to use for color changes for this line.
* `showCurrentIndicator` (boolean): whether or not to show diamond-shaped 'current' indicator on x axis
* `currentInterval` (Object): MUST have a `start` property which contains a `moment` object that tells the chart where to display the current indicator.


### Line chart
The line chart uses an *array* of crossfilter groups to display different types of line charts. If there is only one group, *you must still pass an array of 1 group to the line chart*. This is true for many of the charts in this addon.

##### Required parameters
* `dimension`: crossfilter dimension to use for chart
* `group`: *array* of crossfilter groups to use for chart
* `xAxis` (Object): `domain` (Array, probably of `moment` objects) and `ticks` (number of ticks to show)

##### Optional parameters
* `yAxis` (Object): `domain` (Array, probably of numbers) (optional) and `ticks` (number of ticks to show)
* `series` (Array):  Each object in the array has a `title` property. `title` is the name of `this.get('group')` at the same index (used in tooltip creation).
* `width` (number): width in pixels of chart. If not specified, the chart will fill to the width of its container.
* `showCurrentIndicator` (boolean): whether or not to show diamond-shaped 'current' indicator on x axis
* `currentInterval` (Object): MUST have a `start` property which contains a `moment` object that tells the chart where to display the current indicator.
* `showComparisonLines` (boolean): whether or not to show the comparison lines
* `comparisonLines` (Array of Objects): horizontal lines to mark a target, average, or any kind of comparison value. Properties: 
    * `value` (number): value on y axis on which to show line
    * `color` (Hex string): color of the comparison line
* `showMaxMin` (boolean): whether or not to show max/min indicators for the maximum and minimum values of one of the groups on the line chart
* `seriesMaxMin` (index): index of `this.get('group')` to use to determine the maximum and minimum values (only used if `showMaxMin` is `true`)

### Row chart
The row chart uses an *array* of crossfilter groups to display different types of row charts (horizontal bar charts). If there is only one group, *you must still pass an array of 1 group to the row chart*. This is true for many of the charts in this addon.

##### Required parameters
* `dimension`: crossfilter dimension to use for chart
* `group`: *array* of crossfilter groups to use for chart
    * Currently, the row chart only supports using one group, so the `group` parameter will be an array of length 1. However, it is kept as an array for potential future use on stacked, grouped, or layered charts.

##### Optional parameters
* `colors` note: colors[2] is currently the color that the bars appear as
* `labelWidth` (number): width in pixels of the labels div; defaults to 150
* `xAxis` (Object): `ticks` property tells the chart how many ticks to display on the x axis.
* `width` (number): width in pixels of chart. If not specified, the chart will fill to the width of its container.
* `hideXAxisLines` (boolean): whether to hide the x-axis grid lines that show by default on the chart
* `showYGridLines` (boolean): whether to show y-axis grid lines on the chart
* `showYTicks` (boolean): whether to show tick marks for each bar on the y axis
* `showMaxMin`: whether to show max/min indicators for the maximum and minimum values of the row chart
* `showComparisonLine` (boolean): whether to show a comparison line
* `comparisonLine` (Object): a vertical line to mark a target, average, or any kind of comparison value. Properties:
    * `value` (value on y axis on which to show line)
    * `displayValue` (text that will appear to the left of the line on the y axis)
    * `color` (Hex string)
* `chartNotAvailableBars` (number): number of bars to show on the chart not available view

### Pie chart
The pie chart does *not* use an array of crossfilter groups. It uses a singular group.

##### Required parameters
* `dimension`: crossfilter dimension to use for chart
* `group`: crossfilter group to use for chart (not an array)

##### Optional parameters
* `colorMap` (Object): parameter/key pairs by which to color chart
    * e.g. if key values of the data are `'apples, bananas, blueberries'`, colorMap might be `{'apples': '#8b0000', 'bananas': '#ffff00', 'blueberries': '#6495ed'}`, where those colors exist in the `colors` array.
* `height` note: radius of the chart is height / 2
* `donutChart` (boolean): whether or not this pie chart is a donut chart (has an inner radius)
* `showTotal` (boolean): whether or not to show the total number in the center of the chart. Not recommended unless `donutChart` is `true`
* `labels` (boolean): whether or not to show labels on the pie slices with the key value of the slice
* `labelsWithValues` (boolean): whether or not to show values and labels both on the pie slices with the key value of the slice
* `externalLabels` (boolean): whether or not the labels appear on the outside of the chart. Only if `labels` is `true`
* `legend` (boolean): whether or not to show a legend for the pie chart
* `labelCollisionResolution` (string) [auto | default] : whether or not run collision detection algorithm to render labels outside of pie slices if they overlap.
* `formatter` (function) : formats label values, total text and tooltips according to the function passed.

### Bubble chart
The bubble chart does *not* use an array of crossfilter groups. It uses a singluar group.
The bubble chart is a dc-addons `bubbleCloud`, which is not as robustly supported as the rest of our chart types. Therefore, crossfiltering on this chart will likely **not be possible** until the source is updated. See [this issue](https://github.com/Intellipharm/dc-addons/issues/29).

#### Required parameters
* `dimension`: crossfilter dimension to use for chart
* `group`: crossfilter group to use for chart (not an array)
    * The `key` of each fact is a string that identifies the fact. It is also used as the title of the bubble, subject to the `titleFormatter` function (see optional parameters)
    * The `value` of each fact is an object with the following properties:
        * `tooltip` (String): tooltips display the `key` property with a subtitle of whatever is contained in this property. Optional.
        * `colorValue` (number): index of the `colors` array that this bubble is colored. e.g. if the `colors` array is `['#8b0000', '#ffff00', '#6495ed']`, a `banana` object might have a `colorValue` of `1`. See the dummy app for an example of color mapping. Optional.
        * `radius` (String): Not necessarily a number value. This is the string value that will be transformed into a number based on `radiusFormat`.
            * e.g. if `radiusFormat = 'timestamp'`, `radius` should be a timestamp like `'2018-06-26T16:55:25-04:00'`. Required.
        * `subtitle` (String): Actual subtitle of bubble. Optional.


#### Optional parameters
* Formats/formatters (if not specified, the labels on the bubbles will assume the `key` and `value.subtitle` property verbatim, and `radiusFormat` will assume `'count'`):
    * `radiusFormat` (string): specifies how to interpret the `value.radius` string to get an actual radius number. Options: `timestamp`, `milliseconds`, `count`.
        * The `timestamp` option calculates the duration between `value.radius` and now.
        * The `milliseconds` option assumes that `value.radius` is a duration in milliseconds.
        * The `count` option assumes that whatever is currently in `value.radius` is the actual physical radius desired.
    * `titleFormatter` (function): Takes an input of the fact's `key` property and outputs the formatted string for the bubble label.
        * e.g. if the `key` is `'First Last'` and the label on the bubble should be the initials, `titleFormatter` takes an input of `First Last` and returns `FL`.
    * `subtitleFormatter` (function): Takes an input of the fact's `value.subtitle` property and outputs the formatted string for the bubble subtitle.
        * e.g. if the `subtitle` is a timestamp, `subtitleFormatter` takes an input of a timestamp and returns a formatted duration.
* `width` (number): width in pixels of the chart. It is recommended that the chart be roughly square for best display of the bubbles. If not specified, the chart will fill to the width of its container.

### Heat map
The heatmap does *not* use an array of crossfilter groups. It uses a singular group.

##### Required parameters
* `dimension`: crossfilter dimension to use for chart
*  `colors` (Array): list of colors to use. 
* `group`: crossfilter group to use for chart (not an array)
    * The `key` of each fact is an array that tells the heatmap the position of the fact on the chart. `key[0]` will tell the chart the y position, and `key[1]` the x position.
    * The `value` property of each fact will be used to determine the color of the fact.
* `colorMap` (function): a function that takes `value` as parameter and returns index of an element from `colors` list.
* `xAxis` (Object) describes the x axis. Properties:
    * `domain` (Array): describes the domain of the x axis. This property is REQUIRED.
    * `ticks` (number): number of tick LABELS to show on the x axis. This property is optional, and if left out, the chart will automatically show as many labels as will comfortably fit based on the chart's width.
    * `tickMarks` (number): number of ticks to show on the x axis. This property is optional, and if left out, the chart will show a tick for each data point.
    * `label` (String): a label for the x axis. This property is optional.
* `keyFormat` (function): function to apply to `key[1]` in order to attain the desired format on the screen. For example, if `key[1]` of each fact on your `group` is a date formatted like `20161109`, `keyFormat` might be `key => moment(key.toString()).format('MMM DD')`.

##### Optional parameters
* `yAxis` (Object): `label` property shows a label on the y axis (optional).
* `width` (number): width in pixels of chart. If not specified, the chart will fill to the width of its container.
* `showCurrentIndicator` (boolean): whether or not to show diamond-shaped 'current' indicator on x axis
* `currentInterval` (Object): MUST have a `start` property which contains a `moment` object that tells the chart where to display the current indicator.
* `legend` (boolean): whether or not to show an interactive legend to the right of the heatmap. If `true`, `legendWidth` must also be specified for the legend to appear.
* `legendWidth` (number): width in pixels that legend should take up on the right side of the chart. This width is subtracted from the chart's overall width when drawing the chart, so it cannot be larger than the `width` parameter.
* `minBoxWidth` (number): minimum width in pixels for each box in the heatmap. If not specified, defaults to 4.

Contributing
------------------------------------------------------------------------------

### Installation

* `git clone https://github.com/purecloudlabs/ember-data-visualizations.git`
* `cd ember-data-visualizations`
* `yarn --pure-lockfile`

### Linting

* `yarn lint:js`
* `yarn lint:js -- --fix`

### Running tests

* `ember test` – Runs the test suite on the current Ember version
* `ember test --server` – Runs the test suite in "watch mode"
* `ember try:each` – Runs the test suite against multiple Ember versions

### Running the dummy application

* `ember serve`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE).
