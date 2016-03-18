var React = require("react");

module.exports = React.createClass({
  render: function () {
    return (
      <div>
        <h1>Error</h1>
        <p>
          {this.props.err.message}
        </p>
      </div>
    );
  }
});
