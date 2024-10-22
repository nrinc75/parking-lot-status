import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Firebase configuration 
const firebaseConfig = { /* Your Firebase config here */ };

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

// Lookup function: Get floorName from buttonID
function getFloorNameFromButtonId(buttonId, data) {
  const item = data.find(d => d.buttonID === buttonId);
  return item ? item.floorName : null;
}

// Lookup function: Get buttonID from floorName
function getButtonIdFromFloorName(floorName, data) {
  const item = data.find(d => d.floorName === floorName);
  return item ? item.buttonID : null;
}

// Load parking statuses and update the button colors
async function loadParkingStatuses(collectionName, data) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  querySnapshot.forEach((docSnapshot) => {
    const docData = docSnapshot.data();
    const buttonId = getButtonIdFromFloorName(docData.floorName, data);
    if (!buttonId) {
      console.error(`No matching button for document: ${docSnapshot.id}`);
      return;
    }
    updateButtonColor(buttonId, docData.statusNR);
  });
}

// Function to handle button click and update parking status
async function handleLotStatusUpdate(buttonId, currentStatus, data) {
  const nextStatus = getNextStatus(currentStatus);
  const floorName = getFloorNameFromButtonId(buttonId, data);

  if (!floorName) {
    console.error(`No matching floorName for button: ${buttonId}`);
    return;
  }

  // Get the collection name based on the buttonId
  const collectionName = buttonId.includes("bldg104") ? "bldg104" : "parkingGarage";

  // Query Firestore for the document by floorName
  const q = query(collection(db, collectionName), where("floorName", "==", floorName));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const docSnapshot = querySnapshot.docs[0];
    await updateDoc(docSnapshot.ref, { statusNR: nextStatus });
    updateButtonColor(buttonId, nextStatus);
  } else {
    console.error(`No document found for floorName: ${floorName}`);
  }
}

// Function to cycle through the statuses
function getNextStatus(currentStatus) {
  if (currentStatus === "6+ Spaces") return "1-5 Spaces";
  if (currentStatus === "1-5 Spaces") return "FULL";
  return "6+ Spaces"; // Reset to "6+ Spaces" after "FULL"
}

// Load the JSON file and dynamically generate HTML buttons
fetch("parkingLocations.json")
  .then(response => response.json())
  .then(data => {
    const container = document.body;

    // Create buttons dynamically based on JSON data
    data.forEach(item => {
      const button = document.createElement("button");
      button.id = item.buttonID;
      button.textContent = item.buttonLabel;
      button.className = "lot-button";
      container.appendChild(button);

      // Attach click event to each button
      button.addEventListener("click", function () {
        const currentStatus = this.className.includes("green") ? "6+ Spaces"
                           : this.className.includes("yellow") ? "1-5 Spaces"
                           : "FULL";
        handleLotStatusUpdate(button.id, currentStatus, data);
      });
    });

    // Load parking statuses after creating the buttons
    loadParkingStatuses("bldg104", data);
    loadParkingStatuses("parkingGarage", data);
  });
