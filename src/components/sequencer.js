"use strict";

import React from 'react';

class TrackHeader extends React.PureComponent {
  constructor(props) {
    super(props);

    this.setTrackName = this.setTrackName.bind(this);
    this.setTrackVolume = this.setTrackVolume.bind(this);
    this.toggleTrackMute = this.toggleTrackMute.bind(this);
  };

  setTrackName(e) {
    this.props.setTrackName(this.props.trackID, e.target.value);
  };

  setTrackVolume(e) {
    this.props.setTrackVolume(this.props.trackID, parseFloat(e.target.value));
  };

  toggleTrackMute(e) {
    this.props.toggleTrackMute(this.props.trackID, !this.props.muted);
  };

  render() {
    const shortTrackName = function(fullTrackName) {
      return fullTrackName.substring(0, 4);
    };

    return <li className="flex flex-column flex-uniform-size flex-justify-center bg-light-gray list-style-none pl1 pr1 border-box bb br">
      <span className="short-name">{shortTrackName(this.props.name)}</span>
      <input className="underlinedInput full-width bg-light-gray" type="text" value={this.props.name} onChange={this.setTrackName} />
      <span className="sequencer-volume-container flex flex-align-center">
        <button className={"button-hollow button-small" + (this.props.muted ? " button-enabled" : "")} onClick={this.toggleTrackMute}>Mute</button>
        <input className="full-width" style={{marginLeft: "4px"}} type="range" min="0.0" max="1.0" step="0.01" disabled={this.props.muted} value={this.props.volume} onChange={this.setTrackVolume} />
      </span>
    </li>;
  };
};

class TimelineHeader extends React.PureComponent {
  constructor(props) {
    super(props);

    this.setCurrentStep = this.setCurrentStep.bind(this);
    this.onPlaybackHeadTouchStart = this.onPlaybackHeadTouchStart.bind(this);
    this.onPlaybackHeadTouchEnd = this.onPlaybackHeadTouchEnd.bind(this);
  };

  setCurrentStep(e) {
    this.props.setCurrentStep(parseInt(e.target.value, 10));
  };

  onPlaybackHeadTouchStart(e) {
    this.props.setIsTimelineElementActive(true);
  };

  onPlaybackHeadTouchEnd(e) {
    this.props.setIsTimelineElementActive(false);
  };

  render() {
    let baseTimelineWidth = this.props.measureCount * 16 * 9;

    return <div className="relative">
      <ul className="flex ml0 pl0 no-whitespace-wrap height-2">
        <li className="sequencer-row-left-padding list-style-none border-box bb br"></li>
        {Array(this.props.measureCount).fill(undefined).map((_, measureIndex) =>
        <li key={measureIndex} className="sequencer-cell sequencer-cell-header flex-uniform-size list-style-none border-box br bb"><span className="block h4 lh-flush full-width" style={{marginLeft: "4.5px"}}>{measureIndex + 1}</span></li>
        )}
        <li className="sequencer-row-right-padding list-style-none bb"></li>
      </ul>
      <div className="sequencer-step-timeline">
        <input type="range" className="sequencer-playback-header" style={{width: "calc(" + baseTimelineWidth + "px + (1.5rem - 9px))", marginLeft: "calc(0.25rem - 0.5px)"}} min="0" max={(this.props.measureCount * 16) - 1} step="1" value={this.props.currentStep} onChange={this.setCurrentStep} onTouchStart={this.onPlaybackHeadTouchStart} onTouchEnd={this.onPlaybackHeadTouchEnd} />
      </div>
    </div>;
  };
};

class TrackPatternList extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    return <ul className="flex full-height ml0 pl0 no-whitespace-wrap">
      <li className="sequencer-row-left-padding list-style-none border-box bb br bg-lighter-gray"></li>
      <li className="relative list-style-none border-box bb br" style={{minWidth: (this.props.measureCount * 16 * 9) + "px"}}>
      {this.props.patterns.map((pattern, index) =>
        <TimelinePattern key={index} trackID={this.props.trackID} patternID={pattern.patternID} index={index} startStep={pattern.startStep} timelineStepCount={this.props.measureCount * 16} setSelectedTrack={this.props.setSelectedTrack} setSelectedPattern={this.props.setSelectedPattern} setPatternStartStep={this.props.setPatternStartStep} />
      )}
      </li>
      <li className="sequencer-row-right-padding list-style-none bb bg-lighter-gray"></li>
    </ul>;
  };
};

