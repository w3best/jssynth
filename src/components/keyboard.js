"use strict";

import React from 'react';

class Key extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    let noteLabel = this.props.noteName + this.props.octave;
    let cssClass = this.props.noteName.toLowerCase();
    let isWhiteKey = ["A", "B", "C", "D", "E", "F", "G"].includes(this.props.noteName);
    let keyColorClass = (isWhiteKey) ? "keyboard-white-key" : "keyboard-black-key";
    let pressedClass = this.props.activeNotes.includes(this.props.noteName + "-" + this.props.octave) ? "pressed" : "";

    return <span className={"inline-block keyboard-key " + keyColorClass + " " + pressedClass + " " + cssClass} data-note={this.props.noteName + "-" + this.props.octave}><span className="keyboard-key-label">{noteLabel}</span></span>
  };
};

class Keyboard extends React.Component {
  constructor(props) {
    super(props);

    this.scrollLeftTimeoutID = undefined;
    this.scrollRightTimeoutID = undefined;

    this.touchHandler = this.touchHandler.bind(this);
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseOut = this.mouseOut.bind(this);
    this.mouseOver = this.mouseOver.bind(this);
    this.touchStart = this.touchStart.bind(this);
    this.touchEnd = this.touchEnd.bind(this);
    this.touchMove = this.touchMove.bind(this);
    this.scroll = this.scroll.bind(this);

    this.touches = {};
  };

  touchHandler(touches) {
    const SCROLL_AMOUNT = 10;
    let key;
    let isScrollActive = false;
    let activeNotes = [];

    for (key in touches) {
      let elementUnderCursor = this.getElementUnderCursor(touches[key].x, touches[key].y);

      if (elementUnderCursor !== undefined) {
        if (elementUnderCursor.classList.contains("js-keyboard-scroll-left")) {
          isScrollActive = true;
          if (this.scrollLeftTimeoutID === undefined) {
            this.scrollLeftTimeoutID = setInterval(() => this.scroll(-SCROLL_AMOUNT), 15);
          }
        }
        else if (elementUnderCursor.classList.contains("js-keyboard-scroll-right")) {
          isScrollActive = true;
          if (this.scrollRightTimeoutID === undefined) {
            this.scrollRightTimeoutID = setInterval(() => this.scroll(SCROLL_AMOUNT), 15);
          }
        }
        else {
          activeNotes.push(elementUnderCursor.dataset.note);
        }
      }
    }

    if (!isScrollActive && this.scrollLeftTimeoutID !== undefined) {
      clearInterval(this.scrollLeftTimeoutID);
      this.scrollLeftTimeoutID = undefined;
    }
    if (!isScrollActive && this.scrollRightTimeoutID !== undefined) {
      clearInterval(this.scrollRightTimeoutID);
      this.scrollRightTimeoutID = undefined;
    }

    this.props.setNotes(activeNotes);
  };

  getElementUnderCursor(x, y) {
    let elementUnderCursor = document.elementFromPoint(x, y);

    if (elementUnderCursor === null) {
      elementUnderCursor = undefined;
    }
    else if (elementUnderCursor.classList.contains("keyboard-key-label")) {
      elementUnderCursor = elementUnderCursor.parentElement;
    }
    else if (!elementUnderCursor.classList.contains("keyboard-key") &&
             !elementUnderCursor.classList.contains("js-keyboard-scroll-left") &&
             !elementUnderCursor.classList.contains("js-keyboard-scroll-right")) {
      elementUnderCursor = undefined;
    }

    return elementUnderCursor;
  };

  mouseDown(e) {
    const RIGHT_MOUSE_BUTTON = 2;

    if (e.button === RIGHT_MOUSE_BUTTON) {
      return;
    }

    this.props.activate();
    this.touches[-1] = { x: e.clientX, y: e.clientY };
    this.touchHandler(this.touches);
  };

  mouseUp(e) {
    this.props.deactivate();
    delete this.touches[-1];
    this.touchHandler(this.touches);
  };

  mouseMove(e) {
    if (this.props.active) {
      this.touches[-1] = { x: e.clientX, y: e.clientY };
      this.touchHandler(this.touches);
    }
  };

  mouseOut(e) {
    if (this.props.active) {
      this.touches[-1] = { x: e.clientX, y: e.clientY };
      this.touchHandler(this.touches);
    }
  };

  mouseOver(e) {
    if (e.buttons !== undefined && e.buttons === 0) {
      this.props.deactivate();
    }
    // Safari, as of v11, doesn't support `buttons`, but it does support the non-standard `which`
    else if (e.nativeEvent.which !== undefined && e.nativeEvent.which === 0) {
      this.props.deactivate();
    }
  };

