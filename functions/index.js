'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').DialogflowApp;
const functions = require('firebase-functions');

// a. the action name from the make_name Dialogflow intent
const SAY_ACTION = 'say_name';
const SPECIFIC_DATE_ACTION = 'say_specific_date';
const APPOINTMENT_ACTION = 'make_appointment';
const SAY_PHONE_NUMBER_ACTION='say_phone_number';
const APPOINTMENT_CONFIRMATION_ACTION = 'appointment_confirmation';
const SAY_ALL_ACTION = 'say_all'; 
const SAY_WHICH_APPOINTMENT_ACTION = 'say_which_appointment';
const SAY_SPECIFIC_DATE_CUSTOM_ACION = 'say_specific_date_custom';
const MAKE_HAIR_STYLE_ACTION = 'make-hair-style';
const MAKE_HAIR_STYLE_FALLBACK_ACTION = 'make-hair-style.make-hair-style-fallback';
const SAY_SPECIFIC_DATE_FALLBACK_ACTION = 'say_specific_date.say_specific_date-fallback';
const SAY_SPECIFIC_DATE_TIME_ACTION = 'say_specific_date.say_specific_date-time';
const DEFULT_FALLBACL_ACTION = 'input.unknown';
const SAY_NAME_YES_ACTION = 'say_name.say_name-yes';
const SAY_NAME_NO_ACTION = 'say_name.say_name-no';

// b. the parameters that are parsed from the make_name intent 
const SPECIFIC_DATE_ARGUMENT = 'specific-date';
const GIVEN_NAME_ARGUMENT = 'given-name';
const PHONE_NUMBER_ARGUMENT = 'phone-number';
const HAIR_STYLIST_ARGUMENT = 'hair-stylist';
const BARBER_OFFER_ARGUMENT = 'barber-offer';
const TIME_OF_DAY_AURGUMENT = 'time';

const WHAT_TO_DO_ARGUMENT = 'Friseurangebot';
const LENGTH_OF_HAIR_ARGUMENT = 'Haarlaenge';


const i18n = require('i18n');
const moment = require('moment');
var counterActionFurtherInquiries = 0;
var counterLengthFurtherInquiries = 0;



 // There is an empty appointment, this will be filled with user data
 function NewAppointment(freeDate, timeOfDay, duration, hairStylist, whatToDo, customerName, phoneNumber, emailAddress, lengthOfHair) {
    this.freeDate = freeDate;
    this.timeOfDay = timeOfDay;
    this.duration = duration;
    this.hairStylist = hairStylist;
    this.whatToDo = whatToDo;
    this.customerName = customerName;
    this.phoneNumber = phoneNumber;
    this.emailAddress = emailAddress;
    this.lengthOfHair = lengthOfHair;
  }
  
  // The empty appointment
var newAppointment = new NewAppointment();


