var React = require("react"),
  ReactDOM = require("react-dom"),
  _ = require("underscore"),
  d3 = require("d3");

import { Header } from "./components/header.jsx";
import { DatamonkeyTable } from "./components/tables.jsx";
import { MainResult } from "./components/mainresult.jsx";
import { ResultsPage } from "./components/results_page.jsx";
import { Circos } from "./components/circos.jsx";
import { CHORDS } from "./components/tracks.js";
import { Range } from "react-range";
import translationTable from "./fixtures/translation_table.json";
import { ImageToolbar } from "./components/exportImage.jsx";
import { Runtime, Inspector } from "@observablehq/runtime";
import notebook from "@hyphy_software/multi-hit-analysis-result-visualization";


var translationTableIndex = {};
let c = 0;

_.each(translationTable, (aa, i) => {
  translationTableIndex[aa] = c / 20;
  c++;
});

class ERSliders extends React.Component {
  constructor(props) {
    super(props);
    this.updateVals = this.updateVals.bind(this);
    this.scaleValues = this.scaleValues.bind(this);
    this.scaleValue = this.scaleValue.bind(this);
    this.logPositions = this.logPositions.bind(this);
    this.logPosition = this.logPosition.bind(this);

    let minv = Math.log(parseFloat(this.props.range[0]));
    let maxv = Math.log(parseFloat(this.props.range[1]));
    let logPosRange = this.logPositions(this.props.range, minv, maxv);

    this.state = {
      minv: minv,
      maxv: maxv,
      values: this.props.values,
      logPosRange: logPosRange,
      logPositions: this.logPositions(this.props.values, minv, maxv)
    };
  }

  updateVals(values) {
    // scale the values first
    let scaledValues = this.scaleValues(
      values,
      this.state.minv,
      this.state.maxv
    );
    this.props.update(this.props.name, scaledValues);
    this.setState({ values: values, logPositions: values });
  }

  scaleValues(vals, minv, maxv) {
    return _.map(vals, v => this.scaleValue(v, minv, maxv));
  }

  scaleValue(position, minv, maxv) {
    let scale = (maxv - minv) / (this.props.maxp - this.props.minp);
    return Math.exp(minv + scale * (position - this.props.minp));
  }

  logPositions(vals, minv, maxv) {
    let logp = _.map(vals, v => this.logPosition(v, minv, maxv));

    if (logp[0] < 0) {
      logp[0] = 0;
    }

    return logp;
  }

  logPosition(value, minv, maxv) {
    let scale = (maxv - minv) / (this.props.maxp - this.props.minp);
    return (Math.log(value) - minv) / scale + this.props.minp;
  }

  render() {
    return (
      <Range
        step={1}
        min={this.state.logPosRange[0]}
        max={this.state.logPosRange[1]}
        values={this.state.logPositions}
        onChange={this.updateVals}
        renderTrack={({ props, children }) => (
          <div
            {...props}
            className="mt-2"
            style={{
              ...props.style,
              height: "4px",
              width: "100%",
              backgroundColor: "#ccc"
            }}
          >
            {children}
          </div>
        )}
        renderThumb={({ props }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: "8px",
              width: "8px",
              backgroundColor: "#999"
            }}
          />
        )}
      />
    );
  }
}

ERSliders.defaultProps = {
  minp: 0,
  maxp: 100
};

class MultiHitContents extends React.Component {

  figureRef = React.createRef();

