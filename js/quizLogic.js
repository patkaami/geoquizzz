// global quiz variables
let quizQuestions = [];
let currentCategory = "";
let score = 0;
let quizCompleted = false;

// select countries for the quiz based on mistakes and if they are new or not
function selectUnusedCountry(count) {
    const historyData = JSON.parse(localStorage.getItem("quizHistory")) || [];
    const stats = {};

    // build stats for mistakes
    for (let game of historyData) {
        for (let question of game.details) {
            const key = question.countryName + "-" + game.category;         // country name and category
            if (!stats[key]) stats[key] = { mistakes: 0 };                   // initialize stats for the country    
            if (question.userAnswer !== question.correctAnswer) stats[key].mistakes++;          // increment mistakes if answer is wrong
        }
    }

    // separate arrays for new, struggling and mastered questions
    let newQ = [];
    let strugglingQ = [];
    let masteredQ = [];

    for (let country of countriesData) {
        const key = country.name.common + "-" + currentCategory;         // country name and category
        const info = stats[key];

        if (!info) newQ.push(country);               // never seen
        else if (info.mistakes > 0) strugglingQ.push(country); // mistakes made
        else masteredQ.push(country);               // always correct
    }

    // shuffle each category individually to get random order
    newQ = shuffle(newQ);
    strugglingQ = shuffle(strugglingQ);
    masteredQ = shuffle(masteredQ);

    // combine arrays
    const combinedArr = newQ.concat(strugglingQ, masteredQ);

    // pick exactly 5 unique countries
    const selected = [];
    const added = new Set();

    for (let country of combinedArr) {
        if (!added.has(country.name.common)) {
            selected.push(country);
            added.add(country.name.common);
            if (selected.length === count) break;
        }
    }
    return selected;
}

// generate questions based on category
function generateQuestions(category) {
    const questions = [];
    currentCategory = category;

    // get 5 countries for the quiz
    const sampleCountries = selectUnusedCountry(5);

    sampleCountries.forEach(country => {        // loop through countries
        const question = {                // create a question object for each country
            countryName: country.name.common,
            text: "",
            correctAnswer: "",
            options: [],
            userAnswer: null
        };

        let selectedCategory = category;

        // if a category is Mix, pick a random category from the list
        if (category === "Mix") {
            const categories = ["Flags", "Capitals", "Trivia"];
            selectedCategory = categories[Math.floor(Math.random() * categories.length)];
        }

        // if a category is Flags, show a flag image
        if (selectedCategory === "Flags") {
            question.text = `
                Which country's flag is this?<br>
                <img src="${country.flags.png}" style="max-height:130px;margin-top:10px;">`;
            question.correctAnswer = country.name.common;
            question.options = getUniqueOptions(        // get options from the correct answer and country other than the correct one
                question.correctAnswer,
                country => country.name.common
            );
        }

        // if a category is Capitals, show the question for capital of the country
        else if (selectedCategory === "Capitals") {
            question.text = `What is the capital of ${country.name.common}?`;
            let correctCapital = "Doesn't have a capital";
            if (country.capital && country.capital.length > 0) {        // if the country has a capital, use it as the correct answer
                correctCapital = country.capital[0];
            }
            question.correctAnswer = correctCapital;
            question.options = getUniqueOptions(            // get options from the correct answer and country other than the correct one
                correctCapital,
                function (country) {
                    if (country.capital && country.capital.length > 0) {   // if the country has a capital, use it as an option, else return "Doesn't have a capital"
                        return country.capital[0];
                    }
                    return "Doesn't have a capital";
                }
            );
        }

        // if a category is Trivia, show a random question based on the type
        else if (selectedCategory === "Trivia") {
            const triviaTypes = ["language", "currency", "population", "area"];
            const type = triviaTypes[Math.floor(Math.random() * triviaTypes.length)];

            if (type === "language") {      // if type is language, show a question about language, get a first language and generate options from it and the other countries
                question.text = `Which language is spoken in ${country.name.common}?`;
                question.correctAnswer = getFirstLanguage(country);
                question.options = getUniqueOptions(question.correctAnswer, c => getFirstLanguage(c));
            }
            else if (type === "currency") {  // if type is currency, show a question about currency, get a first currency and generate options from it and the other countries
                question.text = `What currency is used in ${country.name.common}?`;
                question.correctAnswer = getFirstCurrency(country);
                question.options = getUniqueOptions(question.correctAnswer, c => getFirstCurrency(c));
            }
            else if (type === "population") {  // if type is population, show a question about population; locales are used to format the answer to avoid commas in the number, generate options from it and the other countries
                question.text = `What is the approximate population of ${country.name.common}?`;
                question.correctAnswer = country.population.toLocaleString();
                question.options = getUniqueOptions(question.correctAnswer, c => c.population.toLocaleString());
            }
            else {      // if type is area, show a question about area; locales are used to format the answer to avoid commas in the number, generate options from it and the other countries
                question.text = `What is the approximate area of ${country.name.common}?`;
                question.correctAnswer = country.area.toLocaleString() + " km²";
                question.options = getUniqueOptions(question.correctAnswer, c => c.area.toLocaleString() + " km²");
            }
        }

        questions.push(question);   // add question to the array
    });

    return questions;
}

// save quiz result to localStorage
function saveResult(categoryName) {
    let historyData = JSON.parse(localStorage.getItem("quizHistory")) || [];  // load history from localStorage or create an empty array if it doesn't exist'

    const newEntry = {  // create a new entry for the history stats
        name: playerNickname || "Guest",
        category: categoryName,
        score: `${score}/${quizQuestions.length}`,
        date: new Date().toLocaleString(),
        details: JSON.parse(JSON.stringify(quizQuestions))  // save questions array as JSON for review mode
    };

    historyData.unshift(newEntry);            // add to top
    if (historyData.length > 10) historyData.pop(); // keep last 10 games
    localStorage.setItem("quizHistory", JSON.stringify(historyData)); // save to localStorage
}
