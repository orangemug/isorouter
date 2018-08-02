var React = require("react");


class Root extends React.Component {
  render() {
    return (
      <div>
        <h1>Root</h1>
        <ul>
          {this.props.links.map(function (item, idx) {
            return (
              <li key={idx}>
                <a href={item.href}>{item.name}</a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

module.exports = Root;
