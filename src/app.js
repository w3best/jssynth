"use strict";

var app = angular.module('js110', []);

app.controller('controller', ['$scope', function($scope) {
  var audioContext;
  var transport;
  var track;

  $scope.playing = false;
  $scope.waveform = 'sawtooth';
  $scope.amplitude = 0.75;
  $scope.lfoWaveform = 'sine'
  $scope.lfoFrequency = 5;
  $scope.lfoAmplitude = 0;
  $scope.filterCutoff = 1000;
  $scope.filterResonance = 0;
  $scope.filterLFOWaveform = 'sine'
  $scope.filterLFOFrequency = 5;
  $scope.filterLFOAmplitude = 0;
  $scope.envelopeAttack = 0.0;
  $scope.envelopeDecay = 0.0;
  $scope.envelopeSustain = 1.0;
  $scope.envelopeRelease = 0.0;
  $scope.tempo = 100;
  $scope.loop = true;
  $scope.tracks = [{
                     notes: [{name: 'C3'},
                             {name: ''},
                             {name: 'Eb3'},
                             {name: 'F3'},
                             {name: 'G3'},
                             {name: 'Bb4'},
                             {name: 'F3'}, 
                             {name: 'Bb4'}],
                   },
                   {
                     notes: [{name: 'C3'},
                             {name: ''},
                             {name: 'C3'},
                             {name: 'C3'},
                             {name: 'C3'},
                             {name: 'C4'},
                             {name: 'C3'}, 
                             {name: 'C4'}],
                   },
                   {
                     notes: [{name: 'Eb1'},
                             {name: ''},
                             {name: 'Eb1'},
                             {name: 'Eb1'},
                             {name: 'Eb1'},
                             {name: 'Eb1'},
                             {name: 'Eb1'}, 
                             {name: 'Eb1'}],
                   },
                   {
                     notes: [{name: 'G5'},
                             {name: 'D3'},
                             {name: 'Eb5'},
                             {name: 'G5'},
                             {name: 'Eb5'},
                             {name: 'G5'},
                             {name: 'Eb5'}, 
                             {name: 'G5'}],
                   },];

  var toGenericConfig = function() {
    var filterCutoff = parseInt($scope.filterCutoff, 10);

    return {
      waveform:  $scope.waveform,
      amplitude: parseFloat($scope.amplitude),
      lfo: {
        waveform:  $scope.lfoWaveform,
        frequency: parseFloat($scope.lfoFrequency),
        amplitude: parseInt($scope.lfoAmplitude, 10),
      },
      filter: {
        cutoff:    filterCutoff,
        resonance: parseInt($scope.filterResonance, 10),
        lfo: {
          waveform:  $scope.filterLFOWaveform,
          frequency: parseFloat($scope.filterLFOFrequency),
          amplitude: parseFloat($scope.filterLFOAmplitude) * filterCutoff,
        },
      },
      envelope: {
        attack:  parseFloat($scope.envelopeAttack),
        decay:   parseFloat($scope.envelopeDecay),
        sustain: parseFloat($scope.envelopeSustain),
        release: parseFloat($scope.envelopeRelease),
      },
    };
  };

  var parseNotes = function() {
    var result = [];

    for (var t = 0; t < $scope.tracks.length; t++) {
      var rawNotes = [];
      for (var n = 0; n < $scope.tracks[t].notes.length; n++) {
        rawNotes[n] = $scope.tracks[t].notes[n].name;
      }

      result.push(rawNotes.join(' '));
    }

    return result;
  };

  var stopCallback = function() {
    $scope.playing = false;
    $scope.$digest();
  };

  $scope.init = function() {
    if (window.AudioContext) {
      audioContext = new AudioContext();

      var config = toGenericConfig();
      var instrument = new JSSynth.Instrument(audioContext, config);
      
      var tracks = [];
      var parsedTracks = parseNotes();
      for (var i = 0; i < parsedTracks.length; i++) {
        var sequence = JSSynth.SequenceParser.parse(parsedTracks[i]);
        track = new JSSynth.Track(instrument, sequence);
        tracks.push(track);
      }

      transport = new JSSynth.Transport(audioContext, tracks, stopCallback);
      transport.setTempo(parseInt($scope.tempo, 10));
    }
    else {
      alert("Your browser doesn't appear to support WebAudio, and so won't be able to use the JS-110. Try a recent version of Chrome, Safari, or Firefox.");
      return;
    }
  };
  $scope.init();

  $scope.updateInstrument = function() {
    var config = toGenericConfig();
    console.log(config);
    var instrument = new JSSynth.Instrument(audioContext, config);
    track.instrument = instrument;
  };

  $scope.updateNotes = function() {
    // Should see how to update just the relevant track/note, rather than all tracks/notes
    track.setNotes(parseNotes());
  };

  $scope.updateTempo = function() {
    transport.setTempo(parseInt($scope.tempo, 10));
  };

  $scope.updateLoop = function() {
    transport.loop = $scope.loop;
  };

  $scope.toggle = function() {
    transport.toggle();
    $scope.playing = !$scope.playing;
  };

  $scope.export = function() {
    var offlineAudioContext = new webkitOfflineAudioContext(1, 44100 * 4, 44100);

    var instrument = new JSSynth.Instrument(offlineAudioContext, toGenericConfig());

    var tracks = [];
    var parsedTracks = parseNotes();
    for (var i = 0; i < parsedTracks.length; i++) {
      var sequence = JSSynth.SequenceParser.parse(parsedTracks[i]);
      track = new JSSynth.Track(instrument, sequence);
      tracks.push(track);
    }

    var offlineTransport = new JSSynth.OfflineTransport(offlineAudioContext, tracks, function() { });
    offlineTransport.setTempo(parseInt($scope.tempo, 10));
    offlineTransport.tick();
  };
}]);