  constructor(props) {
    super(props);

    let testedSets = [];

    if (props.json.tested) {
      testedSets = props.json.tested[0];
    }

    let uniqTestedSets = _.uniq(_.values(testedSets));

    let colorMap = _.object(
      uniqTestedSets,
      _.take(d3.scale.category10().range(), _.size(uniqTestedSets))
    );

    // These variables are to be used for DatamonkeyTable
    const erHeaders = [
      ["Site", "Site Index"],
      ['<i class="fas fa-dice-three fa-2x"></i> vs. <i class="fas fa-dice-two fa-2x"></i>',
       "3H vs 2H"],
      [
        '<i class="fas fa-compass fa-2x"></i> vs. <i class="fas fa-dice-two fa-2x"></i>',
        "3HSI vs 2H"
      ],
      [
        '<i class="fas fa-compass fa-2x"></i> vs. <i class="fas fa-dice-three fa-2x"></i>',
        "3H vs 3HSI"
      ],
      ['<i class="fas fa-dice-two fa-2x"></i> vs. <i class="fas fa-dice-one fa-2x"></i>', "2H vs 1H"]
    ];

    const siteLogLHeaders = [
      ["Site", "Site Index"],
      [
        '<i class="fas fa-dice-three fa-2x"></i> and <i class="fas fa-dice-two fa-2x"></i>',
        "MG94 with double and triple instantaneous substitutions"
      ],
      [
        '<i class="fas fa-compass fa-3x"></i>',
        "MG94 with double and triple instantaneous substitutions [only synonymous islands]"
      ],
      [
        '<i class="fas fa-dice-two fa-3x"></i>',
        "MG94 with double instantaneous substitutions"
      ],
      ['<i class="fas fa-dice-one fa-3x"></i>', "Standard MG94"]
    ];

    let siteTableHeaders = {
      "Evidence Ratios": this.formatHeadersForTable(erHeaders),
      "Site Log Likelihood": this.formatHeadersForTable(siteLogLHeaders)
    };

    let siteTableContent = {
      "Evidence Ratios": {},
      "Site Log Likelihood": {}
    };

    let whichTable = "Evidence Ratios";

    this.toggleTableSelection = this.toggleTableSelection.bind(this);
    this.updateMinimumTransitions = this.updateMinimumTransitions.bind(this);
    this.getMinERSelector = this.getMinERSelector.bind(this);
    this.updateERThreshold = this.updateERThreshold.bind(this);
    this.toggleLabels = this.toggleLabels.bind(this);
    this.inputERSelector = this.inputERSelector.bind(this);

    let circosConfiguration = {
      innerRadius: 300,
      outerRadius: 350,
      cornerRadius: 0,
      gap: 0.04,
      labels: {
        display: true,
        position: "center",
        size: "14",
        color: "black",
        radialOffset: 60
      },
      ticks: {
        display: false,
        color: "grey",
        spacing: 10000000,
        labels: true,
        labelSpacing: 20,
        labelSuffix: "",
        labelDenominator: 1,
        labelDisplay0: true,
        labelSize: 10,
        labelColor: "#000",
        labelFont: "default",
        majorSpacing: 5,
        size: Object
      },
      events: {},
      opacity: 1,
      onClick: null,
      onMouseOver: null,
      zIndex: 100
    };

    this.state = {
      siteTableHeaders: siteTableHeaders,
      siteTableContent: siteTableContent,
      whichTable: whichTable,
      testResults: [],
      xaxis: "Site",
      yaxis: "3H",
      xOptions: ["Site"],
      yOptions: [],
      copy_transition: false,
      pvalThreshold: 0.1,
      positively_selected: [],
      negatively_selected: [],
      pvals: {},
      input: null,
      testedSets: props.json.tested[0],
      uniqTestedSets: uniqTestedSets,
      colorMap: colorMap,
      circosLayout: [],
      circosChordData: [],
      circosConfiguration: circosConfiguration,
      minimumTransitions: 3,
      maxTransitionCount: 0,
      showLegend: true,
      erRanges: {
        "3H vs 2H": [0, 10],
        "3HSI vs 2H": [0, 10],
        "3H vs 3HSI": [0, 10],
        "2H vs 1H": [0, 10]
      },
      ERThresholds: {
        "3H vs 2H": [0, 5],
        "3HSI vs 2H": [0, 5],
        "3H vs 3HSI": [0, 5],
        "2H vs 1H": [0, 5]
      },
      minERs: {
        "3H vs 2H": 0,
        "3HSI vs 2H": 0,
        "3H vs 3HSI": 0,
        "T2H vs 1H": 0
      },
      maxERs: {
        "T3H vs 2H": 5,
        "3HSI vs 2H": 5,
        "3H vs 3HSI": 5,
        "2H vs 1H": 5
      },
      fits: {}
    };
  }

