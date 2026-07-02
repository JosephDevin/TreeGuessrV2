import { getData} from "../get_trees.js";
import { Chronometer } from "./chronometer.js"
// GLOBAL VARIABLES

let tries = 0;
let roundScore = 5000;
let answer;

const chrono = new Chronometer();

let mode = localStorage.getItem("mode");

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
const hintText = document.getElementById("hint");

/* ====================================
Getting the data for each game
======================================== */

window.onload = async function () {
    loadAliases();

    const loadingEl = document.getElementById("loading");
    const contentEl = document.getElementById("content");

    // Show loader
    loadingEl.classList.remove("is-hidden");
    contentEl.classList.add("is-hidden");

    try {
        const tree = await getData();
        if (!tree) {
            loadingEl.querySelector("p").textContent = "Aucune donnée disponible.";
            window.location.reload();
            return;
        }

        loadPictures(tree);
        answer = tree;

        /* ====================================
        UI LOGIC
        ======================================== */

        document.getElementById("title").innerHTML = `TreeGuessr (<span class="emoji">🌳</span>)`;

        // HANDLES UI LOGIC FOR STANDARD MODE
        if (mode === 'standard') {
            document.getElementById("round").textContent = localStorage.getItem("round") + "/5";
        } else {
            document.getElementById("scoreText").textContent = ' ';

            const title = document.getElementById("title");

            if (mode === 'survival') {
                next.classList.add("is-hidden");

                document.getElementById("round").textContent = ' '; // DON'T SHOW THE ROUND IF SURVIVAL OR CHRONO

                title.style.background = 'linear-gradient(95deg, hsl(0, 100%, 44%), hsl(0, 92%, 66%) 30%, hsl(0, 87%, 78%) 70%)';
                title.style.webkitBackgroundClip = 'text';
                title.style.backgroundClip = 'text';
                title.style.webkitTextFillColor = 'transparent';
                title.style.color = 'transparent';
            }

            if (mode === 'chrono') {
                setInterval(() => {
                    document.getElementById("round").textContent = chrono.getFormattedTime();
                }, 10);

                title.style.background = 'linear-gradient(95deg, hsl(0, 0%, 50%), hsl(0, 0%, 75%) 30%, hsl(0, 0%, 100%) 70%)';
                title.style.webkitBackgroundClip = 'text';
                title.style.backgroundClip = 'text';
                title.style.webkitTextFillColor = 'transparent';
                title.style.color = 'transparent';

                if (chrono.isPaused) { chrono.resume() } else { chrono.start(); }

            }
        }


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

    if (mode === 'chrono') { chrono.pause(); window.location.reload(); }
})


/* ====================================
Guess functionality
======================================== */

input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        guess();
    }
});

