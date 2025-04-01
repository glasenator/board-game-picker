document.addEventListener("DOMContentLoaded", () => {
    const gameListContainer = document.getElementById("game-list");
    const sortOptions = document.getElementById("sort-options");
    const sortOrderButton = document.getElementById("sort-order");
    const sortArrow = document.getElementById("sort-arrow");
    const filterNameInput = document.getElementById("filter-name");
    const filterPlayerCount = document.getElementById("filter-playercount");
    const filterRating = document.getElementById("filter-rating");
    const filterPlayingTime = document.getElementById("filter-playingtime");
    const filterComplexity = document.getElementById("filter-weight");
    let reverseOrder = false;

    const detailDrawer = document.getElementById("detail-drawer");
    const closeDrawerButton = document.getElementById("close-drawer");
    const detailTitle = document.getElementById("detail-title");
    const detailImage = document.getElementById("detail-image");
    const detailDescription = document.getElementById("detail-description");
    const detailPlayers = document.getElementById("detail-players");
    const detailTime = document.getElementById("detail-time");
    const detailComplexity = document.getElementById("detail-complexity");
    const detailRating = document.getElementById("detail-rating");
    const detailCategories = document.getElementById("detail-categories");
    const detailMechanics = document.getElementById("detail-mechanics");
    const overlay = document.getElementById("overlay");

    closeDrawerButton.addEventListener("click", () => {
        detailDrawer.classList.remove("open");
        overlay.classList.remove("active");
        document.body.classList.remove("drawer-open");
    });

    overlay.addEventListener("click", () => {
        detailDrawer.classList.remove("open");
        overlay.classList.remove("active");
        document.body.classList.remove("drawer-open");
    });

    async function openDrawer(details) {
        try {
            const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${details.id}`);
            if (!response.ok) throw new Error("Failed to fetch game details");

            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "application/xml");

            const name = xml.querySelector("name[type='primary']")?.getAttribute("value") || "Unknown Game";
            let description = xml.querySelector("description")?.textContent || "No description available.";
            description = description.replace(/&#10;/g, "\n"); // Replace '&#10;' with line breaks
            const minPlayers = xml.querySelector("minplayers")?.getAttribute("value") || "N/A";
            const maxPlayers = xml.querySelector("maxplayers")?.getAttribute("value") || "N/A";
            const playingTime = xml.querySelector("playingtime")?.getAttribute("value") || "N/A";
            const rating = details.rating || "N/A";
            const imageUrl = xml.querySelector("image")?.textContent || "";
            const boardGameCategories = xml.querySelectorAll("link[type='boardgamecategory']");
            const boardGameMechanics = xml.querySelectorAll("link[type='boardgamemechanic']");

            if (detailTitle) detailTitle.textContent = name;
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
                detailComplexity.innerHTML = generateWeightBarsHTML(details.weight); // Generate complexity bars
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

    sortOptions.addEventListener("change", sortGames);
    sortOrderButton.addEventListener("click", () => {
        reverseOrder = !reverseOrder;
        sortArrow.textContent = reverseOrder ? "⬆️" : "⬇️";
        sortGames();
    });

    filterNameInput.addEventListener("input", filterGames);
    filterPlayerCount.addEventListener("change", filterGames);
    filterRating.addEventListener("change", filterGames);
    filterPlayingTime.addEventListener("change", filterGames);
    filterComplexity.addEventListener("change", filterGames);

    function filterGames() {
        const filterText = filterNameInput.value.toLowerCase();
        const selectedPlayerCount = filterPlayerCount.value;
        const selectedRating = filterRating.value;
        const selectedPlayingTime = filterPlayingTime.value;
        const selectedComplexity = filterComplexity.value;
        const gameItems = Array.from(gameListContainer.children);

        gameItems.forEach(gameItem => {
            const gameName = gameItem.querySelector("h2").textContent.toLowerCase();
            const playerCountText = gameItem.querySelector(".player-count").textContent;
            const playerCounts = playerCountText.match(/\d+/g).map(Number);
            const gameRating = parseFloat(gameItem.querySelector(".rating").textContent) || 0;
            const gamePlayingTime = parseInt(gameItem.querySelector(".playing-time").textContent.match(/\d+/)) || 0;

            // Fix: Ensure `.weight` element is correctly parsed
            const weightElement = gameItem.querySelector(".weight .weight-bars");
            const activeBars = weightElement ? weightElement.querySelectorAll(".weight-bar.active").length : 0;
            const gameComplexity = activeBars;

            const matchesPlayerCount = !selectedPlayerCount || 
                (playerCounts.length === 2 
                    ? selectedPlayerCount >= playerCounts[0] && selectedPlayerCount <= playerCounts[1]
                    : selectedPlayerCount == playerCounts[0]);

            const matchesRating = !selectedRating || gameRating >= parseFloat(selectedRating);
            const matchesPlayingTime = !selectedPlayingTime || gamePlayingTime >= parseInt(selectedPlayingTime);
            const matchesComplexity = !selectedComplexity || gameComplexity === parseFloat(selectedComplexity);
            const matchesName = gameName.includes(filterText);

            gameItem.style.display = matchesName && matchesPlayerCount && matchesRating && matchesPlayingTime && matchesComplexity ? "" : "none";
        });
    }

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
                    // Fix: Parse the number of active weight bars for complexity
                    const weightElement = gameItem.querySelector(".weight .weight-bars");
                    return weightElement ? weightElement.querySelectorAll(".weight-bar.active").length : 0;
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
                const gameId = item.getAttribute("objectid");
                const imageUrl = item.querySelector("image")?.textContent || "https://media.istockphoto.com/id/1295474183/vector/surprise-mystery-box-icon.jpg?s=612x612&w=0&k=20&c=ebChMCVwLzK6ZL40ZRwRDKmep7fsslAJOIPp9WlsSJI="; // Fallback image
                const owned = item.querySelector("status")?.getAttribute("own") === "1";
                console.log(item);

                if (!owned) {
                    console.log(`Skipping game ${name} as it is not owned.`);
                    return;
                }

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

                    gameListContainer.appendChild(createGameCard({
                        name,
                        id: item.getAttribute("objectid"),
                        imageUrl,
                        minPlayers: details.minPlayers,
                        maxPlayers: details.maxPlayers,
                        playingTime: details.playingTime,
                        weight: details.weight,
                        rating: details.rating,
                        description: details.description || "No description available."
                    }));
                }).catch(error => {
                    console.error(`Error fetching details for game ${name}:`, error);
                });
            });
        } catch (error) {
            console.error("Error fetching game collection:", error);
            gameListContainer.innerHTML = `<p>Failed to load game collection. Please try again later.</p>`;
        }
    }

    function createGameCard(details) {
        const gameItem = document.createElement("div");
        gameItem.className = "game-item";
        gameItem.innerHTML = `
            <h2>${details.name}</h2>
            <div class="game-item-content">
                <img src="${details.imageUrl}" alt="${details.name}" class="game-image">
                <div class="game-details">
                    <div class="player-count">${details.minPlayers === details.maxPlayers ? details.minPlayers + (details.minPlayers > 1 ? ' players' : ' player'): details.minPlayers + '-'  + details.maxPlayers + ' players'}</div>
                    <div class="playing-time">Time: ${details.playingTime} mins</div>
                    <div class="weight">Complexity:${generateWeightBarsHTML(details.weight || 0)}</div>
                </div>
                <div class="rating" style="color: hsl(${details.rating * 12}, 100%, 50%)">${details.rating}</div>
            </div>
        `;
        gameItem.addEventListener("click", () => openDrawer(details));
        return gameItem;
    }

    fetchGameCollection("Glasenator");
});