  buildLegend() {
    var svg = d3.select("#transition-legend");

    let translationTableIndex = {};
    let c = 0;

    _.each(translationTable, (aa, i) => {
      translationTableIndex[aa] = c / 20;
      c++;
    });

    let colors = _.map(_.keys(translationTable), codon => {
      return {
        text: translationTable[codon],
        color: this.codonColors(translationTableIndex[translationTable[codon]])
      };
    });

    colors = _.uniq(colors, d => d.text);

    svg
      .selectAll("circle")
      .data(colors)
      .enter()
      .append("circle")
      .attr("cx", 10)
      .attr("r", 6)
      .attr("cy", (d, i) => 130 + i * 15)
      .style("fill", d => d.color);

    svg
      .selectAll("text")
      .data(colors)
      .enter()
      .append("text")
      .attr("x", 20)
      .attr("y", (d, i) => 130 + i * 15)
      .text(d => d.text)
      .style("font-size", "15px")
      .attr("alignment-baseline", "middle");

    // Handmade legend
    //svg.append("circle").attr("cx",10).attr("cy",130).attr("r", 6).style("fill", "#69b3a2")
    //svg.append("circle").attr("cx",10).attr("cy",160).attr("r", 6).style("fill", "#404080")
    //svg.append("text").attr("x", 20).attr("y", 130).text("variable A").style("font-size", "15px").attr("alignment-baseline","middle")
    //svg.append("text").attr("x", 20).attr("y", 160).text("variable B").style("font-size", "15px").attr("alignment-baseline","middle")
  }

  floatFormat = d3.format(".3f");

  inputERSelector(event) {
    let ERThresholds = this.state.ERThresholds;
    let name = event.target.dataset["name"];
    let type = event.target.dataset["type"];
    let value = event.target.value;

    // scale value

    let i = 0;
    if (type == "max") {
      i = 1;
    }

    ERThresholds[name][i] = value;
    this.updateERThreshold(name, ERThresholds[name]);
  }

  prepareForCircos(subs, ers, ERThresholds, minTrans) {
    let counts = {};

    // Merge all objects together
    let filterer = (key, d, i) => {
      if (d >= ERThresholds[key][0] && d <= ERThresholds[key][1]) {
        return i + 1;
      } else {
        return -1;
      }
    };

    let siteFilterer = key =>
      _.filter(
        _.map(ers[key][0], (d, i) => {
          return filterer(key, d, i);
        }),
        d => d > -1
      );

    // Filter subs based on site evidence ratios
    let sitesToKeep = _.intersection(..._.map(_.keys(ers), siteFilterer));

    subs = _.pick(subs, sitesToKeep);
    let transitions = _.values(subs);

    _.each(transitions, source => {
      _.each(source, (targets, sourceKey) => {
        if (!counts[sourceKey]) {
          counts[sourceKey] = {};
        }

        _.each(targets, (target, targetKey) => {
          if (!counts[sourceKey][targetKey]) {
            counts[sourceKey][targetKey] = 0;
          }

          let c = _.keys(target).length;
          counts[sourceKey][targetKey] += c;
        });
      });
    });

    let chordData = [];
    let maxCount = 0;

    // initialize countTally
    let countTally = _.mapObject(translationTable, d => 0);

    _.each(counts, (targets, sourceKey) => {
      _.each(targets, (target, targetKey) => {
        if (target > maxCount) {
          maxCount = target;
        }
        if (
          _.reduce(
            _.zip(sourceKey, targetKey),
            (sum, d) => sum + (d[0] != d[1]),
            0
          ) >= minTrans
        ) {
          chordData.push({
            count: target,
            source: {
              id: "codon-" + sourceKey,
              start: countTally[sourceKey],
              end: (countTally[sourceKey] += target),
              codon: sourceKey
            },
            target: {
              id: "codon-" + targetKey,
              start: countTally[targetKey],
              end: (countTally[targetKey] += target),
              codon: targetKey
            }
          });
        }
      });
    });

    // get unique sources and targets from counts
    let codons = _.uniq(
      _.flatten(_.map(chordData, d => [d.source.codon, d.target.codon]))
    );

    let chordLayout = _.map(codons, d => {
      return this.getCodonLayout(d, countTally[d]);
    });

    if (this.state.showLegend) {
      this.buildLegend();
    } else {
      d3.select("#transition-legend").empty();
    }

    return {
      chordLayout: chordLayout,
      chordData: chordData,
      maxCount: maxCount
    };
  }

  codonColors = d3.scale.category20();

  updateERThreshold(name, values) {
    let ERThresholds = this.state.ERThresholds;
    ERThresholds[name] = values;

    let substitutionMatrix = this.state.data["Site substitutions"];

    let { chordLayout, chordData, maxCount } = this.prepareForCircos(
      substitutionMatrix,
      this.state.data["Evidence Ratios"],
      ERThresholds,
      this.state.minimumTransitions
    );

    this.setState({
      ERThresholds: ERThresholds,
      circosLayout: chordLayout,
      circosChordData: chordData,
      maxCount: maxCount
    });
  }

