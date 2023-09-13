let chunks = [];
let recorder;
let timer = 0;
let interval;
const startButton = $('.start');
const stopButton = $('.stop');
const beginButton = $('.begin');

const audioForm = document.getElementById('audio-form');
var responseAi = null;


$(document).ready(function() {
    // Get references to the dropdown and name elements
    var usersDropdown = $('#users');
    var userName = $('#user-name');
    var user = $('#user');

    // Disable the button when the page loads
    beginButton.prop('disabled', true);
  
    // Set up event listener for change event
    usersDropdown.on('change', function() {
      // If the selected option's value is not empty, enable the button
      if (usersDropdown.val() !== '') {
        beginButton.prop('disabled', false);
      // Get the selected option text
      var selectedName = usersDropdown.find('option:selected').text();
      var selectedValue = usersDropdown.val();
  
      // Update the name element
      userName.text('Dr. ' + selectedName);
      user.text(selectedValue);
      } else {
        // Otherwise, disable the button
        beginButton.prop('disabled', true);
      }     
    });
});


// Shows the app functions
beginButton.on("click", function(){
    $('.full-card-container').removeClass('d-none');
});


startButton.on("click", function() {
  startButton.addClass('d-none');
  stopButton.removeClass('d-none');
  $('.start-legend').addClass('d-none');
  $('.recording-legend').removeClass('d-none');
  $('.stop-legend').addClass('d-none');

  $('.card-container').removeClass('d-none');
  $('.card-pacient-info').addClass('d-none');
  $('.card .start').addClass('zoom-in-out-box');

  chunks = [];
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  .then(stream => {
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.start();
  });
});

stopButton.on("click", function() {
  startButton.addClass('d-none');
  stopButton.addClass('d-none');
  $('.start-legend').addClass('d-none');
  $('.recording-legend').addClass('d-none');
  $('.stop-legend').removeClass('d-none');

  // Starts the timer while transcript and summary process
  timer = 0;  // reset the timer
  minutes = 0;
  seconds = 0;
  //document.getElementById('seconds-counter').textContent =  minutes + ':' + seconds;  // update the display
  interval = setInterval(function() {  // start the interval
      timer++;
      let minutes = Math.floor(timer / 60);
      let seconds = timer % 60;
      
      // pad seconds with leading zero if less than 10
      seconds = seconds < 10 ? '0' + seconds : seconds;
      minutes = minutes < 10 ? '0' + minutes : minutes;

      document.getElementById('seconds-counter').textContent = minutes + ':' + seconds;
  }, 1000);

  recorder.stop();
  recorder.stream.getTracks().forEach(track => track.stop());

  recorder.onstop = function() {
    const blob = new Blob(chunks, { 'type' : 'audio/wav; codecs=MS_PCM' });
    const formData = new FormData();
    const datetime = new Date().toISOString().slice(0,19).replace(/:/g, '').replace(/-/g, '').replace('T', '');

    // Get references to the dropdown and name elements
    var usersDropdown = $('#users');
    // Get the selected option text
    var selectedValue = usersDropdown.val();
    
    const filename = `recorded_audio_${selectedValue}_${datetime}.wav`;
    formData.append('file', blob, filename);
    formData.append('timestamp', datetime);
    formData.append('user', selectedValue);
    fetch('/upload', { method: 'POST', body: formData })
    .then(response => response.json())
    .then(data => {
      // stop the timer
      clearInterval(interval);  

      startButton.removeClass('d-none');
      stopButton.addClass('d-none');
      $('.start-legend').removeClass('d-none');
      $('.recording-legend').addClass('d-none');
      $('.stop-legend').addClass('d-none');

      $('.card-container').addClass('d-none');
      $('.card-pacient-info').removeClass('d-none');
      $('.card .start').removeClass('zoom-in-out-box');

      
      console.log(data);

      responseAi = data;
      const summary = JSON.parse(responseAi.summary);

      $('#transcription').val(data.transcript);
      $('#pacient_name').val(summary.pacient_name);
      $('#pacient_lastname').val(summary.pacient_lastname);
      $('#pacient_birth_date').val(summary.pacient_birth_date);
      $('#consultation_motive').val(summary.consultation_motive);
      $('#prescribed_treatment').val(summary.prescribed_treatment);
      $('#requested_exams').val(summary.requested_exams);
      $('#requested_derivations').val(summary.requested_derivations);
      $('#personal_history').val(summary.anamnesis.personal_history);
      $('#family_history').val(summary.anamnesis.family_history);
      $('#physical_exploration').val(summary.physical_exploration);
      $('#diagnosis').val(summary.diagnosis);
      $('#consultation_summary').val(summary.consultation_summary);
      $('#probability_of_diagnosis_error').val(summary.ai_medical_evaluation.probability_of_diagnosis_error);
      $('#alternative_diagnosis').val(summary.ai_medical_evaluation.alternative_diagnosis);
      $('#alternative_exams_or_speciality').val(summary.ai_medical_evaluation.alternative_exams_or_speciality);
      $('#physician_empathy').val(summary.ai_human_evaluation.physician_empathy);
      $('#pacient_empathy').val(summary.ai_human_evaluation.pacient_empathy); 
      $('#pacient_experience').val(summary.ai_human_evaluation.pacient_experience);
    });
  };
});