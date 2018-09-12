"use strict";

import React from 'react';

class DownloadButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isPopupVisible: false,
      errorMessage: "",
    };

    this.togglePopup = this.togglePopup.bind(this);
    this.beginExport = this.beginExport.bind(this);
  };

  togglePopup(e) {
    this.setState((prevState, props) => ({
      isPopupVisible: !prevState.isPopupVisible,
    }));
  };

  beginExport(e) {
    if (this.props.downloadFileName === "") {
      this.setState({ errorMessage: "Please give a file name", });
      return;
    }

    this.setState({ errorMessage: "" });
    this.props.export();
  };

  render() {
    let bodyContent;

    if (this.props.enabled === true) {
      bodyContent = <span>
        <label className="block">File Name:</label>
        <span className="flex">
          <input className="underlinedInput flex-uniform-size" style={{minWidth: "1px"}} type="text" value={this.props.downloadFileName} onChange={this.props.setDownloadFileName} />
          <span>.wav</span>
        </span>
        <span className="block red">{this.state.errorMessage}</span>
        <button className="button-full button-hollow mt1 right" onClick={this.beginExport}>Download</button>
      </span>
    }
    else {
      bodyContent = <span>Downloading to *.wav is not supported in your browser. If using a mobile device, try using a desktop browser instead.</span>;
    }

    return <div id="download-container" className="relative">
      <button className="button-full button-hollow right flex flex-align-center" onClick={this.togglePopup}>
        <span className="h3 lh-flush">&darr;</span>&nbsp;&nbsp;*.wav
      </button>
      <a id="hidden-download-link" className="display-none" download={this.props.downloadFileName + ".wav"} href="#"></a>
      <div className={"mt3 p1 popup-box" + (this.state.isPopupVisible ? "" : " display-none")}>
        {bodyContent}
      </div>
    </div>;
  };
};

export { DownloadButton };
