import { openDrawer } from "./drawer.js";
import { convertWeightToTeach } from "./utils.js";

const gameListContainer = document.getElementById("game-list");

export async function fetchGameCollection(username) {
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
        const gameId = Number(item.getAttribute("objectid"));
        const owned = item.querySelector("status")?.getAttribute("own") === "1";
        const image = item.querySelector("image")?.textContent || "https://media.istockphoto.com/id/1295474183/vector/surprise-mystery-box-icon.jpg?s=612x612&w=0&k=20&c=ebChMCVwLzK6ZL40ZRwRDKmep7fsslAJOIPp9WlsSJI=";

        if (!owned) {
            console.log(`Skipping game with ID ${gameId} as it is not owned.`);
            return;
        }

        fetchGameDetails(gameId, games, image).then(details => {
            if (!details) {
                console.log(`Skipping game with ID ${gameId} as details are not available.`);
                return; // Skip if details are null
            }

            if (details.itemType === "expansion") {
                console.log(`Skipping game ${details.name} as it is not a standalone game.`);
                return;
            }

            gameListContainer.appendChild(createGameCard(details));
        }).catch(error => {
            console.error(`Error fetching details for game with ID ${gameId}:`, error);
        });
    });
  } catch (error) {
      console.error("Error fetching game collection:", error);
      gameListContainer.innerHTML = `<p>Failed to load game collection. Please try again later.</p>`;
  }
}

async function fetchGameDetails(gameId, games, image) {
    const game = games.find(g => Number(g.objectid) === Number(gameId));
    if (!game) {
        console.warn(`Game with ID ${gameId} not found in the API response.`);
        return null; // Return null if the game is not found
    }

    // Log the game object for debugging
    console.log("Fetched game details:", game);

    // Ensure all required properties are included
    return {
        id: game.objectid,
        name: game.objectname || "Unknown Game",
        imageUrl: image,
        minPlayers: game.minplayers || "N/A",
        maxPlayers: game.maxplayers || "N/A",
        playingTime: game.playingtime || "N/A",
        weight: game.avgweight || 0,
        rating: game.rating || "N/A",
        description: game.description || "No description available.",
        itemType: game.itemtype || "game",
    };
}

export function filterGames() {
  const filterNameInput = document.getElementById("filter-name");
  const filterPlayerCount = document.getElementById("filter-playercount");
  const filterRating = document.getElementById("filter-rating");
  const filterPlayingTime = document.getElementById("filter-playingtime");
  const filterComplexity = document.getElementById("filter-weight");

  const filters = {
    text: filterNameInput.value.toLowerCase(),
    playerCount: filterPlayerCount.value,
    rating: parseFloat(filterRating.value) || null,
    playingTime: parseInt(filterPlayingTime.value) || null,
    complexity: filterComplexity.value,
  };

  Array.from(gameListContainer.children).forEach(gameItem => {
    const playerCountText = gameItem.querySelector(".player-count")?.textContent || "";
    const playerCounts = playerCountText.match(/\d+/g)?.map(Number) || [];

    const gameData = {
        name: gameItem.querySelector("h2").textContent.toLowerCase(),
        playerCounts,
        rating: parseFloat(gameItem.querySelector(".rating")?.textContent) || 0,
        playingTime: parseInt(gameItem.querySelector(".playing-time")?.textContent.match(/\d+/)) || 0,
        complexity: gameItem.querySelector(".teach")?.textContent || "",
    };

    const matches = {
        name: gameData.name.includes(filters.text),
        playerCount: !filters.playerCount || (
            gameData.playerCounts.length === 2
                ? filters.playerCount >= gameData.playerCounts[0] && filters.playerCount <= gameData.playerCounts[1]
                : filters.playerCount == gameData.playerCounts[0]
        ),
        rating: !filters.rating || gameData.rating >= filters.rating,
        playingTime: !filters.playingTime || gameData.playingTime >= filters.playingTime,
        complexity: !filters.complexity || gameData.complexity === filters.complexity,
    };

    gameItem.style.display = Object.values(matches).every(Boolean) ? "" : "none";
  });
}

function createGameCard(details) {
    // Log the details object for debugging
    console.log("Creating game card with details:", details);

    const gameItem = document.createElement("div");
    gameItem.className = "game-item";
    gameItem.innerHTML = `
        <h2>${details.name}</h2>
        <div class="game-item-content">
            <img src="${details.imageUrl}" alt="${details.name}" class="game-image">
            <div class="game-details">
                <div class="player-count">${details.minPlayers === details.maxPlayers ? details.minPlayers + (details.minPlayers > 1 ? ' players' : ' player') : details.minPlayers + '-' + details.maxPlayers + ' players'}</div>
                <div class="playing-time">${details.playingTime} mins</div>
                <span class="weight">${details.weight}</span>
                <div class="teach">${convertWeightToTeach(details.weight)}</div>
            </div>
            <div class="rating" style="color: hsl(${details.rating * 12}, 100%, 50%)">${details.rating}</div>
        </div>
    `;
    gameItem.addEventListener("click", () => openDrawer(details));
    return gameItem;
}