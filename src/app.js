"use strict";

var app = angular.module('js120', []);

app.controller('InstrumentController', ['$scope', 'InstrumentService', 'SequencerService', function($scope, InstrumentService, SequencerService) {
  var instrumentID = 1;
  
  $scope.instrument = InstrumentService.instrumentByID(instrumentID);
  $scope.$on('SequencerController.selectedTrackChanged', function(event, args) {
    instrumentID = SequencerService.trackByID(args.trackID).instrumentID;
    $scope.instrument = InstrumentService.instrumentByID(instrumentID);
  });

  $scope.$on('InstrumentService.update', function(event) {
    $scope.instrument = InstrumentService.instrumentByID(instrumentID);
  });

  $scope.updateInstrument = function() {
    InstrumentService.updateInstrument();
  };
}]);


app.controller('PatternCollectionController', ['$rootScope', '$scope', 'PatternService', 'SequencerService', function($rootScope, $scope, PatternService, SequencerService) {
  var instrumentID = 1;

  var buildPatternOptions = function() {
    return PatternService.patternsByInstrumentID(instrumentID).map(function(pattern) {
     return { id: pattern.id, name: pattern.name };
    });
  };

  $scope.patternOptions = buildPatternOptions();
  $scope.$on('SequencerController.selectedTrackChanged', function(event, args) {
    instrumentID = SequencerService.trackByID(args.trackID).instrumentID;
    $scope.patternOptions = buildPatternOptions();
    $scope.changeSelectedPattern($scope.patternOptions[0].id);
  });
  $scope.$on('PatternService.update', function(event) {
    $scope.patternOptions = buildPatternOptions();
  });

  $scope.selectedPatternID = 1;

  $scope.addPattern = function() {
    var newPattern = PatternService.addPattern(instrumentID);
    $scope.changeSelectedPattern(newPattern.id);
  };

  $scope.removePattern = function(patternID) {
    var i;
    var newSelectedPatternID;
    
    if (patternID === $scope.selectedPatternID) {
      i = 0;
      while (i < $scope.patternOptions.length && $scope.patternOptions[i].id !== patternID) {
        i++;
      }

      if (i === ($scope.patternOptions.length - 1)) {
        newSelectedPatternID = $scope.patternOptions[i - 1].id;
      }
      else {
        newSelectedPatternID = $scope.patternOptions[i + 1].id;
      }
    }
    else {
      newSelectedPatternID = $scope.selectedPatternID;
    }

    SequencerService.unsetPattern(patternID);
    PatternService.removePattern(patternID);

    if (newSelectedPatternID !== patternID) {
      $scope.changeSelectedPattern(newSelectedPatternID);
    }
  };

  $scope.changeSelectedPattern = function(patternID) {
    $scope.selectedPatternID = patternID;
    $rootScope.$broadcast('PatternCollectionController.selectedPatternChanged', { patternID: patternID });
  };
}]);


app.controller('PatternController', ['$scope', 'InstrumentService', 'PatternService', function($scope, InstrumentService, PatternService) {
  var instrumentID = 1;
  $scope.pattern = PatternService.patternByID(1);

  var buildInstrumentOptions = function() {
    return InstrumentService.instruments().map(function(instrument) {
     return { id: instrument.id, name: instrument.name };
    });
  };

  $scope.instrumentOptions = buildInstrumentOptions();
  $scope.$on('InstrumentService.update', function(event) {
    $scope.instrumentOptions = buildInstrumentOptions();
  });
  $scope.$on('PatternCollectionController.selectedPatternChanged', function(event, args) {
    $scope.pattern = PatternService.patternByID(args.patternID);
  });

  $scope.$on('PatternService.update', function(event) {
    $scope.pattern = PatternService.patternByID($scope.pattern.id);
  });

  $scope.updateName = function() {
    PatternService.updateName($scope.pattern.id);
  };

  $scope.addTrack = function() {
    PatternService.addTrack($scope.pattern.id);
  };

  $scope.removeTrack = function(trackIndex) {
    PatternService.removeTrack($scope.pattern.id, trackIndex);
  };

  $scope.toggleTrackMute = function(trackIndex) {
    PatternService.toggleTrackMute($scope.pattern.id, trackIndex);
  };

  $scope.updateNotes = function(trackIndex, noteIndex) {
    PatternService.updateNotes($scope.pattern.id, trackIndex, noteIndex);
  };
}]);