  touchStart(e) {
    let i;
    let touch;
    let newTouches = e.changedTouches;

    this.props.activate();

    for (i = 0; i < newTouches.length; i++) {
      touch = newTouches.item(i);
      this.touches[touch.identifier] = { x: touch.clientX, y: touch.clientY };
    }

    this.touchHandler(this.touches);
  };

  touchEnd(e) {
    let i;
    let removedTouches = e.changedTouches;

    for (i = 0; i < removedTouches.length; i++) {
      delete this.touches[removedTouches.item(i).identifier];
    }

    this.touchHandler(this.touches);
    if (this.touches.length === 0) {
      this.props.deactivate();
    }

    // Prevent page zoom from double tap
    e.preventDefault();
  };

  touchMove(e) {
    let i;
    let touch;
    let newTouches = e.changedTouches;

    for (i = 0; i < newTouches.length; i++) {
      touch = newTouches.item(i);
      this.touches[touch.identifier] = { x: touch.clientX, y: touch.clientY };
    }

    this.touchHandler(this.touches);

    // Prevent page from scrolling vertically while dragging on keyboard
    e.preventDefault();
  };

  scroll(delta) {
    this.keyboardContainer.scrollLeft += delta;
  };

  componentDidMount() {
    this.keyboardContainer.scrollLeft = (this.keyboardContainer.scrollWidth / 2) - (this.keyboardContainer.clientWidth / 2);
  };

  render() {
    return <div className="keyboard-outer-container flex" onMouseDown={this.mouseDown} onMouseUp={this.mouseUp} onMouseMove={this.mouseMove} onMouseOut={this.mouseOut} onMouseOver={this.mouseOver} onTouchStart={this.touchStart} onTouchEnd={this.touchEnd} onTouchMove={this.touchMove}>
      <div className={"keyboard-scroll-button js-keyboard-scroll-left flex flex-align-center flex-justify-center full-height" + (this.scrollLeftTimeoutID !== undefined ? " pressed" : "")}>&larr;</div>
      <div className="keyboard-container center" ref={(div) => { this.keyboardContainer = div; }}>
        <div className="keyboard block border-box">
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A" octave="0" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A#" octave="0" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="B" octave="0" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C" octave="0" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C#" octave="0" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D" octave="0" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D#" octave="0" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="E" octave="0" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F" octave="0" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F#" octave="0" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G" octave="0" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G#" octave="0" />

          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A" octave="1" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A#" octave="1" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="B" octave="1" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C" octave="1" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C#" octave="1" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D" octave="1" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D#" octave="1" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="E" octave="1" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F" octave="1" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F#" octave="1" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G" octave="1" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G#" octave="1" />

          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A" octave="2" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A#" octave="2" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="B" octave="2" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C" octave="2" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C#" octave="2" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D" octave="2" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D#" octave="2" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="E" octave="2" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F" octave="2" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F#" octave="2" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G" octave="2" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G#" octave="2" />

          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A" octave="3" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A#" octave="3" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="B" octave="3" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C" octave="3" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C#" octave="3" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D" octave="3" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D#" octave="3" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="E" octave="3" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F" octave="3" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F#" octave="3" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G" octave="3" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G#" octave="3" />

          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A" octave="4" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A#" octave="4" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="B" octave="4" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C" octave="4" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C#" octave="4" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D" octave="4" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D#" octave="4" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="E" octave="4" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F" octave="4" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F#" octave="4" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G" octave="4" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G#" octave="4" />

          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A" octave="5" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A#" octave="5" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="B" octave="5" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C" octave="5" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C#" octave="5" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D" octave="5" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D#" octave="5" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="E" octave="5" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F" octave="5" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F#" octave="5" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G" octave="5" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G#" octave="5" />

          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A" octave="6" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A#" octave="6" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="B" octave="6" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C" octave="6" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C#" octave="6" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D" octave="6" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D#" octave="6" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="E" octave="6" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F" octave="6" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F#" octave="6" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G" octave="6" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G#" octave="6" />

          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A" octave="7" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="A#" octave="7" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="B" octave="7" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C" octave="7" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="C#" octave="7" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D" octave="7" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="D#" octave="7" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="E" octave="7" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F" octave="7" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="F#" octave="7" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G" octave="7" />
          <Key active={this.props.active} activeNotes={this.props.activeNotes} pressNote={this.props.pressNote} releaseNote={this.props.releaseNote} noteName="G#" octave="7" />
        </div>
      </div>
      <div className={"keyboard-scroll-button js-keyboard-scroll-right flex flex-align-center flex-justify-center full-height" + (this.scrollRightTimeoutID !== undefined ? " pressed" : "")}>&rarr;</div>
    </div>;
  };
};

export { Keyboard };
