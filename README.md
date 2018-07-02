ember-data-visualizations
==============================================================================

Ember addon to support visualizations with dc.js (d3 & crossfiltering)

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

### Column chart
The column chart uses an *array* of crossfilter groups to display different types of column charts (vertical bar charts). If there is only one group, *you must still pass an array of 1 group to the column chart*. This is true for many of the charts in this addon.

##### Required parameters
* `dimension`: crossfilter dimension to use for chart
* `group`: *array* of crossfilter groups to use for chart
* `xAxis` (Object): `domain` (Array, probably of `moment` objects) and `ticks` (number of ticks to show)

##### Optional parameters
* `yAxis` (Object): `domain` (Array, probably of numbers) (optional) and `ticks` (number of ticks to show)
* `type` (String) (defaults to `GROUPED`): `GROUPED`, `LAYERED`, `STACKED`. `GROUPED` is for "ordinary" data and is most likely what should be used if there is only one crossfilter group. `LAYERED` is for "overlapping data;" i.e. there are 10 fruits, 6 of which are citrus, 3 of which are oranges. If this chart is `LAYERED`, the `series` option tells the chart how to format the bars (hatching). `STACKED` creates a stacked bar chart; i.e. there are 10 fruits, 20 vegetables, and 15 meats and we want to display them on top of each other.
* `series` (Array):  Each object in the array should have a `title` property and a `hatch` property. `title` should be the name of `this.get('group')` at the same index (used in tooltip creation). `hatch` should be either `pos` (for a hatch from bottom left to top right), `neg` (for a hatch from top left to bottom right), or `false` (for no hatch).
* `showMaxMin` (boolean): whether or not to show max/min indicators for the maximum and minimum values of one of the groups on the column chart
* `seriesMaxMin` (index): index of `this.get('group')` to use to determine the maximum and minimum values (only used if `showMaxMin` is `true`)
* `colors` (Array): Hex strings to color the chart
* `height` (number): height in pixels of chart
* `showComparisonLine` (boolean): whether or not to show a comparison line
* `comparisonLine` (Object): Properties: `value` (value on y axis on which to show line), `displayValue` (text that will appear to the left of the line on the y axis), `color` (Hex string)
* `showCurrentIndicator` (boolean): whether or not to show diamond-shaped 'current' indicator on x axis
* `currentInterval` (Object): MUST have a `start` property which contains a `moment` object that tells the chart where to display the current indicator

### Line chart
The line chart uses an *array* of crossfilter groups to display different types of line charts. If there is only one group, *you must still pass an array of 1 group to the line chart*. This is true for many of the charts in this addon.

##### Required parameters
* `dimension`: crossfilter dimension to use for chart
* `group`: *array* of crossfilter groups to use for chart
* `xAxis` (Object): `domain` (Array, probably of `moment` objects) and `ticks` (number of ticks to show)

##### Optional parameters
* `yAxis` (Object): `domain` (Array, probably of numbers) (optional) and `ticks` (number of ticks to show)
* `series` (Array):  Each object in the array should have a `title` property. `title` should be the name of `this.get('group')` at the same index (used in tooltip creation).
* `colors` (Array): Hex strings to color the chart
* `height` (number): height in pixels of chart
* `showCurrentIndicator` (boolean): whether or not to show diamond-shaped 'current' indicator on x axis
* `currentInterval` (Object): MUST have a `start` property which contains a `moment` object that tells the chart where to display the current indicator
* `showComparisonLine` (boolean): whether or not to show a comparison line
* `comparisonLine` (Object): Properties: `value` (value on y axis on which to show line), `displayValue` (text that will appear to the left of the line on the y axis), `color` (color of line, hex string), `textColor` (color of text, hex string)
* `showMaxMin` (boolean): whether or not to show max/min indicators for the maximum and minimum values of one of the groups on the line chart
* `seriesMaxMin` (index): index of `this.get('group')` to use to determine the maximum and minimum values (only used if `showMaxMin` is `true`)

### Row chart
The row chart uses an *array* of crossfilter groups to display different types of row charts (horizontal bar charts). If there is only one group, *you must still pass an array of 1 group to the row chart*. This is true for many of the charts in this addon.

##### Required parameters
* `dimension`: crossfilter dimension to use for chart
* `group`: *array* of crossfilter groups to use for chart

##### Optional parameters
* `colors` (Array): Hex strings to color the chart (colors[2] is currently the color that the bars appear as)
* `labelWidth` (number): width in pixels of the labels div. Defaults to 150
* `xAxis` (Object): `ticks` property tells the chart how many ticks to display on the x axis
* `height` (number): height of pixels of chart
* `hideXAxisLines` (boolean): whether to hide the x-axis grid lines that show by default on the chart
* `showYGridLines` (boolean): whether to show y-axis grid lines on the chart
* `showYTicks` (boolean): whether to show tick marks for each bar on the y axis
* `showMaxMin`: whether or not to show max/min indicators for the maximum and minimum values of the row chart
* `showComparisonLine` (boolean): whether or not to show a comparison line
* `comparisonLine` (Object): Properties: `value` (value on y axis on which to show line), `displayValue` (text that will appear on the bottom of the line on the x axis), `color` (color of line, hex string), `textColor` (color of text, hex string)
* `chartNotAvailableBars` (number): number of bars to show on the chart not available view

### Pie chart
The pie chart does *not* use an array of crossfilter groups. 

##### Required parameters
* `dimension`: crossfilter dimension to use for chart
* `group`: crossfilter group to use for chart (NOT AN ARRAY)

##### Optional parameters
* `colors` (Array): Hex strings to color the chart
* `colorMap` (Object): parameter/key pairs by which to color chart. e.g. if key values of the data are `'apples, bananas, blueberries'`, colorMap might be `{'apples': '#8b0000', 'bananas': '#ffff00', 'blueberries': '#6495ed'}`, where those colors exist in the `colors` array
* `height` (number): height in pixels of the chart (radius of the chart is height / 2)
* `donutChart` (boolean): whether or not this pie chart is a donut chart (has an inner radius)
* `showTotal` (boolean): whether or not to show the total number in the center of the chart. Not recommended unless `donutChart` is `true`
* `labels` (boolean): whether or not to show labels on the pie slices with the key value of the slice
* `externalLabels` (boolean): whether or not the labels should be on the outside of the chart. Only if `labels` is `true`
* `legend` (boolean): whether or not to show a legend for the pie chart

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