  getCodonLayout(codon, count) {
    // Create layout from chord data
    //{
    //  "len": 756,
    //  "color": "rgb(150, 61, 179)",
    //  "label": "GCA",
    //  "id": "codon-GCA",
    //  "aa": "A"
    //}

    let translationTableIndex = {};
    let c = 0;

    _.each(translationTable, (aa, i) => {
      translationTableIndex[aa] = c / 20;
      c++;
    });

    let len = count;
    let color = this.codonColors(
      translationTableIndex[translationTable[codon]]
    );

    let label = codon;
    let id = "codon-" + codon;
    let aa = translationTable[codon];

    let codonLayout = {
      len: len,
      color: color,
      label: label,
      id: id,
      aa: aa
    };

    return codonLayout;
  }

  erMap = {
    "Three-hit": {
      icon: '<i class="fas fa-dice-three fa-3x"></i>',
      abbrev: "3H"
    },
    "Three-hit islands vs 2-hit": {
      icon:
        '<i class="fas fa-dice-three fa-2x"></i> vs. <i class="fas fa-dice-two fa-2x"></i>',
      abbrev: "3HSI"
    },
    "Three-hit vs three-hit islands": {
      icon: '<i class="fas fa-compass fa-3x"></i>',
      abbrev: "3H+"
    },
    "Two-hit": { icon: '<i class="fas fa-dice-two fa-3x"></i>', abbrev: "2H" },
    "Triple-hit vs Double-hit": {
      icon: '<i class="fas fa-dice-three fa-3x"></i>',
      abbrev: "3H"
    },
    "Triple-hit islands vs Double-hit": {
      icon:
        '<i class="fas fa-dice-three fa-2x"></i> vs. <i class="fas fa-dice-two fa-2x"></i>',
      abbrev: "3HSI"
    },
    "Triple-hit vs Triple-hit islands": {
      icon: '<i class="fas fa-compass fa-3x"></i>',
      abbrev: "3H+"
    },
    "Double-hit vs Single-hit": { icon: '<i class="fas fa-dice-two fa-3x"></i>', abbrev: "2H" }

  };

  componentDidMount() {
    this.processData(this.props.json);
  }

  componentDidUpdate() {}

  componentWillReceiveProps(nextProps) {
    this.processData(nextProps.json);
  }

  toggleTableSelection(event) {
    let whichTable = event.target.children[0].dataset["name"];

    let yOptions = _.keys(this.state.data[whichTable]);
    let yaxis = this.state.yaxis;

    if (yOptions.length) {
      yaxis = yOptions[0];
    }

    this.setState({
      whichTable: whichTable,
      yOptions: yOptions,
      yaxis: yaxis
    });
  }

  updateMinimumTransitions(event) {
    let substitutionMatrix = this.state.data["Site substitutions"];
    let { chordLayout, chordData, maxCount } = this.prepareForCircos(
      substitutionMatrix,
      this.state.data["Evidence Ratios"],
      this.state.ERThresholds,
      event.target.value
    );

    this.setState({
      minimumTransitions: event.target.value,
      circosLayout: chordLayout,
      circosChordData: chordData,
      maxCount: maxCount
    });
  }

  getERRange(vals) {
    return [_.min(vals), _.max(vals)];
  }

