let isActive = false; 

document.getElementById("start").addEventListener("click", function () {
    document.querySelector(".quiz").classList.add("active"); 
    document.querySelector(".introduction").classList.add("inactive"); 
    startTimer(); 
    loadQuestion(); 
    isActive = true; 
});

let questions = []; 

fetch('https://jsonplaceholder.typicode.com/posts')
    .then(response => {
        if (response.ok) {
            return response.json(); 
        }
        throw new Error('Network response was not ok.'); 
    })
    .then(posts => {
        const shuffledPosts = posts.sort(() => Math.random() - 0.5); 
        const selectedPosts = shuffledPosts.slice(0, 10); 
        selectedPosts.forEach((post, index) => {
            let question = {}; 
            question.text = post.title; 
            question.options = post.body.split('\n').map((option, idx) => ({ 
                text: option,
                isCorrect: idx === 0 
            }));
            questions.push(question); 
        });
    })
    .catch(error => {
        console.error('There was a problem with the fetch request:', error); 
    });

const questionNumberElement = document.getElementById("questionNumber");
const totalNumberElement = document.getElementById("totalNumber"); 
const questionTextElement = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer"); 
const nextButton = document.getElementById("nextButton"); 

let currentQuestionIndex = 0; 
let score = 0; 
let isAnswered = false; 
let timeoutID; 
let interval; 
let quizEnded = false; 

function startTimer() {
    const quizElement = document.querySelector(".quiz");
    if (quizElement.classList.contains("active") && !quizEnded) {
        const timer = document.querySelector('.timer'); 
        const duration = 30; 
        const countdownElement = document.getElementById('countdown'); 

        let timeLeft = duration; 
        let width = 100; 

        if (interval) { 
            clearInterval(interval);
        }

        interval = setInterval(function () { 
            timeLeft--; 

            if (timeLeft >= 0) { 
                const percent = (timeLeft / duration) * 100; 
                width = percent < width ? percent : width; 
                timer.style.width = width + '%'; 
                countdownElement.textContent = timeLeft; 
            } else { 
                clearInterval(interval); 
                timer.style.width = '100%'; 
                loadQuestion();
            }
        }, 1000); 
    }
}

let questionTimeoutID;
let questionTimeoutID2; 
let isOptionsLocked = true;

function loadQuestion() {
    isAnswered = false; 
    const currentQuestion = questions[currentQuestionIndex]; 
    questionNumberElement.textContent = currentQuestionIndex + 1; 
    totalNumberElement.textContent = questions.length; 
    questionTextElement.textContent = currentQuestion.text;
    optionsContainer.innerHTML = ""; 
    clearTimeout(questionTimeoutID); 
    clearTimeout(questionTimeoutID2); 
    const shuffledOptions = shuffle(currentQuestion.options);

    shuffledOptions.forEach((option, index) => {
        const optionElement = document.createElement("div");
        optionElement.classList.add("option");
        optionElement.dataset.index = index;
        optionElement.innerHTML = `<div>${String.fromCharCode(65 + index)})</div><span>${option.text}</span>`;
        optionsContainer.appendChild(optionElement);
    });

    nextButton.disabled = true;
    questionTimeoutID = setTimeout(() => {
        nextButton.disabled = false; 
        isOptionsLocked = false;
        addEventListeners(); 
    }, 10000);

    questionTimeoutID2 = setTimeout(() => { 
        checkAnswer();
    }, 30000);
}

function addEventListeners() {
    const options = document.querySelectorAll(".option"); 
    options.forEach(option => { 
        option.addEventListener("click", function () {
            document.querySelectorAll(".option").forEach(option => option.classList.remove("selected"));
            this.classList.add("selected"); 
            isAnswered = true; 
        });
    });
}


function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function checkAnswer() {
    const selectedOption = document.querySelector(".option.selected"); 
    let isCorrectAnswer = false; 
    let hasResponded = false; 

    if (selectedOption) { 
        hasResponded = true;
        const index = selectedOption.dataset.index; 
        const optionText = selectedOption.innerText.trim().split(')')[1].trim();
        const options = questions[currentQuestionIndex].options; 

        const correctOption = options.find(option => option.isCorrect === true); 

        if (correctOption && optionText === correctOption.text.trim()) { 
            score++; 
            isCorrectAnswer = true;
        }

        localStorage.setItem(`Question${currentQuestionIndex}`, JSON.stringify({
            question: questions[currentQuestionIndex].text,
            response: questions[currentQuestionIndex].options[index].text,
            isCorrect: isCorrectAnswer
        }));
    } else { 
        localStorage.setItem(`Question${currentQuestionIndex}`, JSON.stringify({ 
            question: questions[currentQuestionIndex].text,
            response: "Not answered",
            isCorrect: false
        }));
    }

    if (currentQuestionIndex < questions.length - 1) { 
        currentQuestionIndex++;
        loadQuestion(); 
        startTimer(); 
        nextButton.disabled = true; 
    } else { 
        showResults(); 
    }
}

function showResults() {
    quizEnded = true; 
    const timer = document.querySelector('.timer-container'); 
    timer.style.display = 'none'; 
    clearInterval(interval); 
    const totalQuestions = questions.length; 
    const resultMessage = `You answered ${score} out of ${totalQuestions} questions correctly`;
    questionTextElement.textContent = resultMessage;
    optionsContainer.innerHTML = "";
    nextButton.style.display = "none"; 

    const table = document.createElement('table'); 
    const thead = document.createElement('thead'); 
    const tbody = document.createElement('tbody');

    const headers = ['Question', 'Answer', 'Correct']; 
    const headerRow = document.createElement('tr'); 
    headers.forEach(headerText => { 
        const th = document.createElement('th'); 
        th.textContent = headerText;
        headerRow.appendChild(th); 
    });
    thead.appendChild(headerRow);
    table.appendChild(thead); 

    for (let i = 0; i < totalQuestions; i++) { 
        const storedData = JSON.parse(localStorage.getItem(`Question${i}`)); 
        const row = document.createElement('tr'); 
        const questionCell = document.createElement('td'); 
        const answerCell = document.createElement('td'); 
        const correctCell = document.createElement('td'); 

        questionCell.textContent = storedData.question; 
        answerCell.textContent = storedData.response; 
        correctCell.textContent = storedData.isCorrect ? 'Yes' : 'No'; 

        row.appendChild(questionCell); 
        row.appendChild(answerCell); 
        row.appendChild(correctCell); 
        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    document.body.appendChild(table); 

    localStorage.clear(); 
}

nextButton.addEventListener("click", checkAnswer);