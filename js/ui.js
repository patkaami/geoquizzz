// global review variables
let reviewData = [];
let reviewIndex = 0;
let currentReviewIndex = 0;
let playerNickname = "";
let currentQuestionIndex = 0;
function navigateTo(view, data = null, replace = false) {
    // create the state object
    const state = { view: view, data: data };

    // only store a snapshot of quizQuestions if we're in a quiz
    if (view === "quiz" && quizQuestions.length > 0) {
        // copy to avoid mutations affecting history
        state.savedQuestions = JSON.parse(JSON.stringify(quizQuestions));
        state.score = score;
        state.quizCompleted = quizCompleted;
    }

    let hash = "#" + view;

    // add question index to the URL hash
    if (view === "quiz" && data?.questionIndex !== undefined) {
        hash += "?q=" + (data.questionIndex + 1);
    }
    if (view === "review" && data) {
        hash += "?g=" + data.gameIndex + "&q=" + (data.reviewIndex + 1);
    }

    if (replace) { // replace the current history entry if replace is true
        history.replaceState(state, "", hash);
    } else { // add a new history entry
        history.pushState(state, "", hash);
    }

    // pass full state to showState so we can restore the correct quiz 
    showState(view, data, state);
}

// helper to update the current history entry with latest quiz data (e.g. after answering)
function updateHistoryState() {
    if (!history.state) return;

    const currentState = history.state;
    // only update if we are in quiz view
    if (currentState.view === "quiz") {
        currentState.savedQuestions = JSON.parse(JSON.stringify(quizQuestions));
        currentState.score = score;
        currentState.quizCompleted = quizCompleted;
        history.replaceState(currentState, "", location.hash);
    }
}


// show a view based on state
function showState(view, data, historyState = null) {
    // ensure any active alerts (like quiz completed) are closed when navigating
    Swal.close();

    // hide all sections first
    $(".categories, #nickname-container, .quiz-section, .history-section, .about-section, .side-btn-container").hide();

    switch (view) {
        case "main":
            showMainMenu();
            break;
        case "history":
            showHistoryUI(false);
            break;
        case "about":
            $(".side-btn-container").show();
            $(".about-section").show();
            $(".side-btn-container .side-btn").hide();
            break;
        case "quiz":
            // restore quizQuestions from history savedQuestions if available
            if (historyState && historyState.savedQuestions) {
                quizQuestions = historyState.savedQuestions;
                if (historyState.score !== undefined) score = historyState.score;
                if (historyState.quizCompleted !== undefined) quizCompleted = historyState.quizCompleted;
            }

            // restore question index from history data if available
            if (data && data?.questionIndex !== undefined) {
                currentQuestionIndex = data.questionIndex;
            }

            $(".quiz-section").show();
            showQuestion(false); // false prevents a double-history entry
            break;
        case "nickname":
            $("#nickname-container").show();
            break;
        case "review":      // restore review index from history data if available
            if (data?.gameIndex !== undefined) currentReviewIndex = data.gameIndex;
            if (data?.reviewIndex !== undefined) reviewIndex = data.reviewIndex;
            showReview(currentReviewIndex, false); // false prevents a double-history entry
            break;
        default:            // show main menu if view is not recognized
            showMainMenu();
    }
}

// function to show the main menu
function showMainMenu() {
    $(".categories, .side-btn-container").show();
    $(".side-btn-container .side-btn").show();
    $("#nickname-container, .quiz-section, .history-section, .about-section").hide();
}

