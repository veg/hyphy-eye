import * as Plot from "@observablehq/plot";
import { resize } from "@observablehq/stdlib";
import * as d3 from "d3";

export function weeklyPlot(usageData) {
  // Format the data for visualization
  const transformedData = usageData.map((d) => {
    return {
      created: new Date(d.created),
      sites: d.msa[0].sites,
      sequences: d.msa[0].sequences,
    };
  });

  return resize((width) =>
    Plot.plot({
      width,
      height: 300,
      y: {
        label: "Number of Jobs",
        grid: true,
      },
      marks: [
        Plot.axisX({ label: "Week", labelOffset: 40 }),
        Plot.rectY(
          transformedData,
          Plot.binX(
            { y: "count" },
            {
              x: "created",
              interval: "week",
              fill: "orange",
            },
          ),
        ),
        Plot.ruleY([0]),
      ],
    }),
  );
}

export function sitesAndSequences(usageData) {
  // Format the data for visualization
  const transformedData = usageData.map((d) => {
    return {
      created: new Date(d.created),
      sites: d.msa[0].sites,
      sequences: d.msa[0].sequences,
    };
  });

  return resize((width) =>
    Plot.plot({
      width,
      height: 300,
      x: {
        label: "Number of Sites",
        grid: true,
        labelOffset: 30,
      },
      y: {
        label: "Number of Sequences",
        grid: true,
      },
      marks: [
        Plot.dot(transformedData, {
          x: "sites",
          y: "sequences",
          fill: "purple",
          title: (d) =>
            `Date: ${d3.utcFormat("%Y-%m-%d")(
              d.created,
            )}<br>Sites: ${d.sites}<br>Sequences: ${d.sequences}`,
        }),
      ],
    }),
  );
}
