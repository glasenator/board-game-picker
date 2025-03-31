document.addEventListener("DOMContentLoaded", () => {
    const gameListContainer = document.getElementById("game-list");
    const sortOptions = document.getElementById("sort-options");

    sortOptions.addEventListener("change", () => {
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
                    return parseFloat(gameItem.querySelector(".weight")?.textContent.match(/\d+(\.\d+)?/)) || 0; // Handle weight
                default:
                    return 0;
            }
        };

        gameItems.sort((a, b) => {
            const valueA = getSortValue(a, sortBy);
            const valueB = getSortValue(b, sortBy);
            if (typeof valueA === "string") {
                return valueA.localeCompare(valueB);
            }
            return valueA - valueB;
        });

        gameListContainer.innerHTML = "";
        gameItems.forEach(item => gameListContainer.appendChild(item));
    });

    async function fetchGameDetails(gameId, games) {
        console.log("Fetching game details for ID:", gameId);
        try {
            const sanitizeValue = (value) => typeof value === "string" ? value.replace(/^['"]|['"]$/g, "") : value;

            let game = games.find((g) => g.objectid === gameId);
            console.log(game);

            return {
                minPlayers: game?.minplayers || "N/A",
                maxPlayers: game?.maxplayers || "N/A",
                playingTime: game?.playingtime || "N/A",
                itemType: game?.itemtype || "N/A",
                rating: game?.rating || "N/A",
                weight: game?.avgweight || "N/A"
            };

        } catch (error) {
            console.error("Error processing game details:", error);
            return {
                minPlayers: "N/A",
                maxPlayers: "N/A",
                playingTime: "N/A",
                itemType: "N/A",
                rating: "N/A",
                weight: "N/A" // Include weight
            };
        }
    }

    function generateWeightBarsHTML(weight) {
        const maxBars = 5;
        let barsHTML = '<div class="weight-bars">';
        for (let i = 1; i <= maxBars; i++) {
            const isActive = weight >= i ? "active" : "";
            barsHTML += `<div class="weight-bar ${isActive}" style="height: ${i * 4}px;"></div>`;
        }
        barsHTML += '</div>';
        return barsHTML;
    }

    async function fetchGameCollection(username) {
        try {
            const collectionResponse = await fetch(`https://boardgamegeek.com/xmlapi2/collection?username=${username}`);
            if (!collectionResponse.ok) throw new Error("Failed to fetch collection data");

            const text = await collectionResponse.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "application/xml");

            const items = xml.querySelectorAll("item");
            if (!items.length) {
                console.error("No items found in the collection response.");
                gameListContainer.innerHTML = `<p>No games found in the collection.</p>`;
                return;
            }

            // Fetch all game details once
            const apiResponse = await fetch("/api/collection");
            if (!apiResponse.ok) throw new Error("Failed to fetch collection data");
            const games = await apiResponse.json();

            if (!games.length) {
                console.error("No games found in the API response.");
                gameListContainer.innerHTML = `<p>No game details available.</p>`;
                return;
            }

            items.forEach(item => {
                const name = item.querySelector("name")?.textContent || "Unknown Game";
                const imageUrl = item.querySelector("image")?.textContent || "https://media.istockphoto.com/id/1295474183/vector/surprise-mystery-box-icon.jpg?s=612x612&w=0&k=20&c=ebChMCVwLzK6ZL40ZRwRDKmep7fsslAJOIPp9WlsSJI="; // Fallback image
                const owned = item.querySelector("status")?.getAttribute("own") === "1";
                console.log(item);

                if (!owned) {
                    console.log(`Skipping game ${name} as it is not owned.`);
                    return;
                }

                const gameItem = document.createElement("div");
                gameItem.className = "game-item";

                fetchGameDetails(Number(item.getAttribute("objectid")), games).then(details => {
                    const { minPlayers, maxPlayers, playingTime, itemType, rating, weight } = details;

                    if (itemType === "expansion") {
                        console.log(`Skipping game ${name} as it is not a standalone game.`);
                        return;
                    }

                    const playerCount = minPlayers === maxPlayers 
                        ? `${minPlayers} player${minPlayers > 1 ? 's' : ''}` 
                        : `${minPlayers} - ${maxPlayers} players`;
                    const gameUrl = `https://boardgamegeek.com/boardgame/${item.getAttribute("objectid")}`;

                    gameItem.innerHTML = `
                        <h2>${name}</h2>
                        <a href="${gameUrl}" class="game-item-content">
                            <img src="${imageUrl}" alt="${name}" class="game-image">
                            <div class="game-details">
                                <div class="player-count">${playerCount}</div>
                                <div class="playing-time">Playing Time: ${playingTime} mins</div>
                                <div class="weight">Complexity:${generateWeightBarsHTML(weight || 0)}</div>
                            </div>
                            <div class="rating" style="color: hsl(${rating * 12}, 100%, 50%)">${rating}</div>
                        </a>
                    `;
                    gameListContainer.appendChild(gameItem);
                }).catch(error => {
                    console.error(`Error fetching details for game ${name}:`, error);
                });
            });
        } catch (error) {
            console.error("Error fetching game collection:", error);
            gameListContainer.innerHTML = `<p>Failed to load game collection. Please try again later.</p>`;
        }
    }

    fetchGameCollection("Glasenator");
});
