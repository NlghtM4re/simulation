const simulationButton = document.getElementById("simulationButton");
const conceptButton = document.getElementById("conceptButton");

if(simulationButton) {
    simulationButton.addEventListener("click", () => {
        window.location.href = "simulation.html";
    });
} else if(conceptButton) {
    conceptButton.addEventListener("click", () => {
        window.location.href = "concept.html";
    });
}