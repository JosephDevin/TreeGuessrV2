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

// SUGGESTIONS

/* ================== CONFIG & STATE ================== */
let CANDIDATES = [];
const suggestionsEl = document.getElementById("suggestions");
const answerInput = document.getElementById("answer"); // Ensure your HTML ID matches
let activeIndex = -1;

/* ================== DATA LOADING ================== */

/**
 * Loads the aliases from the text file.
 * Path is relative to the URL of game.html
 */
async function loadAliases() {
    try {
        const response = await fetch("../data/aliases_WE.txt");
        if (!response.ok) throw new Error("Could not find aliases_WE.txt");

        const text = await response.text();

        // Process lines: Trim, remove empty, and remove "None"
        const list = text
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line && line !== "None");

        // Set the global CANDIDATES array with unique values
        CANDIDATES = [...new Set(list)];
        console.log(`Loaded ${CANDIDATES.length} tree aliases.`);

        // Start game logic once data is ready
        setupEventListeners();
    } catch (err) {
        console.error("Failed to initialize CANDIDATES:", err);
    }
}

/* ================== SUGGESTION LOGIC ================== */

function hideSuggestions() {
    suggestionsEl.classList.add("is-hidden");
    suggestionsEl.innerHTML = ""; // Clear list
    activeIndex = -1;
}

function showSuggestions(list) {
    suggestionsEl.classList.remove("is-hidden");
    suggestionsEl.replaceChildren(...list.map((text, idx) => {
        const li = document.createElement("li");
        li.role = "option";
        li.textContent = text;
        li.dataset.value = text;

        // Use mousedown to ensure it fires before the input 'blur'
        li.addEventListener("mousedown", (e) => {
            e.preventDefault();
            answerInput.value = text;
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

        // Score all candidates and pick top 3
        const scored = CANDIDATES
            .map(name => [name, similarity(q, name)])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);

        if (scored.length) showSuggestions(scored);
        else hideSuggestions();
    });

    // Keyboard navigation (Arrows, Enter, Escape)
    answerInput.addEventListener("keydown", (e) => {
        const open = !suggestionsEl.classList.contains("is-hidden");
        const items = Array.from(suggestionsEl.querySelectorAll("li"));

        if ((e.key === "ArrowDown" || e.key === "ArrowUp") && open) {
            e.preventDefault();
            if (!items.length) return;

            if (e.key === "ArrowDown") activeIndex = (activeIndex + 1) % items.length;
            else activeIndex = (activeIndex - 1 + items.length) % items.length;

            items.forEach((li, i) => li.classList.toggle("is-active", i === activeIndex));
            return;
        }

        if (e.key === "Enter" && open && activeIndex >= 0) {
            e.preventDefault();
            const picked = items[activeIndex]?.dataset.value;
            if (picked) answerInput.value = picked;
            hideSuggestions();
        }

        if (e.key === "Escape" && open) {
            e.preventDefault();
            hideSuggestions();
        }
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