import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration object (replace with your actual Firebase config)
const firebaseConfig = {
  apiKey: "AIzaSyA3RGuZJJkAKFnZrbWzsnrLGFlJfH7njz4",
  authDomain: "navalreactorsparking.firebaseapp.com",
  projectId: "navalreactorsparking",
  storageBucket: "navalreactorsparking.appspot.com",
  messagingSenderId: "170552670421",
  appId: "1:170552670421:web:892b9c0e9d669c04814a5c",
  measurementId: "G-2H8L16MP0E"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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

// Load Bldg 104 parking lot statuses
db.collection("bldg104").get().then((querySnapshot) => {
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const buttonId = data.floorName.includes("North") ? "bldg104north" : "bldg104south";
    updateButtonColor(buttonId, data.statusNR);
  });
});

// Load Parking Garage statuses
db.collection("parkingGarage").get().then((querySnapshot) => {
  querySnapshot.forEach((doc) => {
    const buttonId = doc.id.toLowerCase().replace(/\s+/g, '');
    const data = doc.data();
    updateButtonColor(buttonId, data.statusNR);
  });
});

// Function to handle button click and toggle parking status
function handleLotStatusUpdate(lotId, collection, currentStatus) {
  const nextStatus = getNextStatus(currentStatus);
  
  db.collection(collection).doc(lotId).update({
    statusNR: nextStatus
  })
  .then(() => {
    updateButtonColor(lotId, nextStatus);
  })
  .catch((error) => {
    console.error("Error updating parking lot status: ", error);
  });
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