  processData(data) {
    const floatFormat = d3.format(".3f");

    // Prepare values for siteTable
    let erValues = _.map(_.values(data["Evidence Ratios"]), d => d[0]);

    // get range of erValues
    let erRanges = _.object(
      _.keys(data["Evidence Ratios"]),
      _.map(erValues, this.getERRange)
    );

    let ERThresholds = erRanges;

    erValues = _.map(erValues, d => {
      return _.map(d, g => {
        return floatFormat(g);
      });
    });

    let siteLogLValues = _.map(
      _.values(data["Site Log Likelihood"]),
      d => d[0]
    );

    siteLogLValues = _.map(siteLogLValues, d => {
      return _.map(d, g => {
        return floatFormat(g);
      });
    });

    let sigContent = {
      "Evidence Ratios": _.map(_.zip(...erValues), (d, i) => [i + 1].concat(d)),
      "Site Log Likelihood": _.map(_.zip(...siteLogLValues), (d, i) =>
        [i + 1].concat(d)
      )
    };

    // Prepare values for summary component
    const testResults = data["test results"];

    let yOptions = _.keys(data[this.state.whichTable]);
    let yaxis = this.state.yaxis;

    let substitutionMatrix = data["Site substitutions"];
    let { chordLayout, chordData, maxCount } = this.prepareForCircos(
      substitutionMatrix,
      data["Evidence Ratios"],
      ERThresholds,
      this.state.minimumTransitions
    );

    if (yOptions.length) {
      yaxis = yOptions[0];
    }

    // Observable
    this.figureRef.current.replaceChildren();
    $(this.figureRef.current).empty();

    const runtime = new Runtime();

    let main = runtime.module(notebook, name => {
      let toInclude = [
        "fig1label",
        "fig1",
        "fig2_label",
        "fig2",
        "fig3_label",
        "fig3",
        "fig4_label",
      ];

      if (_.includes(toInclude, name)) {
        return Inspector.into(this.figureRef.current)(name);
      }
    });

    this.setState({
      circosLayout: chordLayout,
      circosChordData: chordData,
      maxTransitionCount: maxCount,
      erRanges: erRanges,
      ERThresholds: erRanges,
      //circosLayout : example[0],
      //circosChordData : example[1],
      siteTableContent: sigContent,
      testResults: testResults,
      input: data.input,
      fits: data.fits,
      yOptions: yOptions,
      yaxis: yaxis,
      main: main,
      data: data
    });
  }

  definePlotData(x_label, y_label) {
    let x = [];
    let y = [];

    if (!this.state.data) {
      return { x: x, y: [y] };
    }

    // get which table
    let chartType = this.state.whichTable;
    let chartVals = this.state.data[chartType][y_label][0];

    if (!this.state.data[chartType]) {
      return { x: x, y: [y] };
    }

    x = _.range(1, chartVals.length);

    y = _.map(chartVals, d => {
      return this.floatFormat(d);
    });

    return { x: x, y: [y] };
  }

  formatHeadersForTable(mle) {
    let newHeaders = _.map(mle, function(d) {
      return _.object(["value", "abbr"], d);
    });
    _.each(newHeaders, function(d) {
      return (d["sortable"] = true);
    });

    return newHeaders;
  }

  updateAxisSelection = e => {
    let state_to_update = {},
      dimension = e.target.dataset.dimension,
      axis = e.target.dataset.axis;

    state_to_update[axis] = dimension;

    this.setState(state_to_update);
  };

  updatePvalThreshold = e => {
    // Get number of positively and negatively selected sites by p-value threshold
    let pvalThreshold = parseFloat(e.target.value);

    this.setState(
      {
        pvalThreshold: pvalThreshold
      },
      () => {
        this.processData(this.props.json);
      }
    );
  };

  formatBranchAnnotations(json) {
    // attach is_foreground to branch annotations
    var branch_annotations = d3.range(json.trees.length).map(i => {
      return _.mapObject(json["tested"][i], (val, key) => {
        return { is_foreground: val == "test" };
      });
    });
    return branch_annotations;
  }

  getSummaryForClipboard() {
    return <div></div>;
  }

  getPvalSummary(pval_item) {
    let ref_str = pval_item.test;

    if (pval_item.reference) {
      ref_str += " vs " + pval_item.reference;
    }

    return (
      <p>
        <i className="fa fa-search" aria-hidden="true">
          {" "}
        </i>{" "}
        Found
        <span className="hyphy-highlight"> {pval_item.count} </span>
        sites with different <strong>{ref_str}</strong> dN/dS {}
      </p>
    );
  }

  getSummaryForSource() {
    var items = " ";

    if (_.keys(this.state.pvals).length) {
      items = _.map(_.values(this.state.pvals), this.getPvalSummary, this);
    }

    return (
      <div>
        {items}
        <p>
          with p-value threshold of
          <input
            style={{
              display: "inline-block",
              marginLeft: "5px",
              width: "100px"
            }}
            className="form-control"
            type="number"
            defaultValue={this.state.pvalThreshold}
            step="0.01"
            min="0"
            max="1.0"
            onChange={this.updatePvalThreshold}
          />
          .
        </p>
      </div>
    );
  }

