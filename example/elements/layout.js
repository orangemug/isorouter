var React = require("react");

class Layout extends React.Component {

  constructor(props) {
    super(props);
    this.state = {}
  }

  componentWillReceiveProps() {
    this.setState({
      navigating: false
    });
  }

  componentDidMount() {
    var self = this;

    var router = require("../routes");
    router.addEventListener("navigate", function () {
      console.log("navigating...");
      self.setState({
        navigating: true
      });
    });
  }

  render() {
    var className = this.state.navigating === true ? " navigating" : "";

    return (
      <div className={"layout" + className}>
        {this.props.children}
      </div>
    );
  }
}

module.exports = Layout;