app.controller('SequencerController', ['$rootScope', '$scope', '$interval', 'InstrumentService', 'PatternService', 'SequencerService', 'TransportService', function($rootScope, $scope, $interval, InstrumentService, PatternService, SequencerService, TransportService) {
  var timeoutId;

  $scope.expanded = true;
  $scope.expansionToggleLabel = "<";
  $scope.tracks = SequencerService.tracks();
  $scope.selectedTrack = SequencerService.trackByID(1);
  $scope.currentStep = null;

  var buildPatternOptions = function() {
    var patternOptions = InstrumentService.instruments().map(function(instrument) {
      var instrumentPatterns = PatternService.patternsByInstrumentID(instrument.id);
      var options = instrumentPatterns.map(function(pattern) {
        return { id: pattern.id, name: pattern.name, }
      });

      options.unshift({ id: -1, name: ''});

      return options;
    });

    return patternOptions;
  };

  $scope.$on('TransportService.start', function(event) {
    var timeoutId = $interval(function() {
      $scope.syncCurrentStep();
    }, 15);
  });

  $scope.$on('TransportService.stop', function(event) {
    $interval.cancel(timeoutId);
  });

  $scope.patternOptions = buildPatternOptions();
  $scope.$on('PatternService.update', function(event) {
    $scope.patternOptions = buildPatternOptions();
  });

  $scope.changeSequencer = function(sequenceIndex) {
    SequencerService.changeSequencer(sequenceIndex);
  };

  $scope.toggleExpansion = function() {
    $scope.expanded = !$scope.expanded;

    if ($scope.expanded) {
      $scope.expansionToggleLabel = "<";
    }
    else {
      $scope.expansionToggleLabel = ">";
    }
  };

  $scope.addTrack = function() {
    var newTrack = SequencerService.addTrack();
    $scope.changeSelectedTrack(newTrack.id)
  };

  $scope.removeTrack = function(trackID) {
    var i;
    var newSelectedTrackID;

    if (trackID === $scope.selectedTrack.id) {
      i = 0;
      while (i < $scope.tracks.length && $scope.tracks[i].id !== trackID) {
        i++;
      }

      if (i === ($scope.tracks.length - 1)) {
        newSelectedTrackID = $scope.tracks[i - 1].id;
      }
      else {
        newSelectedTrackID = $scope.tracks[i + 1].id;
      }
    }
    else {
      newSelectedTrackID = $scope.selectedTrack.id;
    }

    if (newSelectedTrackID !== trackID) {
      $scope.changeSelectedTrack(newSelectedTrackID);
    }

    SequencerService.removeTrack(trackID);
    $scope.patternOptions = buildPatternOptions();
  };

  $scope.toggleTrackMute = function(trackID) {
    SequencerService.toggleTrackMute(trackID);
  };

  $scope.changeSelectedTrack = function(trackID) {
    $scope.selectedTrack = SequencerService.trackByID(trackID);
    $rootScope.$broadcast('SequencerController.selectedTrackChanged', { trackID: $scope.selectedTrack.id, });
  };

  $scope.changeTrackName = function(trackID) {
    $rootScope.$broadcast('SequencerController.trackNameChanged', { trackID: trackID, });
  }

  $scope.syncCurrentStep = function() {
    if (TransportService.currentStep()) {
      $scope.currentStep = Math.floor((TransportService.currentStep() / 16) % 8) + 1;
    }
    else
    {
      $scope.currentStep = null;
    }
  };
}]);


app.controller('TrackEditorController', ['$scope', 'SequencerService', function($scope, SequencerService) {
  $scope.trackID = 1;
  $scope.trackName = SequencerService.trackByID($scope.trackID).name;

  $scope.$on('SequencerController.selectedTrackChanged', function(event, args) {
    var track = SequencerService.trackByID(args.trackID);
    $scope.trackID = track.id;
    $scope.trackName = track.name;
  });

  $scope.$on('SequencerController.trackNameChanged', function(event, args) {
    if (args.trackID === $scope.trackID) {
      var track = SequencerService.trackByID(args.trackID);
      $scope.trackName = track.name;
    }
  });
}]);


app.controller('TransportController', ['$scope', 'SerializationService', 'TransportService', function($scope, SerializationService, TransportService) {
  var downloadEnabled = typeof document.getElementById("hidden-download-link").download !== "undefined";

  $scope.playing = false;
  $scope.amplitude = 0.25;
  $scope.tempo = 100;
  $scope.loop = true;
  $scope.downloadFileName = "js-120";

  TransportService.setPatterns(SerializationService.serialize());
  $scope.$on('InstrumentService.update', function(event) {
    TransportService.setPatterns(SerializationService.serialize());
  });
  $scope.$on('PatternService.update', function(event) {
    TransportService.setPatterns(SerializationService.serialize());
  });
  $scope.$on('SequencerService.update', function(event) {
    TransportService.setPatterns(SerializationService.serialize());
  });

  $scope.updateTempo = function() {
    TransportService.setTempo(parseInt($scope.tempo, 10));
  };

  $scope.updateAmplitude = function() {
    TransportService.setAmplitude(parseFloat($scope.amplitude));
  };

  $scope.toggle = function() {
    TransportService.toggle();
    $scope.playing = !$scope.playing;
  };

  $scope.updateLoop = function() {
    TransportService.loop = $scope.loop;
  };

  $scope.export = function() {
    if (!downloadEnabled) {
      alert("Downloading to Wave file is not supported in your browser.");
      return;
    }

    var exportCompleteCallback = function(blob) {      
      var url  = window.URL.createObjectURL(blob);

      var hiddenDownloadLink = document.getElementById("hidden-download-link");
      hiddenDownloadLink.download = $scope.downloadFileName + ".wav";
      hiddenDownloadLink.href = url;
      hiddenDownloadLink.click();

      window.URL.revokeObjectURL(blob);
    };

    TransportService.export(exportCompleteCallback);
  };
}]);
