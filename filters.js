import { filterGames } from "./collection.js";

export function initializeFilters() {
    const filterNameInput = document.getElementById("filter-name");
    const filterPlayerCount = document.getElementById("filter-playercount");
    const filterRating = document.getElementById("filter-rating");
    const filterPlayingTime = document.getElementById("filter-playingtime");
    const filterComplexity = document.getElementById("filter-weight");

    filterNameInput.addEventListener("input", filterGames);
    filterPlayerCount.addEventListener("change", filterGames);
    filterRating.addEventListener("change", filterGames);
    filterPlayingTime.addEventListener("change", filterGames);
    filterComplexity.addEventListener("change", filterGames);

    document.getElementById("clear-filters").addEventListener("click", () => {
        filterNameInput.value = "";
        filterPlayerCount.value = "";
        filterRating.value = "";
        filterPlayingTime.value = "";
        filterComplexity.value = "";
        filterGames(); // Reapply filters to show all games
    });
}
