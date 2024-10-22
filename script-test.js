import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Firebase configuration 
const firebaseConfig = {
  apiKey: "AIzaSyA3RGuZJJkAKFnZrbWzsnrLGFlJfH7njz4",
  authDomain: "navalreactorsparking.firebaseapp.com",
  projectId: "navalreactorsparking",
  storageBucket: "navalreactorsparking.appspot.com",
  messagingSenderId: "170552670421",
  appId: "1:170552670421:web:892b9c0e9d669c04814a5c",
  measurementId: "G-2H8L16MP0E"
};

// Initialize Firebase app and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mapping status to colors
const statusToColor = {
  "6+ Spaces": "green",
  "1-5 Spaces": "yellow",
  "FULL": "red"
};

// Function to update button color based on parking status
function updateButtonColor(buttonId, status) {
  const button = document.getElementById(buttonId);
  const color = statusToColor[status];
  button.className = `lot-button ${color}`;
}

// Function to load parking statuses for a collection
async function loadParkingStatuses(collectionName, idMapper) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  querySnapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const buttonId = idMapper(docSnapshot.id, data);
    
    if (!buttonId) {
      console.error(`No matching button for document: ${docSnapshot.id}`);
      return; // Skip if buttonId is undefined
    }

    updateButtonColor(buttonId, data.statusNR);
  });
}

// Helper function to extract floor name from button ID
function getFloorNameFromButtonId(buttonId, locations) {
  const location = locations.find(loc => loc.buttonID === buttonId);
  return location ? location.floorName : "";
}

// Function to handle button click and toggle parking status
async function handleLotStatusUpdate(buttonId, currentStatus, locations) {
  const nextStatus = getNextStatus(currentStatus);
  const floorName = getFloorNameFromButtonId(buttonId, locations);

  // Get the collection name based on the buttonId
  const collectionName = locations.find(loc => loc.buttonID === buttonId).collection;

  // Create a query for the document by floorName
  const q = query(collection(db, collectionName), where("floorName", "==", floorName));
  console.log(`Querying for floorName: ${floorName}`); // Debugging line

  const querySnapshot = await getDocs(q);
  console.log(`Query Snapshot for ${floorName}:`, querySnapshot); // Log the snapshot

  if (!querySnapshot.empty) {
    const docSnapshot = querySnapshot.docs[0];

    await updateDoc(docSnapshot.ref, { statusNR: nextStatus });

    // Update the button color
    updateButtonColor(buttonId, nextStatus); // Using buttonId directly for color update
  } else {
    console.error("No matching document found for floorName: ", floorName);
  }
}

// Function to cycle through the statuses
function getNextStatus(currentStatus) {
  if (currentStatus === "6+ Spaces") return "1-5 Spaces";
  if (currentStatus === "1-5 Spaces") return "FULL";
  return "6+ Spaces"; // Reset to "6+ Spaces" after "FULL"
}

// Function to dynamically create buttons based on JSON data
function createButtons(parkingLocations) {
  const container = document.body; // You can target a specific section of the HTML if needed

  parkingLocations.forEach(location => {
    const button = document.createElement("button");
    button.id = location.buttonID;
    button.innerText = location.buttonLabel;
    button.className = "lot-button"; // Initial class, will be updated based on status

    // Attach click handler
    button.addEventListener('click', () => {
      const currentStatus = button.className.includes("green") ? "6+ Spaces"
                         : button.className.includes("yellow") ? "1-5 Spaces"
                         : "FULL";
      handleLotStatusUpdate(button.id, currentStatus, parkingLocations);
    });

    // Append button to the container
    container.appendChild(button);
  });
}

// Function to load JSON and initialize the buttons
async function loadParkingLocations() {
  const response = await fetch('parkingLocations.json'); // Fetch the JSON file
  const parkingLocations = await response.json(); // Parse JSON data

  createButtons(parkingLocations); // Dynamically create buttons

  // Now load Firestore data and update button statuses
  parkingLocations.forEach(location => {
    loadParkingStatuses(location.collection, (id, data) => {
      return location.buttonID; // Use the buttonID from JSON to update status
    });
  });
}

// Ensure the script runs after DOM is fully loaded
document.addEventListener('DOMContentLoaded', loadParkingLocations);