  getTestResultCard(title, item) {
    if (!item) {
      return <div></div>;
    }

    // card classes
    let cardClasses = "card bg-light mb-3";
    let pBadgeClasses = "badge";

    if (item["p-value"] < this.state.pvalThreshold) {
      cardClasses = cardClasses + " border-primary";
      pBadgeClasses = pBadgeClasses + " badge-primary";
    }

    return (
      <div className="col-sm-4">
        <div className={cardClasses} style={{ maxWidth: "18rem" }}>
          <div
            className="card-header"
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <div className="card-body">
            <ul className="list-group">
              <li className="list-group-item">
                <span className="badge badge-secondary">LRT</span>{" "}
                {this.floatFormat(item["LRT"])}
              </li>
              <li className="list-group-item">
                <span className={pBadgeClasses}>p-value</span>{" "}
                {this.floatFormat(item["p-value"])}
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  toggleLabels(event) {
    if (event.target.dataset["name"] == "legend") {
      this.setState({ showLegend: !this.state.showLegend });
      return;
    } else {
      let config = this.state.circosConfiguration;
      config.labels.display = !config.labels.display;

      this.setState({
        circosConfiguration: config
      });
    }
  }

  getMinERSelector(name) {
    return (
      <div className="col-3">
        <div className="input-group mr-2 mt-2">
          <div className="input-group-prepend">
            <div className="input-group-text" id="btnGroupAddon">
              {this.erMap[name].abbrev}
            </div>
          </div>

          <input
            type="number"
            className="form-control"
            data-name={name}
            data-type="min"
            onChange={this.inputERSelector}
            placeholder="Min"
            defaultValue="0"
            value={this.state.ERThresholds[name][0]}
            step="1"
            aria-label="Minimum ER"
            aria-describedby="btnGroupAddon"
          />

          <input
            type="number"
            className="form-control"
            data-name={name}
            data-type="max"
            onChange={this.inputERSelector}
            placeholder="Max"
            defaultValue="5"
            value={this.state.ERThresholds[name][1]}
            step="1"
            aria-label="Minimum ER"
            aria-describedby="btnGroupAddon"
          />
          <ERSliders
            name={name}
            range={this.state.erRanges[name]}
            update={this.updateERThreshold}
            values={this.state.ERThresholds[name]}
          />
        </div>
      </div>
    );
  }

  getSummaryForRendering() {
    // {this.getSummaryForSource()}

    return (
      <div className="container">
        <h3>Likelihood Test Results</h3>
        <div className="row">
          {this.getTestResultCard(
            '<i class="fas fa-dice-three"></i> 3H vs <i class="fas fa-dice-one"></i> 1H',
            this.state.testResults["Triple-hit vs single-hit"]
          )}
          {this.getTestResultCard(
            '<i class="fas fa-dice-three"></i> 3H vs. <i class="fas fa-dice-two"></i> 2H',
            this.state.testResults["Triple-hit vs double-hit"]
          )}
          {this.getTestResultCard(
            '<i class="fas fa-dice-three"></i> 3H vs <i class="fas fa-compass"></i> 3HSI',
            this.state.testResults["Triple-hit vs Triple-hit-island"]
          )}
        </div>
        <div className="row">
          {this.getTestResultCard(
            '<i class="fas fa-dice-two"></i> 2H vs <i class="fas fa-dice-one"></i> 1H',
            this.state.testResults["Double-hit vs single-hit"]
          )}
          {this.getTestResultCard(
            '<i class="fas fa-compass"></i> 3HSI vs <i class="fas fa-dice-two"></i> 2H',
            this.state.testResults["Triple-hit-island vs double-hit"]
          )}
        </div>
      </div>
    );
  }

  getSummary() {
    return (
      <div>
        <div className="main-result border border-primary border-left-0 border-right-0 mt-3">
          <p>
            <p>
              MultiHit{" "}
              <strong className="hyphy-highlight"> found evidence</strong> of
            </p>
            <p>
              <i className="fa fa-plus-circle" aria-hidden="true">
                {" "}
              </i>{" "}
              pervasive positive/diversifying selection at
              <span className="hyphy-highlight">
                {" "}
                {this.state.positively_selected.length}{" "}
              </span>
              sites
            </p>
            <p>
              <i className="fa fa-minus-circle" aria-hidden="true">
                {" "}
              </i>{" "}
              pervasive negative/purifying selection at
              <span className="hyphy-highlight">
                {" "}
                {this.state.negatively_selected.length}{" "}
              </span>
              sites
            </p>
            <p>
              with p-value threshold of
              <input
                style={{
                  display: "inline-block",
                  marginLeft: "5px",
                  width: "100px"
                }}
                className="form-control"
                type="number"
                defaultValue="0.1"
                step="0.01"
                min="0"
                max="1"
                onChange={this.updatePvalThreshold}
              />
              .
            </p>
          </p>
          <hr />
          <p>
            <small>
              Please cite Extra base hits: Widespread empirical support for instantaneous multiple-nucleotide changes{" "}
              <a href="//journals.plos.org/plosone/article?id=10.1371/journal.pone.0248337"> </a> if
              you use this result in a publication, presentation, or other
              scientific work.
            </small>
          </p>
        </div>
      </div>
    );
  }

  render() {

    if (this.state.main) {
      this.state.main.redefine("results_json", this.state.data);
    }

    let chordData = this.state.circosChordData;
    let chordDataTableHeaders = [
      { value: "Source", abbr: "Source", sortable: true },
      { value: "Target", abbr: "Target", sortable: true },
      { value: "Source Amino Acid", abbr: "Source Amino Acid", sortable: true },
      { value: "Target Amino Acid", abbr: "Target Amino Acid", sortable: true },
      { value: "Count", abbr: "Count", sortable: true }
    ];
    let chordDataTableRows = _.map(this.state.circosChordData, d => {
      return [
        d.source.codon,
        d.target.codon,
        translationTable[d.source.codon],
        translationTable[d.target.codon],
        d.count
      ];
    });

    let selectors = null;

    if (this.state.data) {
      selectors = _.map(
        _.keys(this.state.data["Evidence Ratios"]),
        this.getMinERSelector
      );
    }

    return (
      <div>
        <div
          id="datamonkey-error"
          className="alert alert-danger alert-dismissible"
          role="alert"
          style={{ display: "none" }}
        >
          <button type="button" className="close" id="datamonkey-error-hide">
            <span aria-hidden="true">&times;</span>
            <span className="sr-only">Close</span>
          </button>
          <strong>Error!</strong> <span id="datamonkey-error-text" />
        </div>

        <div id="results">
          <MainResult
            summary_for_rendering={this.getSummaryForRendering()}
            method_ref="http://hyphy.org/methods/other/FitMultiModel/"
            citation_ref="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0248337"
            citation_number="33711070"
          />

          <div id="site-plot-tab" className="row hyphy-row">
            <div className="col-md-12">
              <Header
                title="Figures"
                popover="<p>Hover over a point to see its values</p>"
              />
              <div ref={this.figureRef}></div>
            </div>
           </div>
           <div id="table-tab" className="row hyphy-row">
            <div id="hyphy-mle-fits" className="col-md-12">
             
              <Header
                title="Model Test Statistics Per Site Table"
                popover="<p>Hover over a column header for a description of its content.</p>"
              />
              <div className="row">
                <div
                  className="col-md-12 mt-3 mb-3 btn-group btn-group-toggle"
                  data-toggle="buttons"
                  onClick={this.toggleTableSelection}
                >
                  <label
                    className="col-md-6 btn btn-secondary active"
                    onClick={this.toggleTableSelection}
                  >
                    <input
                      type="radio"
                      name="options"
                      data-name="Evidence Ratios"
                      id="Evidence Ratios"
                      defaultChecked={true}
                    />{" "}
                    Evidence Ratios
                  </label>
                  <label
                    className="col-md-6 btn btn-secondary"
                    onClick={this.toggleTableSelection}
                  >
                    <input
                      type="radio"
                      name="options"
                      data-name="Site Log Likelihood"
                      id="Site Log Likelihood"
                    />{" "}
                    Site Log Likelihood
                  </label>
                </div>
              </div>

              
              <DatamonkeyTable
                headerData={this.state.siteTableHeaders[this.state.whichTable]}
                bodyData={this.state.siteTableContent[this.state.whichTable]}
                classes={"table table-smm table-striped"}
                paginate={20}
                export_csv
              />

              <Header
                title="Site Substitutions"
                popover="<p>Site substitutions across the multiple sequence alignment</p>"
              />

              <div id="plot-tab">
                <div>
                  <h6 className="mt-2">Evidence Ratio Thresholds</h6>

                  <div className="alert alert-primary" role="alert">
                    <p>
                      Use the sliders or input to specify the evidence ratio
                      range of each respective model. For example, if three-hit
                      substitutions with 3H+ support are defined as those
                      occurring at sites with ER(3H+:2H)>5, set 3H+ range to a
                      minimum of 5 but leave all other settings to their
                      respective maximum ranges.
                    </p>
                    <hr />
                    <p className="mb-0">
                      Use the <b># of nucleotide changes</b> slider to specify
                      the minimum number of substitutions to display.
                    </p>
                  </div>

                  <div
                    className="btn-toolbar mb-3 mt-3"
                    role="toolbar"
                    aria-label="Toolbar with button groups"
                  >
                    {selectors}
                  </div>
                </div>

                <div className="mt-2 float-right">
                  <label className="btn btn-light active">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      onClick={this.toggleLabels}
                    />{" "}
                    Labels
                  </label>
                  <label className="btn btn-light active">
                    <input
                      data-checked={this.state.showLegend}
                      data-name="legend"
                      type="checkbox"
                      defaultChecked={true}
                      onClick={this.toggleLabels}
                    />{" "}
                    Legend
                  </label>
                </div>

                <div id="circos-menu">
                  <div id="transition-menu">
                    <label for="min-transitions" className="mt-2">
                      <h6>
                        # of nucleotide changes{" "}
                        <span className="badge badge-secondary">
                          {this.state.minimumTransitions}
                        </span>{" "}
                      </h6>
                    </label>
                    <input
                      type="range"
                      className="custom-range"
                      style={{ display: "block" }}
                      defaultValue="3"
                      min="1"
                      max="3"
                      onChange={this.updateMinimumTransitions}
                      id="min-transitions"
                    />
                  </div>
                </div>

                <div className="row">
                  <svg
                    id="transition-legend"
                    hidden={!this.state.showLegend}
                    className="col-2"
                  ></svg>
                  <div className="col-10">
                    <Circos
                      size={800}
                      layout={this.state.circosLayout}
                      config={this.state.circosConfiguration}
                      tracks={[
                        {
                          id: "flow",
                          type: CHORDS,
                          data: chordData,
                          config: {
                            color: d => {
                              return this.codonColors(
                                translationTableIndex[
                                  translationTable[d.source.codon]
                                ]
                              );
                            },
                            opacity: 0.2,
                            tooltipContent: function(d) {
                              return (
                                "<h5>" +
                                d.source.codon +
                                " (" +
                                translationTable[d.source.codon] +
                                ") " +
                                " ➤ " +
                                d.target.codon +
                                " (" +
                                translationTable[d.target.codon] +
                                ") " +
                                ": " +
                                d.count +
                                "</h5></i>"
                              );
                            },
                            events: {
                              "mouseover.demo": function(d, i, nodes, event) {
                                d3.select(nodes[i]).attr("opacity", 0.5);
                              },
                              "mouseout.demo": function(d, i, nodes, event) {
                                d3.select(nodes[i]).attr("opacity", 0.2);
                              }
                            }
                          }
                        }
                      ]}
                    />
                  </div>
                  <ImageToolbar svgID={"circos-plot"} name={"circos"} />
                </div>

                <DatamonkeyTable
                  headerData={chordDataTableHeaders}
                  bodyData={chordDataTableRows}
                  classes={"table table-smm table-striped"}
                  paginate={20}
                  export_csv
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export function MultiHit(props) {
  return (
    <ResultsPage
      data={props.data}
      scrollSpyInfo={[
        { label: "summary", href: "summary-tab" },
        { label: "site plot", href: "site-plot-tab" },
        { label: "table", href: "table-tab" },
        { label: "substitution plot", href: "plot-tab" }
      ]}
      methodName="Multi-Hit"
      fasta={props.fasta}
      originalFile={props.originalFile}
      analysisLog={props.analysisLog}
    >
      {MultiHitContents}
    </ResultsPage>
  );
}

export default function render_multihit(
  data,
  element,
  fasta,
  originalFile,
  analysisLog
) {
  ReactDOM.render(
    <MultiHit
      data={data}
      fasta={fasta}
      originalFile={originalFile}
      analysisLog={analysisLog}
    />,
    document.getElementById(element)
  );
}
