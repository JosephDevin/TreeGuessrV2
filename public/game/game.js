import { getData} from "../get_trees.js";

const slot1 = document.getElementById("slot1");
const slot2 = document.getElementById("slot2");
const slot3 = document.getElementById("slot3");

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

        await loadPictures(tree);

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