// Internal logic of the game, guess the input and compares to all the aliases.
function guess() {
    const userGuess = input.value.trim().toLowerCase();
    if (!userGuess) return;

    const mainName = answer.frenchName.toLowerCase();
    const aliases = answer.aliases || [];

    const isCorrect = (userGuess === mainName) ||
        aliases.some(alias => alias.toLowerCase() === userGuess);

    if (mode === 'standard')
    {
        /*=====================================
        STANDARD MODE 🌱
        ======================================= */

        if (isCorrect) {
            if (window.triggerShake) {
                window.triggerShake({
                    tint: 'rgba(74, 222, 128, 0.2)', // Soft Green
                    intensity: '0px'
                });
            }
            localStorage.setItem("currentTree", JSON.stringify(answer));
            localStorage.setItem("score", score + roundScore);

            if (tries === 0) {
                const defaults = {
                    spread: 360,
                    ticks: 100,
                    gravity: 0,
                    decay: 0.94,
                    startVelocity: 30,
                };

                function shoot() {
                    confetti({
                        ...defaults,
                        particleCount: 30,
                        scalar: 1.2,
                        shapes: ["circle", "square"],
                    });
                }

                setTimeout(shoot, 0);
                setTimeout(shoot, 100);
                setTimeout(shoot, 200);

            }

            setTimeout(() => {
                window.location.href = "result/result.html";
            }, 1000);

        } else {
            if (window.triggerShake) {
                window.triggerShake();
            }

            tries++;
            input.value = "";
            updateScore(-1000); // Remove 1000 points at each try

            if (tries >= 2) {
                hintText.classList.remove("is-hidden");
                let hint = answer.scientificName.split(' ')[0]
                hintText.textContent = "Indice: " + hint
                console.log("hint")
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
    else if (mode === 'survival') {

        /*=====================================
        SURVIVAL MODE 🐻
        ======================================= */

        if (isCorrect) {
            if (window.triggerShake) {
                window.triggerShake({
                    tint: 'rgba(74, 222, 128, 0.2)', // Soft Green
                    intensity: '0px'
                });
            }

            localStorage.setItem("currentTree", JSON.stringify(answer));

            setTimeout(() => {
                window.location.href = "result/result.html";
            }, 1000);

        } else {
            if (window.triggerShake) {
                window.triggerShake();
            }

            localStorage.setItem("currentTree", JSON.stringify(answer));

            setTimeout(() => {
                window.location.href = "end/end_survival.html";
            }, 400);
        }
    }
    else if (mode === 'chrono') {

        /*=====================================
        CHRONOMETER MODE ⏱️
        ======================================= */

        if (isCorrect) {
            if (window.triggerShake) {
                window.triggerShake({
                    tint: 'rgba(74, 222, 128, 0.2)', // Soft Green
                    intensity: '0px'
                });
            }

            localStorage.setItem("round", parseInt(localStorage.getItem("round")) + 1);

            chrono.pause();

            setTimeout(() => {
                window.location.reload();
            }, 400);

        } else {
            if (window.triggerShake) {
                window.triggerShake();
            }
        }


    }
}

// Update the score and color of the score display
function updateScore(points) {
    roundScore += points;
    scoreText.innerText = roundScore;
    if (roundScore === 3000) scoreText.style.color = "#fb8b2b"
    if (roundScore === 2000) scoreText.style.color = "#fb612b"
    if (roundScore === 1000) scoreText.style.color = "#ff0000"
}

/* ====================================
SUGGESTIONS
======================================== */

let CANDIDATES = [];
const suggestionsEl = document.getElementById("suggestions");
const answerInput = document.getElementById("answer");
let activeIndex = -1;

// Loads the aliases and handle the ui logic for suggestions
async function loadAliases() {
    try {
        const response = await fetch("../data/trees/trees.json");
        if (!response.ok) throw new Error("Could not find trees.json");

        const raw = await response.json();

        const data = Object.values(raw).flat();

        CANDIDATES = data
            .filter(tree => tree && Array.isArray(tree.aliases) && tree.aliases.length)
            .map(tree => {
                const names = tree.aliases.filter(a => a && a !== "None");
                return {
                    name: names[0],
                    aliases: names.slice(1)
                };
            })
            .filter(candidate => candidate.name);

        // Start game logic once data is ready
        setupEventListeners();
    } catch (err) {
        console.error("Failed to initialize CANDIDATES:", err);
    }
}

function bestMatchScore(query, candidate) {
    let best = similarity(query, candidate.name);
    for (const alias of candidate.aliases) {
        const s = similarity(query, alias);
        if (s > best) best = s;
    }
    return best;
}

// Suggestion logic
function hideSuggestions() {
    suggestionsEl.classList.add("is-hidden");
    suggestionsEl.innerHTML = "";
    activeIndex = -1;
}

function showSuggestions(list) {
    suggestionsEl.classList.remove("is-hidden");
    suggestionsEl.replaceChildren(...list.map((candidate) => {
        const li = document.createElement("li");
        li.role = "option";
        li.classList.add("suggestion-item");
        li.dataset.value = candidate.name;

        const mainLabel = document.createElement("span");
        mainLabel.classList.add("suggestion-main");
        mainLabel.textContent = candidate.name;
        li.appendChild(mainLabel);

        // Only build the aliases sub-list if this tree actually has aliases
        if (candidate.aliases.length) {
            const subList = document.createElement("ul");
            subList.classList.add("suggestion-sublist", "is-hidden");

            candidate.aliases.forEach(alias => {
                const subLi = document.createElement("li");
                subLi.classList.add("suggestion-alias");
                subLi.textContent = alias;
                subList.appendChild(subLi);
            });

            li.appendChild(subList);

            li.addEventListener("mouseenter", () => {
                subList.classList.remove("is-hidden");
                li.classList.add("is-expanded");
            });
            li.addEventListener("mouseleave", () => {
                subList.classList.add("is-hidden");
                li.classList.remove("is-expanded");
            });
        }

        li.addEventListener("mousedown", (e) => {
            e.preventDefault();
            answerInput.value = candidate.name;
            hideSuggestions();
        });

        return li;
    }));
}

/* ================== EVENT LISTENERS ================== */
function setupEventListeners() {
    // Input monitoring for suggestions
    answerInput.addEventListener("input", () => {
        const q = answerInput.value;
        if (normalizeStr(q).length < 2) {
            hideSuggestions();
            return;
        }

        // Score all candidates (name + aliases) and pick top 3 trees
        const scored = CANDIDATES
            .map(candidate => [candidate, bestMatchScore(q, candidate)])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([candidate]) => candidate);

        if (scored.length) showSuggestions(scored);
        else hideSuggestions();
    });

    // Hide suggestions when clicking outside
    document.addEventListener("click", (e) => {
        if (!suggestionsEl.contains(e.target) && e.target !== answerInput) {
            hideSuggestions();
        }
    });
}

/* ================== UTILS ================== */

function normalizeStr(s) {
    return String(s ?? "")
        .toLowerCase()
        .normalize("NFD").replace(/\p{Diacritic}/gu, "")
        .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
        .replace(/\s+/g, " ")
        .trim();
}

function levenshtein(a, b) {
    a = normalizeStr(a); b = normalizeStr(b);
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    if (a.length > b.length) [a, b] = [b, a];
    const dp = new Array(a.length + 1);
    for (let i = 0; i <= a.length; i++) dp[i] = i;
    for (let j = 1; j <= b.length; j++) {
        let prevDiag = j - 1, cur = j;
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            const ins = cur + 1, del = dp[i] + 1, sub = prevDiag + cost;
            prevDiag = dp[i]; cur = Math.min(ins, del, sub); dp[i] = cur;
        }
    }
    return dp[a.length];
}

function similarity(a, b) {
    const maxLen = Math.max(normalizeStr(a).length, normalizeStr(b).length) || 1;
    return 1 - (levenshtein(a, b) / maxLen);
}