// function to show the current question and handle clicks on options
function showQuestion(updateHistory = true) {
    const question = quizQuestions[currentQuestionIndex];
    $(".options").empty();
    $(".next-btn").hide().off("click"); // reset button
    $(".question").html(`
        <div style="display: flex; justify-content: center; width: 100%; margin-bottom: 20px;">
            <button class="back-button" style="margin: 0;">Back to menu</button>
        </div>
        <div style="color: #708d81; font-weight: bold; class='question-number'; margin-bottom: 10px;">
            Question ${currentQuestionIndex + 1} / ${quizQuestions.length}
        </div>
        ${question.text}
    `);

    if (updateHistory) { // update history if updateHistory is true 
        const replaceFirst = currentQuestionIndex === 0;
        navigateTo("quiz", { questionIndex: currentQuestionIndex }, replaceFirst);
    }

    question.options.forEach(option => {   // create a button for each option and add it to the option container
        const btn = $(`<button class="option-btn">${option}</button>`);

        // lock buttons if already answered, prevent editing answers and getting a better score
        if (question.userAnswer !== null || quizCompleted) {
            btn.prop("disabled", true);
            if (option === question.correctAnswer) btn.addClass("correct");  // highlight the correct answer
            if (option === question.userAnswer && option !== question.correctAnswer) btn.addClass("wrong");  // highlight wrong answer
        }

        btn.on("click", function () {                               // handle clicks on options
            if (question.userAnswer !== null) return;                     // already answered
            $(".option-btn").prop("disabled", true);                      // disable all options after the first click
            question.userAnswer = option;

            if (option === question.correctAnswer) {    // if the answer is correct, add class and increment score
                $(this).addClass("correct");
                score++;
            } else {                // if the answer is wrong, add a class and show the correct answer
                $(this).addClass("wrong");
                $(".option-btn").each(function () {
                    if ($(this).text() === question.correctAnswer) {
                        $(this).addClass("correct");
                    }
                });
            }

            if (currentQuestionIndex < quizQuestions.length - 1) {      // if there are more questions, show the next button
                setupNextButton("live");
                $(".next-btn").text("Next Question").show();
            } else {                    // otherwise, show the alert and save the result in local storage
                finishQuiz();
            }
            // update history state to save users answer and score progress
            updateHistoryState();
        });
        $(".options").append(btn);
    });

    // Check if the current question is already answered (e.g. going back in history)
    // If so, we need to show the appropriate navigation button because the click event won't fire
    if (question.userAnswer !== null || quizCompleted) {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setupNextButton("live");
            $(".next-btn").text("Next Question").show();
        } else {
            // It's the last question and it's answered. Show a "Finish" button so they can see the results/alert again if needed
            $(".next-btn")
                .text("Finish Quiz")
                .show()
                .on("click", function () {
                    finishQuiz();
                });
        }
    }
}

function finishQuiz() {
    quizCompleted = true;
    Swal.fire({
        title: 'Quiz Completed!',
        html: `Good job, ${playerNickname}!<br>Score: ${score}/${quizQuestions.length}`,
        icon: 'success',
        iconColor: '#708d81',
        background: '#092743',
        color: '#e3d8c0',
        position: 'top',
        width: '300',
        buttonsStyling: false,
        confirmButtonText: 'OK',
        customClass: {
            popup: 'swal-popup',
            confirmButton: 'side-btn',
            htmlContainer: 'swal-text',
            title: 'swal-title'
        }
    }).then((result) => {
        // only navigate if the user clicked OK
        // otherwise (e.g. if closed by back button/Swal.close()), do nothing
        if (result.isConfirmed) {
            saveResult(currentCategory);
            navigateTo("main", null, false);
        }
    });
}

function setupNextButton(mode) {
    $(".next-btn").off("click"); // remove previous listeners

    if (mode === "live") {
        $(".next-btn").on("click", function () {
            if (currentQuestionIndex < quizQuestions.length - 1) {
                currentQuestionIndex++;
                showQuestion(false); // show next question
                navigateTo("quiz", { questionIndex: currentQuestionIndex }, false); // add to history
            }

        });
    } else if (mode === "review") {
        $(".next-btn").on("click", function () {
            if (reviewIndex < reviewData.length - 1) {
                // move to next review question and add to history
                const nextRev = reviewIndex + 1;
                navigateTo("review", {
                    gameIndex: currentReviewIndex,
                    reviewIndex: nextRev
                }, false);
            } else {
                finishReview();
            }
        });
    }
}

