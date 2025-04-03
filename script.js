import { initializeFilters } from "./filters.js";
import { initializeSorting } from "./sorting.js";
import { initializeDrawer } from "./drawer.js";
import { fetchGameCollection } from "./collection.js";

document.addEventListener("DOMContentLoaded", () => {
    initializeFilters();
    initializeSorting();
    initializeDrawer();
    fetchGameCollection("Glasenator");

    const toggleHeaderButton = document.getElementById("toggle-header");
    const headerContainer = document.getElementById("header-container");

    toggleHeaderButton.addEventListener("click", () => {
        const isCollapsed = headerContainer.classList.toggle("collapsed");
        toggleHeaderButton.textContent = isCollapsed ? "▼ Show Filters" : "▲ Hide Filters";
    });
});
