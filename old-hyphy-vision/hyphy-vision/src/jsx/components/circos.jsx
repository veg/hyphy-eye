import React from "react";
import PropTypes from "prop-types";
import CircosJS from "circos";
import { TRACK_TYPES } from "./tracks";

class Circos extends React.Component {
  renderCircos() {
    $(this.ref).empty();

    const { id, size, layout, config, tracks } = this.props;

    if(!id) {
    }

    const circos = new CircosJS({
      container: this.ref,
      width: size,
      height: size
    });
    circos.layout(layout, config || {});
    tracks.forEach((track, index) => {
      const { id, data, config: trackConfig, type } = track;
      circos[type.toLowerCase()](id || `track-${index}`, data, trackConfig);
    });
    circos.render();
  }

  componentDidMount() {
    this.renderCircos();
  }

  componentDidUpdate() {
    this.renderCircos();
  }

  render() {
    return (
      <div
        className="circos-plot"
        id="circos-plot"
        ref={ref => {
          this.ref = ref;
        }}
      />
    );
  }
}

Circos.defaultProps = {
  config: {},
  size: 800,
  tracks: []
};
Circos.propTypes = {
  layout: PropTypes.arrayOf(
    PropTypes.shape({
      len: PropTypes.number.isRequired,
      color: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired
    })
  ).isRequired,
  config: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  size: PropTypes.number,
  tracks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      data: PropTypes.array.isRequired,
      config: PropTypes.object, // eslint-disable-line react/forbid-prop-types
      type: PropTypes.oneOf(TRACK_TYPES)
    })
  )
};

export { Circos };