// function to show the history UI
function showHistoryUI(updateHistory = true) {
    let historyData = JSON.parse(localStorage.getItem("quizHistory")) || []; // get the history data from local storage or an empty array if it doesn't exist'
    let html = "";

    // if the history data is empty, show a message to the user, otherwise show the history table
    if (historyData.length === 0) {
        html = "<p class='no-data'>You didn't play any games yet! Start a quiz to see results here. :)</p>";
    } else {
        html = `
        <table>
            <thead>
                <tr>
                    <th>Nickname</th>
                    <th>Category</th>
                    <th>Score</th>
                    <th>Date</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>`;

        historyData.forEach((item, index) => {
            html += `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td><span class="score-badge">${item.score}</span></td>
                <td>${item.date}</td>
                <td><button class="view-details-btn" data-index="${index}">Review</button></td>
            </tr>`;
        });

        html += "</tbody></table>";
    }
    $("#history-content").html(html);
    $(".categories, #nickname-container, .quiz-section").hide();
    $(".side-btn-container .side-btn").hide();
    $(".history-section").show();
    $(".side-btn-container").show();
    if (updateHistory) navigateTo("history"); // update the URL
}

// function to show the review page
function showReview(gameIndex, updateHistory = true) {
    let historyData = JSON.parse(localStorage.getItem("quizHistory")) || []; // get the history data from local storage or an empty array if it doesn't exist
    currentReviewIndex = gameIndex;
    reviewData = historyData[gameIndex].details;
    if (updateHistory) reviewIndex = 0; // reset index if this is a fresh navigation (not back button)

    $(".history-section").hide();
    $(".quiz-section").show();
    displayReviewQuestion(updateHistory);       // display the first question
}

function displayReviewQuestion(updateHistory = true) {  // function to display the current review question
    const q = reviewData[reviewIndex]; // get the current question from the review data
    if (updateHistory) {
        const shouldReplace = reviewIndex > 0;
        navigateTo("review", {
            gameIndex: currentReviewIndex,
            reviewIndex: reviewIndex
        }, shouldReplace);
    }
    $(".question").html(`
        <div style="color: #708d81; font-weight: bold; class='questionNumber'; margin-bottom: 10px;">
            Question ${reviewIndex + 1} / ${reviewData.length}
        </div>
        <div style="color:gray; font-size:12px; margin-bottom: 5px;">REVIEW MODE</div>
        ${q.text}
    `);
    $(".options").empty();

    q.options.forEach(option => {       // create a button for each option and add it to the option container, disabled
        const btn = $(`<button class="option-btn" disabled>${option}</button>`);
        if (option === q.correctAnswer) btn.addClass("correct");
        if (option === q.userAnswer && q.userAnswer !== q.correctAnswer) btn.addClass("wrong");
        $(".options").append(btn);
    });
    setupNextButton("review");

    // Update button text based on whether it is the last question
    if (reviewIndex < reviewData.length - 1) {
        $(".next-btn").text("Next Question").show();
    } else {
        $(".next-btn").text("Finish Review").show();
    }
}

function finishReview() {
    Swal.fire({
        title: 'Review mode finished!',
        html: `You can now view your other games in the History tab.`,
        icon: 'success',
        iconColor: '#708d81',
        background: '#092743',
        color: '#e3d8c0',
        position: 'top',
        width: '300',
        buttonsStyling: false,
        confirmButtonText: 'OK',
        customClass: {
            popup: 'swal-popup',
            confirmButton: 'side-btn',
            htmlContainer: 'swal-text',
            title: 'swal-title'
        }
    }).then((result) => {
        // only navigate if the user clicked OK
        if (result.isConfirmed) {
            $(".quiz-section").hide();
            showHistoryUI(true);
        }
    });
}
