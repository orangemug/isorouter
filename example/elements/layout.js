var React = require("react");

module.exports = React.createClass({

  getInitialState: function () {
    return {};
  },

  componentWillReceiveProps: function () {
    this.setState({
      navigating: false
    });
  },

  componentDidMount: function () {
    var self = this;
    var router = require("../routes");

    router.addEventListener("navigate", function () {
      console.log("navigating...");
      self.setState({
        navigating: true
      });
    });
  },
  render: function () {
    var className = this.state.navigating === true ? " navigating" : "";

    return (
      <div className={"layout" + className}>
        {this.props.children}
      </div>
    );
  }
});
