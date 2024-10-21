import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

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
    updateButtonColor(buttonId, data.statusNR);
  });
}

// Load Bldg 104 parking lot statuses
loadParkingStatuses("bldg104", (id, data) => {
  return data.floorName.includes("North") ? "bldg104north" : "bldg104south";
});

// Load Parking Garage statuses
loadParkingStatuses("parkingGarage", (id) => {
  return id.toLowerCase().replace(/\s+/g, '');
});

// Function to handle button click and toggle parking status
async function handleLotStatusUpdate(lotId, collection, currentStatus) {
  const nextStatus = getNextStatus(currentStatus);
  
  const docRef = doc(db, collection, lotId);
  try {
    await updateDoc(docRef, { statusNR: nextStatus });
    updateButtonColor(lotId, nextStatus);
  } catch (error) {
    console.error("Error updating parking lot status: ", error);
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
      handleLotStatusUpdate(doc, collection, currentStatus);
    });
  });
});
    
