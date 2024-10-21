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

// Load Bldg 104 parking lot statuses
loadParkingStatuses("bldg104", (id, data) => {
  return data.floorName.includes("North") ? "bldg104north" : "bldg104south";
});

// Load Parking Garage statuses
loadParkingStatuses("parkingGarage", (id, data) => {
  const idMapping = {
    "2nd Deck": "2nddeck",
    "3rd Deck": "3rddeck",
    "4th Deck": "4thdeck",
    "5th Deck": "5thdeck",
    "6th Deck": "6thdeck",
    "7th Deck (Roof)": "7thdeck"
  };
  
  // Use the floorName field to map to the button IDs
  return idMapping[data.floorName] || null; // Return null if no matching ID is found
});

// Helper function to extract floor name from button ID
function getFloorNameFromButtonId(buttonId) {
  switch (buttonId) {
    case "bldg104north":
      return "Bldg 104 North (GS-15/O-6/9:30am)";
    case "bldg104south":
      return "Bldg 104 South (GS-15/O-6/9:30am)";
    case "2nddeck":
      return "2nd Deck";
    case "3rddeck":
      return "3rd Deck";
    case "4thdeck":
      return "4th Deck";
    case "5thdeck":
      return "5th Deck";
    case "6thdeck":
      return "6th Deck";
    case "7thdeck":
      return "7th Deck (Roof)";
    default:
      return ""; // Return empty string for unexpected IDs
  }
} // Missing closing brace was added here

// Function to handle button click and toggle parking status
async function handleLotStatusUpdate(buttonId, currentStatus) {
  const nextStatus = getNextStatus(currentStatus);

  // Get the collection name based on the buttonId
  const collectionName = buttonId.includes("bldg104") ? "bldg104" : "parkingGarage";

  // Create a query for the document by floorName
  const q = query(collection(db, collectionName), where("floorName", "==", getFloorNameFromButtonId(buttonId)));
  console.log(`Querying for floorName: ${getFloorNameFromButtonId(buttonId)}`); // Debugging line

  const querySnapshot = await getDocs(q);
  console.log(`Query Snapshot for ${getFloorNameFromButtonId(buttonId)}:`, querySnapshot); // Log the snapshot

  if (!querySnapshot.empty) {
    const docSnapshot = querySnapshot.docs[0];

    await updateDoc(docSnapshot.ref, { statusNR: nextStatus });

    // Update the button color
    updateButtonColor(buttonId, nextStatus); // Using buttonId directly for color update
  } else {
    console.error("No matching document found for floorName: ", getFloorNameFromButtonId(buttonId));
  }
}

// Function to cycle through the statuses
function getNextStatus(currentStatus) {
  if (currentStatus === "6+ Spaces") return "1-5 Spaces";
  if (currentStatus === "1-5 Spaces") return "FULL";
  return "6+ Spaces"; // Reset to "6+ Spaces" after "FULL"
}

// Attach event listeners to buttons
document.addEventListener('DOMContentLoaded', () => {
  const bldg104Buttons = [
    { id: "bldg104north", collection: "bldg104", doc: "north" },
    { id: "bldg104south", collection: "bldg104", doc: "south" }
  ];

  const garageButtons = [
    "2nddeck", "3rddeck", "4thdeck", "5thdeck", "6thdeck", "7thdeck"
  ].map(floor => ({ id: floor, collection: "parkingGarage", doc: floor.replace(' ', '') }));

  const allButtons = [...bldg104Buttons, ...garageButtons];

  allButtons.forEach(({ id, collection, doc }) => {
    document.getElementById(id).addEventListener('click', function () {
      const currentStatus = this.className.includes("green") ? "6+ Spaces"
                         : this.className.includes("yellow") ? "1-5 Spaces"
                         : "FULL";
      handleLotStatusUpdate(doc, currentStatus);
    });
  });
});
