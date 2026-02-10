
let score = parseInt(localStorage.getItem("score"), 10);


/* =======================
   Data Processing Function
======================= */
function flattenTree(tree) {
    const {
        scientificName,
        frenchName,
        aliases = [],
        familyName = "Inconnu",
        trefleData = {}
    } = tree;

    // Return a single flat object
    return {
        sciName: scientificName,
        frName: frenchName || scientificName,
        family: familyName,
        aliases: aliases.length > 0
            ? aliases
                .map(alias => alias.charAt(0).toUpperCase() + alias.slice(1).toLowerCase())
                .join(", ")
            : "",

        // Trefle Details with Fallbacks
        leafImg: trefleData.image_leaf,
        habitImg: trefleData.image_habit || "https://via.placeholder.com/350x420?text=Image+Non+Disponible",
        barkImg: trefleData.image_flower_or_bark,
        height: trefleData.average_height ? `${trefleData.average_height} cm` : "Inconnue",
        flowerColor: trefleData.flower_color || "Non spécifiée",
        leafColor: trefleData.leaf_color || "Vert",
        growth: trefleData.growth_rate || "Normal",
        tempMin: trefleData.min_temp ?? "Non renseignée",
        tempMax: trefleData.max_temp ?? "Non renseignée"
    };
}

/* =======================
   Page Initialization
======================= */
window.onload = function() {
    let nextBtn = document.getElementById('nextBtn');
    let round = parseInt(localStorage.getItem("round"), 10);

    if (round >= 5) {
        nextBtn.textContent = "Finir";
    }
    const rawData = localStorage.getItem("currentTree");
    if (!rawData) {
        console.error("No tree found in storage.");
        return;
    }

    const treeData = JSON.parse(rawData);
    const flatTree = flattenTree(treeData);

    document.getElementById('habit').textContent = flatTree.frName;
    document.getElementById('scientificName').textContent = `(${flatTree.sciName})`;
    document.getElementById('habitImg').src = flatTree.habitImg;

    // Optional Aliases display
    const aliasEl = document.getElementById('aliasesDisplay');
    if(aliasEl) aliasEl.textContent = flatTree.aliases;

    // Mapping keys from flattenTree to HTML span IDs
    document.getElementById('family').textContent = flatTree.family;
    document.getElementById('height').textContent = flatTree.height;
    document.getElementById('flowerColor').textContent = flatTree.flowerColor;
    document.getElementById('leafColor').textContent = flatTree.leafColor;
    document.getElementById('growth').textContent = flatTree.growth;
    document.getElementById('tempMin').textContent = flatTree.tempMin;
    document.getElementById('tempMax').textContent = flatTree.tempMax;

    nextBtn.onclick = () => {
        if (round >= 5) {
            window.location.href = "../end/end.html";
        }
        else
        {
            localStorage.setItem("round", round + 1);
            console.log(round);

            window.location.href = "../game.html";
        }
    };

    document.getElementById('scoreText').textContent = "Score total: " + score + "/" + round*5000;
}