app.directive('noteInput', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ctrl) {
       if (!ctrl) return;

       function formatNoteValue(rawValue) {
         var formattedValue = rawValue;

         // Make first character uppercase (but not subsequent characters, to avoid
         // making a 'b' uppercase, which will mess with ♭ replacement).
         var firstCharacter = formattedValue.substr(0, 1);
         formattedValue = firstCharacter.toUpperCase() + formattedValue.substr(1);

         formattedValue = formattedValue.replace("##", "𝄪");
         formattedValue = formattedValue.replace("#", "♯");
         formattedValue = formattedValue.replace("bb", "𝄫");
         formattedValue = formattedValue.replace("b", "♭");

         return formattedValue;
       };

       ctrl.$formatters.push(function (a) {
         return formatNoteValue(ctrl.$modelValue);
       });

       ctrl.$parsers.unshift(function (viewValue) {
         var parsedValue = viewValue;

         // Make first character uppercase (but not subsequent characters, to avoid
         // making a 'b' uppercase, which will mess with ♭ replacement).
         var firstCharacter = viewValue.substr(0, 1);
         parsedValue = firstCharacter.toUpperCase() + viewValue.substr(1);
         parsedValue = parsedValue.replace("♯", "#");
         parsedValue = parsedValue.replace("𝄪", "##");
         parsedValue = parsedValue.replace("♭", "b");
         parsedValue = parsedValue.replace("𝄫", "bb");

         if (/^$|^-$|(^[A-G](b|bb|#|##){0,1}[0-7]$)/.test(parsedValue)) {
           ctrl.$setValidity('noteInput', true);
           return parsedValue;
         }
         else {
           ctrl.$setValidity('noteInput', false);
           return '';
         }
       });

       element.bind('blur', function(e) {
         element.val(formatNoteValue(element.val()));
       });

       element.bind('keydown', function(e) {
         if (e.keyCode === 32) {  // Space bar
           element.val('');
         }
         else if (e.keyCode === 37) {  // Left arrow key
           if (element[0].selectionStart === 0 && !(element.hasClass('first'))) {
             var noteIndex = parseInt(element[0].id.split("-")[1], 10);
             var nextNoteId = 'note-' + (noteIndex - 1);
           
             document.getElementById(nextNoteId).focus();
           }
         }
         else if (e.keyCode === 39) {  // Right arrow key
           if (element[0].selectionEnd === element.val().length && !(element.hasClass('last'))) {
             var noteIndex = parseInt(element[0].id.split("-")[1], 10);
             var nextNoteId = 'note-' + (noteIndex + 1);
           
             document.getElementById(nextNoteId).focus();
           }
         }
       });

       element.bind('keyup', function(e) {
         if (e.keyCode === 32) {  // Space bar
           element.val('');
         }
       });
    }
  };
});
