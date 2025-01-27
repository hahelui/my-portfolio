// Define DOM elements
const toggleButton = document.querySelector("#toggle-button");
const root = document.querySelector(":root");
const storageKey = "color-mode";
const defaultMode = "light-mode";

// Load the user's preferred color mode from local storage.
function loadColorMode() {
  const colorMode = localStorage.getItem(storageKey) || defaultMode;
  root.classList.add(colorMode);
  
  // Set the checkbox state based on the loaded theme
  toggleButton.checked = colorMode === "dark-mode";
  
  // Dispatch event for initial load
  document.dispatchEvent(new Event('colorModeChanged'));
}

loadColorMode();

// Toggle the color mode
toggleButton.addEventListener("click", () => {
  saveColorMode();
});

// Save the user's preferred color mode to local storage
function saveColorMode() {
  // Use the checkbox state to determine the mode
  const currentMode = toggleButton.checked ? "dark-mode" : "light-mode";
  root.classList.remove("light-mode", "dark-mode");
  root.classList.add(currentMode);
  localStorage.setItem(storageKey, currentMode);
  
  // Dispatch event when mode changes
  document.dispatchEvent(new Event('colorModeChanged'));
}
