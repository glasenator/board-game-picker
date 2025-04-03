import { filterGames } from "./collection.js";

const gameListContainer = document.getElementById("game-list");

export function initializeSorting() {
    const sortOptions = document.getElementById("sort-options");
    const sortOrderButton = document.getElementById("sort-order");
    const sortArrow = document.getElementById("sort-arrow");
    let reverseOrder = false;

    sortOptions.addEventListener("change", sortGames);
    sortOrderButton.addEventListener("click", () => {
        reverseOrder = !reverseOrder;
        sortArrow.textContent = reverseOrder ? "⬆️" : "⬇️";
        sortGames();
    });

    function sortGames() {
        const sortBy = sortOptions.value;
        const gameItems = Array.from(gameListContainer.children);

        const getSortValue = (gameItem, sortBy) => {
            switch (sortBy) {
                case "name":
                    return gameItem.querySelector("h2").textContent.toLowerCase();
                case "ranking":
                    return parseFloat(gameItem.querySelector(".rating").textContent) || 0;
                case "playercount":
                    const playerText = gameItem.querySelector(".player-count").textContent;
                    const players = playerText.match(/\d+/g).map(Number);
                    return players.length === 2 ? players[1] : players[0];
                case "playtime":
                    return parseInt(gameItem.querySelector(".playing-time").textContent.match(/\d+/)) || 0;
                case "weight":
                    return parseFloat(gameItem.querySelector(".weight").textContent) || 0;
                default:
                    return 0;
            }
        };

        gameItems.sort((a, b) => {
            const valueA = getSortValue(a, sortBy);
            const valueB = getSortValue(b, sortBy);
            let comparison = typeof valueA === "string" ? valueA.localeCompare(valueB) : valueA - valueB;
            return reverseOrder ? -comparison : comparison;
        });

        gameListContainer.innerHTML = "";
        gameItems.forEach(item => gameListContainer.appendChild(item));
        filterGames(); // Ensure filtering is applied after sorting
    }
}
