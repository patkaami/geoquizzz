$(document).ready(function () {
    // if history is empty, add the main page to it
    if (!history.state) {
        history.replaceState({ view: "main" }, "", "#main");
    }

    // category button click event handler - show nickname input before starting quiz
    $(".category-btn").on("click", function () {
        currentCategory = $(this).text().trim();
        navigateTo("nickname");
    });

    // start quiz button click event handler - generate questions and start quiz
    $("#start-quiz-btn").on("click", function () {
        let inputVal = $("#nickname-input").val().trim();
        playerNickname = inputVal || "Player 1";

        // generate questions
        quizQuestions = generateQuestions(currentCategory);

        if (quizQuestions.length) {
            // reset globals for a new quiz
            quizQuestions.forEach(q => q.userAnswer = null);
            currentQuestionIndex = 0;
            score = 0;
            quizCompleted = false;

            // show the first question without pushing a new history state, pushed in navigateTo
            showQuestion(false);

            // add the first quiz question to history so browser back works
            navigateTo("quiz", { questionIndex: 0 }, true);
        }
    });

    // side buttons click event handler - navigate to history or about page
    $(".side-btn").on("click", function () {
        let btnText = $(this).text().trim();

        if (btnText === "Quiz History") {
            showHistoryUI(true); // show history
        }

        if (btnText === "About") {
            if (history.state?.view !== "about") {
                navigateTo("about"); // push to history if not already there
            } else {
                showState("about"); // show about page
            }
        }
    });

    // the review mode button click event handler - show review mode for selected game
    $(document).on("click", ".view-details-btn", function () {
        let index = $(this).data("index");
        showReview(index); // start review mode for a selected game
    });

    // back to main menu button click event handler - show main menu
    $(document).on("click", ".back-button", function () {
        navigateTo("main");
    });

    // handle browser's back/forward navigation - restore the previous view or fall back to the main menu
    $(window).on("popstate", function (event) {
        const state = event.originalEvent.state;
        if (state) {
            showState(state.view, state.data, state);
        } else {
            showMainMenu();
        }
    });
});
