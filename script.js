// Load the status from local storage when the page loads
window.onload = function() {
    loadStatus();
};

function toggleStatus(lotId) {
    const button = document.getElementById(lotId);
    if (button.classList.contains('red')) {
        button.classList.remove('red');
        button.textContent = button.textContent.replace('Full', 'Available');
        button.style.backgroundColor = 'green';
        saveStatus(lotId, 'available');
    } else {
        button.classList.add('red');
        button.textContent = button.textContent.replace('Available', 'Full');
        button.style.backgroundColor = 'red';
        saveStatus(lotId, 'full');
    }
}

// Save the status in local storage
function saveStatus(lotId, status) {
    localStorage.setItem(lotId, status);
}

// Load the status from local storage
function loadStatus() {
    const lots = ['lot1', 'lot2', 'lot3'];
    lots.forEach(lot => {
        const status = localStorage.getItem(lot);
        const button = document.getElementById(lot);
        if (status === 'full') {
            button.classList.add('red');
            button.textContent = button.textContent.replace('Available', 'Full');
            button.style.backgroundColor = 'red';
        }
    });
}