class TimelinePattern extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dragStartPixelX: undefined,
      dragStartStep: undefined,
    };

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  };

  onMouseDown(e) {
    this.props.setSelectedTrack(this.props.trackID);
    this.props.setSelectedPattern(this.props.patternID);

    this.setState({
      dragStartPixelX: e.clientX,
      dragStartStep: this.props.startStep,
    });
  };

  onMouseMove(e) {
    if (this.state.dragStartPixelX === undefined) {
      return;
    }

    var dragPixelDelta = e.clientX - this.state.dragStartPixelX;
    var dragStepCount = Math.floor(dragPixelDelta / 9);

    var newStartStep = this.state.dragStartStep + dragStepCount;
    newStartStep = Math.max(0, newStartStep);
    newStartStep = Math.min(this.props.timelineStepCount - 16, newStartStep);

    if (this.props.startStep !== newStartStep) {
      this.props.setPatternStartStep(this.props.trackID, this.props.index, newStartStep);
    }
  };

  onMouseUp(e) {
    this.setState({
      dragStartPixelX: undefined,
      dragStartStep: undefined,
    });
  };

  render() {
    return <span className="timeline-pattern"
                 style={{left: (this.props.startStep * 9) + "px"}}
                 onMouseDown={this.onMouseDown}
                 onMouseMove={this.onMouseMove}
                 onMouseUp={this.onMouseUp}>
             Pattern {this.props.patternID}
           </span>;
  };
};

class TrackRemoveButton extends React.PureComponent {
  constructor(props) {
    super(props);

    this.removeTrack = this.removeTrack.bind(this);
  };

  removeTrack(e) {
    this.props.removeTrack(this.props.trackID);
  };

  render() {
    return <button className="button-small button-hollow full-width round" onClick={this.removeTrack}>X</button>
  };
};

class MeasureCount extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      isValidValue: true,
    };

    this.MIN_VALUE = 1;
    this.MAX_VALUE = 99;
    this.validateValue = this.validateValue.bind(this);
    this.setMeasureCount = this.setMeasureCount.bind(this);
    this.enableEditMode = this.enableEditMode.bind(this);
    this.disableEditMode = this.disableEditMode.bind(this);
  };

  validateValue(e) {
    let inputString = e.target.value;
    let isValidNumber = /^\d\d?$/.test(inputString);
    let parsedNumber = parseInt(inputString, 10);

    let isValidValue = isValidNumber &&
                       parsedNumber >= this.MIN_VALUE &&
                       parsedNumber <= this.MAX_VALUE;

    this.setState(() => ({ isValidValue: isValidValue }));
  };

  setMeasureCount(e) {
    this.props.setMeasureCount(parseInt(this.measureCountInput.value, 10));
    this.setState(() => ({ editMode: false }));
  };

  enableEditMode() {
    this.setState(() => ({
      editMode: true,
      isValidValue: true,
    }));
  };

  disableEditMode() {
    this.setState(() => ({
      editMode: false,
    }));
  };

  render() {
    if (this.state.editMode === true) {
      return <span className="pr1 align-right">
        <label>Measures:</label>&nbsp;
        <input type="text" className={"width-1" + (this.state.isValidValue ? "" : " note-box-invalid")} maxLength="2" defaultValue={this.props.measureCount} onChange={this.validateValue} ref={input => {this.measureCountInput = input;}} />
        <span className="block">
          <a href="javascript:void(0);" className="h4" onClick={this.disableEditMode}>cancel</a>&nbsp;
          <button className="button-small button-hollow" disabled={!this.state.isValidValue} onClick={this.setMeasureCount}>Save</button>
        </span>
      </span>;
    }
    else {
      return <span className="pr1 align-right">
        <label>Measures: {this.props.measureCount}</label>
        <a href="javascript:void(0);" className="block h4 lh-flush" onClick={this.enableEditMode}>change</a>
      </span>;
    }
  };
};

