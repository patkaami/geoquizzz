// global variable to store countries data
let countriesData = [];

// fetch all countries from REST Countries API
$.getJSON(
    "https://restcountries.com/v3.1/all?fields=name,capital,flags,languages,population,currencies,area",
    function (data) {
        countriesData = data;              // save data to global variable
        $(".category-btn").prop("disabled", false); // enable category buttons when data is loaded
        console.log("Countries data loaded:", countriesData.length);
    }
);

// randomly shuffles items in an array, returns the shuffled array
function shuffle(array) {
    let copy = array.slice();
    copy.sort(function () {
        return Math.random() - 0.5;
    });
    return copy;
}

// returns one random country from the loaded data
function getRandomCountry() {
    let randomIndex = Math.floor(Math.random() * countriesData.length);
    return countriesData[randomIndex];
}

// gets the first currency of a country (if it has one)
function getFirstCurrency(country) {
    if (!country.currencies) {
        return "Doesn't have an official currency";
    }
    let currency = country.currencies[Object.keys(country.currencies)[0]];
    return currency.name + " (" + (currency.symbol || "") + ")";
}

// gets the first language of a country (if it has one)
function getFirstLanguage(country) {
    if (!country.languages) {
        return "Doesn't have an official language";
    }
    return country.languages[Object.keys(country.languages)[0]];
}

// creates exactly 4 DIFFERENT answer options
function getUniqueOptions(correctAnswer, getValueFromCountry) {
    let options = [];
    options.push(correctAnswer);
    while (options.length < 4) {
        let randomCountry = getRandomCountry();
        let value = getValueFromCountry(randomCountry);
        if (value && !options.includes(value)) {
            options.push(value);
        }
    }
    return shuffle(options);
}