
const continueBtn = document.getElementById('continue');
var roundScore = 500;

function showContinue() {
    continueBtn.classList.remove('is-hidden');
    continueBtn.removeAttribute('aria-hidden');
}

const hint = document.getElementById('hint');

function showHint(text) {
    hint.textContent = text;
    hint.classList.remove('is-hidden');
}

const skip = document.getElementById('skip');

function hideSkip() {
    skip.classList.add('is-hidden');
}

skip.addEventListener('click', () => {
    showHint("La réponse était: " + answer)
    hideSkip();
    showContinue();

    done = true;
})

function updateScore(points) {
    let score = parseInt(localStorage.getItem("score") || "0", 10);

    score += points;

    localStorage.setItem("score", score);
    updateScoreText();
}

function updateScoreText() {
    const scoreText = document.getElementById('scoreText');
    scoreText.textContent = "Score: " + localStorage.getItem("score");
}