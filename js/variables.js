const bgColor = "#0f0f0f";
const txtColor = "white"; 

const parseDate = d3.timeParse("%Y-%m-%d");
const formatDate = d3.timeFormat("%B");
const formatDateMob = d3.timeFormat("%b");

const bisect = d3.bisector(function(d) { return d.x; }).left;

//виміряємо ширину контейнера з heatmap
const wrapper =  d3.select("#heatmap").node().getBoundingClientRect().width;  

//розмір одного знімку у гріді
const gridItem = 200;

var locale = d3.timeFormatLocale({
    "dateTime": "%A, %e %B %Y г. %X",
    "date": "%d.%m.%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": ["неділя", "понеділок", "вівторок", "середа", "четвер", "п'ятница", "субота"],
    "shortDays": ["нд", "пн", "вт", "ср", "чт", "пт", "сб"],
    "months": ["січень", "лютий", "березень", "квітень", "травень", "червень", "липень", "серпень", "вересень", "жовтень", 
    "листопад", "грудень"],
    "shortMonths": ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"]
});

var formatMillisecond = locale.format(".%L"),
    formatSecond = locale.format(":%S"),
    formatMinute = locale.format("%I:%M"),
    formatHour = locale.format("%I %p"),
    formatDay = locale.format("%a %d"),
    formatWeek = locale.format("%b %d"),
    formatMonth = locale.format("%B"),
    formatShortMonth = locale.format("%b"),
    formatYear = locale.format("%Y");

       
   /*   $.ajax({
        type: "GET",
        contentType: "application/json",
        dataType: "json",
        url: API_ROOT + "/api/v1/firestat/?format=json"
    }).done(function(json) {

        console.log(json);

    })  */