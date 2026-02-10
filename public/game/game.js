import { getData} from "../get_trees.js";

// GLOBAL VARIABLES

let tries = 0;
let roundScore = 5000;
let answer;

let score = parseInt(localStorage.getItem("score"), 10);


/* ====================================
Getting all UI elements
======================================== */

const slot1 = document.getElementById("slot1");
const slot2 = document.getElementById("slot2");
const slot3 = document.getElementById("slot3");

const next = document.getElementById("skip");
const input = document.getElementById("answer");
const scoreText = document.getElementById("scoreText");
const hintText = document.getElementById("hintText");

/* ====================================
Getting the data for each game
======================================== */

window.onload = async function () {
    const loadingEl = document.getElementById("loading");
    const contentEl = document.getElementById("content");

    // Show loader
    loadingEl.classList.remove("is-hidden");
    contentEl.classList.add("is-hidden");

    try {
        const tree = await getData();
        if (!tree) {
            loadingEl.querySelector("p").textContent = "Aucune donnée disponible.";
            return;
        }

        loadPictures(tree);

        for (let i = 0; i < tree.aliases.length; i++) {
            console.log(tree.aliases[i]);
        }

        answer = tree;

        loadingEl.classList.add("is-hidden");
        contentEl.classList.remove("is-hidden");

    } catch (err) {
        console.error("Error fetching tree:", err);
        loadingEl.querySelector("p").textContent = "Erreur lors du chargement.";
    }
};

function loadPictures(tree) {
    slot1.src = tree.trefleData.image_leaf;
    slot2.src = tree.trefleData.image_habit;
    slot3.src = tree.trefleData.image_flower_or_bark;
}

/* ====================================
Skip and next functionality
======================================== */

next.addEventListener("click", function () {
    // UPDATE SCORE: remaining points /2 for the round
    localStorage.setItem("score", score + roundScore/2);

    // Serialize the entire object (including the nested trefle data)
    localStorage.setItem("currentTree", JSON.stringify(answer));

    window.location.href="result/result.html";
})

input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const userGuess = input.value.trim().toLowerCase();
        if (!userGuess) return;

        const mainName = answer.frenchName.toLowerCase();
        const aliases = answer.aliases || [];

        const isCorrect = (userGuess === mainName) ||
            aliases.some(alias => alias.toLowerCase() === userGuess);

        if (isCorrect) {
            if (window.triggerShake) {
                window.triggerShake({
                    tint: 'rgba(74, 222, 128, 0.2)', // Soft Green
                    intensity: '0px'
                });
            }
            localStorage.setItem("currentTree", JSON.stringify(answer));
            localStorage.setItem("score", score + roundScore);

            setTimeout(() => {
                window.location.href = "result/result.html";
            }, 400);

        } else {
            if (window.triggerShake) {
                window.triggerShake();
            }

            tries++;
            input.value = "";
            updateScore(-1000);

            if (tries >= 2) {
                hintText.classList.remove("is-hidden");
                let hint = answer.scientificName.split(' ')[0]
                hintText.textContent = "Indice: " + hint
            }

            if (tries >= 5) {
                localStorage.setItem("currentTree", JSON.stringify(answer));
                localStorage.setItem("score", 0);

                setTimeout(() => {
                    window.location.href = "result/result.html";
                }, 400);
            }
        }
    }
});

function updateScore(points) {
    roundScore += points;
    scoreText.innerText = roundScore;
    if (roundScore === 3000) scoreText.style.color = "#fb8b2b"
    if (roundScore === 2000) scoreText.style.color = "#fb612b"
    if (roundScore === 1000) scoreText.style.color = "#ff0000"
}