class Sequencer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: true,
      isTimelineElementActive: false,
    };

    this.toggleExpansion = this.toggleExpansion.bind(this);
    this.setIsTimelineElementActive = this.setIsTimelineElementActive.bind(this);
    this.showFileChooser = this.showFileChooser.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
  };


  toggleExpansion() {
    this.setState((prevState, props) => ({
      expanded: !prevState.expanded,
    }));
  };

  setIsTimelineElementActive(newIsTimelineElementActive) {
    this.setState({isTimelineElementActive: newIsTimelineElementActive});
  };

  showFileChooser(e) {
    this.fileInput.click();
  };

  uploadFile(e) {
    if (this.fileInput.value === "") {
      return;
    }

    this.props.addSamplerTrack(this.fileInput.files[0]);
  };

  render() {
    return <div className="pt1 pb1 border-box bt-thick">
      <div className="flex flex-justify-space-between">
        <h2 className="mt0 mb1 pl1">Sequencer</h2>
        <MeasureCount measureCount={this.props.measureCount} setMeasureCount={this.props.setMeasureCount} />
      </div>
      <div className="flex">
        <ul className={"flex flex-column mt1 ml0 pl0 overflow-scroll-x border-box " + (this.state.expanded ? "expanded" : "contracted")}>
          <li className="list-style-none height-1 pl1 border-box bb">
            <button className={"vertical-top button-tiny button-hollow" + (this.state.expanded ? " button-enabled" : "")} onClick={this.toggleExpansion}>Edit</button>
          </li>
          {this.props.tracks.map((track) =>
            <TrackHeader key={track.id}
                         trackID={track.id}
                         name={track.name}
                         muted={track.muted}
                         volume={track.volume}
                         setTrackName={this.props.setTrackName}
                         setTrackVolume={this.props.setTrackVolume}
                         toggleTrackMute={this.props.toggleTrackMute} />
          )}
        </ul>
        <ul className={"relative flex flex-uniform-size flex-column mt0 ml0 pl0 border-box" + (this.state.isTimelineElementActive ? " overflow-hidden-x" : " overflow-scroll-x")}>
          <li className="inline-block list-style-none full-width border-box">
            <TimelineHeader measureCount={this.props.measureCount} currentStep={this.props.currentStep} setCurrentStep={this.props.setCurrentStep} setIsTimelineElementActive={this.setIsTimelineElementActive} />
          </li>
          {this.props.tracks.map((track) =>
          <li key={track.id} className="list-style-none full-width height-3 border-box">
            <TrackPatternList trackID={track.id} patterns={track.patterns} measureCount={this.props.measureCount} setSelectedTrack={this.props.setSelectedTrack} setSelectedPattern={this.props.setSelectedPattern} setPatternStartStep={this.props.setPatternStartStep} />
          </li>
          )}
          <span className="sequencer-playback-line" style={{left: `calc(${this.props.currentStep * 9}px + 1.0rem - 3px)`}}></span>
        </ul>
        <ul className={"flex flex-column mt0 ml0 pl0 overflow-scroll-x border-box" + (this.state.expanded ? "" : " display-none")}>
          <li className="list-style-none inline-block pr1 border-box bb height-2">&nbsp;</li>
          {this.props.tracks.map((track) =>
          <li key={track.id} className="flex flex-align-center flex-uniform-size bg-light-gray pl-half pr-half list-style-none border-box bb bl">
            <TrackRemoveButton trackID={track.id} removeTrack={this.props.removeTrack} />
          </li>
          )}
        </ul>
      </div>
      <div className="pl1">
        <button className="button-full button-hollow mr-half" onClick={this.props.addSynthTrack}>Add Synth Track</button>
        <button className="button-full button-hollow" onClick={this.showFileChooser}>Add Sampler Track</button>
        <input className="display-none" type="file" onChange={this.uploadFile} ref={input => {this.fileInput = input;}} />
      </div>
    </div>;
  };
};

export { Sequencer };
