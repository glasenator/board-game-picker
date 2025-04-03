export function convertWeightToTeach(weight) {
    if (weight <= 1.42) return "Learn immediately!";
    else if (weight <= 1.91) return "Needs a brief explanation.";
    else if (weight <= 2.2) return "You will need to think a bit.";
    else if (weight <= 2.4) return "Looking for a challenge";
    else if (weight <= 3) return "Brain power 100% required.";
    else if (weight <= 5) return "Your head will explode!";
    else return "N/A";
}

export function generateWeightBarsHTML(weight) {
    const maxBars = 5;
    let barsHTML = '<div class="weight-bars">';
    for (let i = 1; i <= maxBars; i++) {
        const isActive = weight >= i ? "active" : "";
        barsHTML += `<div class="weight-bar ${isActive}" style="height: ${i * 4}px;"></div>`;
    }
    barsHTML += '</div>';
    return barsHTML;
}