import React from "react";
import { InputInfo } from "./input_info";

function MethodHeader(props) {
  return (
    <div className="row">
      <div className="clearance" id="summary-div" />
      <div className="col-md-12">
        <h3 className="list-group-item-heading">
          <span id="summary-method-name">{props.methodName}</span>
          <br />
          <span className="results-summary">results summary</span>
        </h3>
      </div>
      <div className="col-md-12">
        <InputInfo
          input_data={props.input_data}
          json={props.json}
          fasta={props.fasta}
          originalFile={props.originalFile}
          analysisLog={props.analysisLog}
          partitionedData={props.partitionedData}
        />
      </div>
    </div>
  );
}

export { MethodHeader };