exports.sillyNameMaker = functions.https.onRequest((request, response) => {

  const app = new App({request, response});
  /*i18n.use(app);
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

  i18n.configure({
    locales: ['de-DE'],
    directory: __dirname + '/locales',
    defaultLocale: 'de-DE'
  });

  i18n.setLocale(app.getUserLocale());
  moment.locale(app.getUserLocale());*/

  // date will be formated
  function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
   
    //return [year, month, day].join('-');
    return[day, month, year].join('.');
  }

  //date will return to calculate with
  function formatDate2(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return d;
  }

  //calculate days between
  Date.daysBetween = function( date1, date2 ) {
  //Get 1 day in milliseconds
  var one_day=1000*60*60*24;

  // Convert both dates to milliseconds
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();

  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;
    
  // Convert back to days and return
  return Math.round(difference_ms/one_day); 
 }
  
  //This class is for free time slots 
  function FreeAppointment(freeDate, timeOfDay, duration, hairStylist, daytime, jobTitle) {
    this.freeDate = freeDate;
    this.timeOfDay = timeOfDay;
    this.duration = duration;
    this.hairStylist = hairStylist;
    this.daytime = daytime;
    this.jobTitle = jobTitle;
  }

  
  NewAppointment.prototype.setfreeDate = function(freeDateLocal) {
    this.freeDate = freeDateLocal;
  }

  NewAppointment.prototype.setTimeOfDay = function(timeOfDayLocal) {
    this.timeOfDay = timeOfDayLocal;
  }

  NewAppointment.prototype.setDuration = function(durationLocal) {
    this.duration = durationLocal;
  }

  NewAppointment.prototype.setHairStylist = function(hairStylistLocal) {
    this.hairStylist = hairStylistLocal;
  }

  NewAppointment.prototype.setWhatToDo = function(whatToDoLocal) {
    this.whatToDo = whatToDoLocal;
  }

  NewAppointment.prototype.setCustomerName = function(customerNameLocal) {
    this.customerName = customerNameLocal;
  }

   NewAppointment.prototype.setPhoneNumber= function(phoneNumberLocal) {
    this.phoneNumber = phoneNumberLocal;
  }

   NewAppointment.prototype.setEmailAddress = function(emailAddressLocal) {
    this.emailAddress = emailAddressLocal;
  }

    NewAppointment.prototype.setHairLength = function(lengthOfHairLocal) {
    this.lengthOfHair = lengthOfHairLocal;
  }

  //Here will be calculated if the user date fits to the free dates
  function calculateFreeAppointment(app, givenDate, givenTime = 0, givenHairStylist = 0, givenOffer = 0){
    //new dates will be created
    var freeAppointment1 = new FreeAppointment(formatDate2('Apr 20,2018'), '16:30:00', 2, 'Frau Müller', 'Nachmittags', 'senior');
    var freeAppointment2 = new FreeAppointment(formatDate2('Apr 20,2018'), '16:30:00', 2, 'Frau Dackel', 'Nachmittags', 'senior');
    var freeAppointment3 = new FreeAppointment(formatDate2('Apr 22,2018'), '16:00:00', 4, 'Frau Müller', 'Nachmittags', 'senior');
    var freeAppointment4 = new FreeAppointment(formatDate2('Apr 20,2018'), '13:30:00', 1, 'Herr James', 'Mittags', 'junior');
    var freeAppointment5 = new FreeAppointment(formatDate2('Apr 25,2018'), '10:00:00', 5, 'Frau Blau', 'Vormittags', 'junior');
    var freeAppointment6 = new FreeAppointment(formatDate2('Apr 01,2018'), '08:15:00', 4, 'Herr James', 'Vormittags', 'Geschäftsführer');
    var freeAppointment7 = new FreeAppointment(formatDate2('Apr 02,2018'), '12:30:00', 2, 'Herr Klein', 'Mittags', 'Praktikant');
    var freeAppointment8 = new FreeAppointment(formatDate2('Apr 02,2018'), '18:30:00', 2, 'Frau Dackel', 'Abends', 'Praktikant');
    //Move all free dates in an array 
    var differentAppointment = [freeAppointment1, freeAppointment2, freeAppointment3, freeAppointment4, freeAppointment5, freeAppointment6, freeAppointment7, freeAppointment8];


    var dates = new Array();
    var alternativeDates = new Array();

    for(var i = 0; i < differentAppointment.length; i++){
      if( Date.daysBetween(differentAppointment[i].freeDate, givenDate) === 0){
        dates.push(differentAppointment[i]); 
        }else if(Date.daysBetween(differentAppointment[i].freeDate, givenDate) === 1 || Date.daysBetween(differentAppointment[i].freeDate, givenDate) === -1 ){
            alternativeDates.push(differentAppointment[i]);       
        }
      }
          
      if(dates.length === 1){
          //app.ask('Am ' + formatDate(givenDate) + ' haben wir einen Termin um ' + dates[0].timeOfDay + ' bei ' + dates[0].hairStylist + '. Ist der Termin in Ordnung?');
          newAppointment.setTimeOfDay(dates[0].timeOfDay);
          newAppointment.setHairStylist(dates[0].hairStylist);
          newAppointment.setfreeDate(givenDate);
          app.ask('Wir hätten am ' + formatDate(givenDate) +  ' um ' + dates[0].timeOfDay + ' Uhr einen Termin frei. Würde dieser für dich passen?');

      }else if(dates.length > 1){
          
          var allDates = dates[0].timeOfDay;

          for(var i = 1; i < dates.length; i++){
            allDates += ' und ';
            allDates += dates[i].timeOfDay;
          }

          newAppointment.setfreeDate(dates);
          app.ask('Wir hätten am ' + formatDate(givenDate) +  ' um ' + allDates + ' Uhr einen Termin frei. Würde einer dieser Termine für dich passen?');

 
          //app.ask('Am ' + formatDate(givenDate) + ' haben wir Termin 1 um ' + dates[0].timeOfDay + ' bei ' + dates[0].hairStylist + '. Termin 2 um ' + dates[1].timeOfDay + ' bei ' + dates[1].hairStylist + 'und Termin 3 um ' + dates[2].timeOfDay + ' bei '  + dates[2].hairStylist + 'Möchtest du Termin 1, 2 oder 3?'); 
      }else if(dates.length === 0 && alternativeDates.length === 1 ){
          app.ask('Am ' + formatDate(givenDate) + ' haben wir keinen Termin. Wir hätten einen Termin am ' + formatDate(alternativeDates[0].freeDate) + ' um' + alternativeDates[0].timeOfDay + ' bei ' + alternativeDates[0].hairStylist + '. Ist dieser Termin in Ordnung? Ansonsten kannst du ein anderes Datum vorschlagen.');
      }else if(dates.length === 0 && alternativeDates.length > 1 ){
          app.ask('Am ' + formatDate(givenDate) + ' haben wir keinen Termin. Wir hätten in diesem Zeitraum ' + alternativeDates.length + ' andere Termine.');
      }else{
          app.ask('In diesem Zeitraum gibt es leider keine Termine ' + givenDate + ' und ' + formatDate(givenDate));
      }
        
          //app.ask('Wir haben leider keinen Termin an dem Tag. Wir hätten einen Termin am');
}


  
  function responseHandler (app) {
  // intent contains the name of the intent you defined in the Actions area of Dialogflow
    let intent = app.getIntent();
    switch (intent) {

      case SAY_SPECIFIC_DATE_TIME_ACTION:
        let givenTime = app.getArgument(TIME_OF_DAY_AURGUMENT);
        //app.ask('und ' + givenTime + ' und ' + newAppointment.freeDate[0].timeOfDay) ;

        for(var i = 1; i < newAppointment.freeDate.length; i++){
          if(newAppointment.freeDate[i].timeOfDay === givenTime){
            newAppointment.setfreeDate(newAppointment.freeDate[i].freeDate);
            newAppointment.setTimeOfDay(givenTime); 
            app.ask('Für wen darf ich den Termin eintragen?');

          }else{
            app.ask('Es gibt keine Uhrzeit an diesem Tag.');

          }
        }

      
      break;
      
      case MAKE_HAIR_STYLE_FALLBACK_ACTION:

      if(newAppointment.whatToDo === undefined && counterFurtherInquiries === 0){
        counterFurtherInquiries++;
        app.ask('Ich habe dich leider nicht richtig verstanden. Was möchtest du machen lassen? Wir bieten z.B. Haare schneiden, Farbe oder Strähnchen an. Sowohl für Herren als auch für Damen und Kinder.');
      } else if(newAppointment.whatToDo === undefined && counterFurtherInquiries > 0){
        app.ask('Ich habe dich leider nicht richtig verstanden. Was möchtest du machen lassen?');
      } else if(newAppointment.whatToDo != undefined && counterLengthFurtherInquiries === 0 && newAppointment.lengthOfHair === undefined){
        app.ask('Ich habe dich leider nicht richtig verstanden. Brauchst du einen Langhaar oder Kurzhaarschnitt?');
      
      } else if(newAppointment.whatToDo != undefined && counterLengthFurtherInquiries > 0 && newAppointment.lengthOfHair === undefined){
        app.ask('Ich habe dich leider nicht richtig verstanden. Brauchst du einen Langhaar oder Kurzhaarschnitt?');
      } else{
        app.ask('Ich habe dich leider nicht verstanden');
      }


      break;

      case SAY_SPECIFIC_DATE_FALLBACK_ACTION:
        var recommendedDates = newAppointment.freeDate[0].timeOfDay;
          for(var i = 1; i < newAppointment.freeDate.length; i++){
            recommendedDates += ' und ';
            recommendedDates += newAppointment.freeDate[i].timeOfDay;
          }

         app.ask('Ich habe dich leider nicht verstanden. Wir hätten am ' + formatDate(newAppointment.freeDate[0].freeDate) +  ' um ' + recommendedDates + ' Uhr einen Termin frei. Würde einer dieser Termine für dich passen?');
      break;

       case MAKE_HAIR_STYLE_ACTION:
        let givenWhatToDo = app.getArgument(WHAT_TO_DO_ARGUMENT);
        let givenLengthOFHair = app.getArgument(LENGTH_OF_HAIR_ARGUMENT);

      
        if(givenWhatToDo === null && counterFurtherInquiries === 0){
          counterFurtherInquiries++;
          if(givenLengthOFHair != null){
            newAppointment.setHairLength(givenLengthOFHair);
          }
          app.ask('Ich habe dich leider nicht richtig verstanden. Was möchtest du machen lassen? Wir bieten z.B. Haare schneiden, Farbe oder Strähnchen an. Sowohl für Herren als auch für Damen und Kinder.');
        }else if (givenWhatToDo === null && counterFurtherInquiries > 0) {
          if(givenLengthOFHair != null){
            newAppointment.setHairLength(givenLengthOFHair);
          }
          app.ask('Ich habe dich leider nicht richtig verstanden. Was möchtest du machen lassen?');
        } else if(givenWhatToDo != null && givenLengthOFHair === null && counterLengthFurtherInquiries === 0){
          if(givenWhatToDo != null){
            newAppointment.setWhatToDo(givenWhatToDo);
          }

          app.ask('Langhaar oder Kurzhaarschnitt?');
          
        } else if(givenWhatToDo != null && givenLengthOFHair === null && counterLengthFurtherInquiries > 0){
          if(givenWhatToDo != null){
            newAppointment.setWhatToDo(givenWhatToDo);
          }
          counterLengthFurtherInquiries++;
           app.ask('Ich habe dich leider nicht richtig verstanden. Brauchst du einen Langhaar oder Kurzhaarschnitt?');

        } else if(givenWhatToDo != null &&  givenLengthOFHair != null ){
          
          if(givenWhatToDo != null){
            newAppointment.setWhatToDo(givenWhatToDo);
          }
           if(givenLengthOFHair != null){
            newAppointment.setHairLength(givenLengthOFHair);
          }
        
          app.ask('Wann hast du denn Zeit für den Friseurtermin?');

        } else { 
           app.ask('Ende der Welt1'+ newAppointment.whatToDo + " " + newAppointment.lengthOfHair);
        }

      break;


     //CHeck if date is available or if it's the start
      case SAY_ACTION:
        let name = app.getArgument(GIVEN_NAME_ARGUMENT);
        newAppointment.setCustomerName(name);
        newAppointment.customerName = name;
        app.ask('Super. Dann trage ich am ' + formatDate(newAppointment.freeDate) + ' den Termin auf ' + name + ' in unseren Kalender ein. Hast du sonst noch ein Anliegen?');
      break;

      case SPECIFIC_DATE_ACTION:
        let date = app.getArgument(SPECIFIC_DATE_ARGUMENT);
        date = formatDate2(date);
        calculateFreeAppointment(app, date);
        
        
      break;

      case APPOINTMENT_ACTION:
        app.ask('Sehr gut. Kann ich den Termin für ' + newAppointment.customerName + ' am ' +  newAppointment.freeDate + ' um ' + newAppointment.timeOfDay + ' bei ' + newAppointment.hairStylist + ' eintragen?');
      break;

      case SAY_PHONE_NUMBER_ACTION:
      let givenPhoneNumber = app.getArgument(PHONE_NUMBER_ARGUMENT);
      newAppointment.setPhoneNumber(givenPhoneNumber);
      app.ask('Sollte sich etwas ändern, meldet wir uns mit dieser Nummer bei Ihnen: ' + givenPhoneNumber + '. Auf welchem Namen kann ich den Termin abspeichern?');

      break;

      case SAY_ALL_ACTION:
       let dateAll = app.getArgument(SPECIFIC_DATE_ARGUMENT);
       let timeAll = app.getArgument(TIME_OF_DAY_AURGUMENT);
       let whatToDoAll = app.getArgument(BARBER_OFFER_ARGUMENT);
       let hairStylistAll = app.getArgument(HAIR_STYLIST_ARGUMENT);
       dateAll = formatDate2(dateAll);
       calculateFreeAppointment(app, dateAll);
       break;

       case SAY_WHICH_APPOINTMENT_ACTION:
       let param = app.getSelectedOption();
       if(!param){
        let appointmentNumber = app.getArgument(APPOINTMENT_NUMBER_ARGUMENT);
      }else{
        appointmentNumber = param;
      }


      for(var i = 0; i < newAppointment.freeDate.length; i++){

        if((appointmentNumber-1) === i){
          //newAppointment.setfreeDate(newAppointment.freeDate[i].freeDate);
          //newAppointment.setHairStylist(newAppointment.freeDate[i]
          app.ask('Ihr Termin ist am ' + newAppointment.freeDate[0].freeDate);
        }
      }
       break;

       case SAY_SPECIFIC_DATE_CUSTOM_ACION:
       const param2 = app.getSelectedOption();
       const appointmentNumber = parseInt( param2 );  

       for(var i = 0; i < newAppointment.freeDate.length; i++){

        if((appointmentNumber-1) === i){

          //newAppointment.setfreeDate(newAppointment.freeDate[i].freeDate);
          //newAppointment.setHairStylist(newAppointment.freeDate[i]
          app.ask('Ihr Termin ist am ' + formatDate(newAppointment.freeDate[0].freeDate) + 'Kann ich den Termin um [Uhrzeit], bei [HaisrStylist] eintragen?');
        }else{
          app.ask('Ihre Wahl' + appointmentNumber + param2);
        }
       }

       break;

       case SAY_NAME_YES_ACTION:
        app.ask('Vielen dank für deine Buchung. Falls du noch Fragen zum Termin hast kannst du dich jederzeit beim Friseursalon Cut unter der 01723456432 melden. (Zur Info: ' + newAppointment.freeDate + ' ' + newAppointment.timeOfDay + ' ' + newAppointment.hairStylist + ' ' + newAppointment.whatToDo + ' ' +  newAppointment.customerName + ' ' +  newAppointment.lengthOfHair);
       break;


       case SAY_NAME_NO_ACTION:
        app.ask('Vielen dank für deine Buchung. Falls du noch Fragen zum Termin hast kannst du dich jederzeit beim Friseursalon Cut unter der 01723456432 melden. (Zur Info: ' + newAppointment.freeDate + ' ' + newAppointment.timeOfDay + ' ' + newAppointment.hairStylist + ' ' + newAppointment.whatToDo + ' ' +  newAppointment.customerName + ' ' +  newAppointment.lengthOfHair);
       break;

       case DEFULT_FALLBACL_ACTION:

      if(newAppointment.whatToDo === undefined){
        app.ask('Ich habe dich leider nicht richtig verstanden. Was möchtest du machen lassen? Wir bieten z.B. Haare schneiden, Farbe oder Strähnchen an. Sowohl für Herren als auch für Damen und Kinder.');
      } else if(newAppointment.lengthOfHair === undefined &&  newAppointment.whatToDo != undefined){
        app.ask('Ich habe dich leider nicht richtig verstanden. Soll ich den Termin für lange oder kurze Haare eintragen?');
      } else if(newAppointment.freeDate === undefined && newAppointment.lengthOfHair != undefined ){
        app.ask('Ich habe dich leider nicht richtig verstanden. Wann hast du denn Zeit für den Friseurtermin?');
      
      } else if(newAppointment.timeOfDay === undefined && newAppointment.freeDate != undefined){
        app.ask('Ich habe dich leider nicht richtig verstanden. Welche Uhrzeit möchtest du?');
      } else if(newAppointment.customerName === undefined && newAppointment.timeOfDay != undefined){
          app.ask('Ich habe dich leider nicht verstanden. Auf welchem Namen darf ich den Termin eintragen?');
      } else{
        app.ask('Ich habe dich leider nicht verstanden.');
      }

       break;
    
    }

  
  /*responseHandler.set(app.StandardIntents.OPTION, () => {
  const param = app.getSelectedOption();
  if (!param) {
    app.ask('You did not select any item from the list or carousel');
  } else if (param === 'Termin 1') {
    app.ask('42 is an abundant number because the sum of its…');
  } else if (param === 'Termin 2') {
    app.ask('42 gods who ruled on the fate of the dead in the...');
  } else if (param === 'RECIPES') {
    app.ask('Here\'s a beautifully simple recipe that\'s full...');
  } else {
    app.ask('You selected an unknown item from the list or carousel');
  }
});*/

  }


// you can add the function name instead of an action map
app.handleRequest(responseHandler);

});

