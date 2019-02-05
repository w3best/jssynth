"use strict";

export function Transport(audioSource, songPlayer, stopCallback) {
  var SCHEDULE_AHEAD_TIME = 0.2;  // in seconds
  var TICK_INTERVAL = 50;         // in milliseconds
  var LOOP = true;

  var currentStep;
  var scheduledSteps;
  var stepInterval;
  var timeoutId;
  var isPlaying = false;

  var tick = function() {
    var finalTime = audioSource.audioContext().currentTime + SCHEDULE_AHEAD_TIME;

    var newScheduledSteps = songPlayer.tick(audioSource.audioContext(), audioSource, finalTime, stepInterval, LOOP);
    scheduledSteps = scheduledSteps.concat(newScheduledSteps);

    if (songPlayer.isFinishedPlaying()) {
      stop();
      window.setTimeout(stopCallback, stepInterval * 1000);
    }
  };

  var start = function() {
    var audioContext = audioSource.audioContext();

    currentStep = 0;
    scheduledSteps = [];
    songPlayer.reset(audioContext.currentTime);

    // Fix for Safari 9.1 (and maybe 9?)
    // For some reason, the AudioContext on a new page load is in suspended state
    // in this version of Safari, which means that no audio playback will occur.
    // If you re-load the same page, it will no longer be in suspended state
    // and audio playback will occur.
    //
    // This fixes this by detecting if the AudioContext is in suspended state,
    // and manually forcing it to resume.
    if (audioContext.state === 'suspended') {
      if (audioContext.resume) {
        audioContext.resume();
      }
    }

    audioSource.setClipDetectionEnabled(true);

    tick();
    timeoutId = window.setInterval(tick, TICK_INTERVAL);
    isPlaying = true;
  };

  var stop = function() {
    window.clearInterval(timeoutId);
    audioSource.setClipDetectionEnabled(false);
    isPlaying = false;
  };

  var setTempo = function(newTempo) {
    var sixteenthsPerMinute = newTempo * 4;
    stepInterval = 60.0 / sixteenthsPerMinute;
  };

  var toggle = function() {
    if (isPlaying) {
      stop();
    }
    else {
      start();
    }
  };

  var calculateCurrentStep = function() {
    if (!isPlaying) {
      return undefined;
    }

    var currentTime = audioSource.audioContext().currentTime;
    var i = 0;
    while (i < scheduledSteps.length && scheduledSteps[i].time <= currentTime) {
      currentStep = scheduledSteps[i].step;
      scheduledSteps.splice(0, 1);

      i++;
    }

    return currentStep;
  };


  setTempo(100);


  return {
    setTempo: setTempo,
    toggle: toggle,
    currentStep: calculateCurrentStep,
  };
};