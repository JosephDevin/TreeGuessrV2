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
        frName: frenchName.charAt(0).toUpperCase() + frenchName.slice(1).toLowerCase() || scientificName,
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
        occurrences: trefleData.occurrences,
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

    nextBtn.textContent = "Rejouer";

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

    let rarityEl = document.getElementById('rarity');
    let rarity = getRarity(parseInt(flatTree.occurrences));
    rarityEl.textContent = rarity.text;
    rarityEl.style.color = rarity.color;

    nextBtn.onclick = () => {
        window.location.href = "../../index.html";
    };

    document.getElementById('scoreText').textContent = "Série: " + localStorage.getItem("round");
}

function getRarity(occurrences) {
    if (occurrences >= 20000)
        return { text : "Commun", color : "#2596be" };
    else if (occurrences >= 10000 && occurrences <= 20000)
        return { text : "Rare", color : "#bc4807" };
    else if (occurrences >= 5000 && occurrences <= 10000)
        return { text : "Epique", color : "#651572" };
    else if (occurrences <= 5000){
        return { text : "Légendaire", color : "#FFD700" };
    }
    else { return { text: "Erreur", color : "#c1c1c1" }; }
}