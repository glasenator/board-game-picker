import { convertWeightToTeach } from "./utils.js";

export function initializeDrawer() {
    const detailDrawer = document.getElementById("detail-drawer");
    const closeDrawerButton = document.getElementById("close-drawer");
    const overlay = document.getElementById("overlay");

    closeDrawerButton.addEventListener("click", closeDrawer);
    overlay.addEventListener("click", closeDrawer);

    function closeDrawer() {
        detailDrawer.classList.remove("open");
        overlay.classList.remove("active");
        document.body.classList.remove("drawer-open");
    }
}

export async function openDrawer(details) {
    const detailDrawer = document.getElementById("detail-drawer");
    const overlay = document.getElementById("overlay");
    const detailImage = document.getElementById("detail-image");
    const detailDescription = document.getElementById("detail-description");
    const detailPlayers = document.getElementById("detail-players");
    const detailTime = document.getElementById("detail-time");
    const detailComplexity = document.getElementById("detail-complexity");
    const detailRating = document.getElementById("detail-rating");
    const detailCategories = document.getElementById("detail-categories");
    const detailMechanics = document.getElementById("detail-mechanics");

    try {
        const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${details.id}`);
        if (!response.ok) throw new Error("Failed to fetch game details");

        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "application/xml");

        const name = xml.querySelector("name[type='primary']")?.getAttribute("value") || "Unknown Game";
        const gameUrl = `https://boardgamegeek.com/boardgame/${details.id}`;
        let description = xml.querySelector("description")?.textContent || "No description available.";
        description = description.replace(/&#10;/g, "\n"); // Replace '&#10;' with line breaks
        const minPlayers = xml.querySelector("minplayers")?.getAttribute("value") || "N/A";
        const maxPlayers = xml.querySelector("maxplayers")?.getAttribute("value") || "N/A";
        const playingTime = xml.querySelector("playingtime")?.getAttribute("value") || "N/A";
        const rating = details.rating || "N/A";
        const imageUrl = xml.querySelector("image")?.textContent || "";
        const boardGameCategories = xml.querySelectorAll("link[type='boardgamecategory']");
        const boardGameMechanics = xml.querySelectorAll("link[type='boardgamemechanic']");

        const detailTitleLink = document.getElementById("detail-title-link");
        if (detailTitleLink) {
            detailTitleLink.textContent = name;
            detailTitleLink.href = gameUrl;
        }
        if (detailImage) {
            detailImage.src = imageUrl;
            detailImage.alt = name;
        }
        if (detailDescription) detailDescription.textContent = description;
        if (detailPlayers) {
            detailPlayers.textContent = minPlayers === maxPlayers 
                ? `${minPlayers} players` 
                : `${minPlayers} - ${maxPlayers} players`;
        }
        if (detailTime) detailTime.textContent = `${playingTime} mins`;
        if (detailComplexity) {
            detailComplexity.innerHTML = convertWeightToTeach(details.weight);
        }
        if (detailRating) {
            detailRating.style.color = `hsl(${rating * 12}, 100%, 50%)`;
            detailRating.textContent = rating;
        }
        if (detailCategories) {
            const categories = Array.from(boardGameCategories).map(cat => cat.getAttribute("value")).join(", ");
            detailCategories.textContent = categories;
        }
        if (detailMechanics) {
            const mechanics = Array.from(boardGameMechanics).map(mech => mech.getAttribute("value")).join(", ");
            detailMechanics.textContent = mechanics;
        }

        detailDrawer.classList.add("open");
        overlay.classList.add("active");
        document.body.classList.add("drawer-open");
    } catch (error) {
        console.error("Error fetching game details:", error);
        detailDrawer.classList.remove("open");
        overlay.classList.remove("active");
        document.body.classList.remove("drawer-open");
    }
}
