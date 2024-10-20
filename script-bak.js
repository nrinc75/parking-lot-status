// Backend URL (Replit)
const backendUrl = 'https://parking-lot-backend.nrinc75.repl.co';

// Function to handle button click and send data to the backend
function handleLotStatusUpdate(lotId, isFull) {
  // Create the request payload
  const data = {
    lotId: lotId,
    status: isFull ? 'full' : 'available',
  };

  // Send POST request to the backend to update parking lot status
  fetch(`${backendUrl}/api/update-lot-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Success:', data);
      updateButtonColor(lotId, isFull); // Update the button color based on the response
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

// Function to update button color (green for available, red for full)
function updateButtonColor(lotId, isFull) {
  const button = document.getElementById(lotId);
  button.style.backgroundColor = isFull ? 'red' : 'green';
}

// Event listeners for buttons
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.parking-button');
  
  buttons.forEach((button) => {
    button.addEventListener('click', function () {
      const isFull = this.style.backgroundColor !== 'red'; // Toggle the status
      handleLotStatusUpdate(this.id, isFull);
    });
  });
});
