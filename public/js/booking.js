async function submitBooking(event) {
    event.preventDefault();
    
    const formData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        bookingDate: document.getElementById('bookingDate').value,
        numberOfPeople: parseInt(document.getElementById('numberOfPeople').value),
        isInternational: document.getElementById('intlBtn').classList.contains('active'),
        identityNumber: document.getElementById('identityNumber').value,
        beverages: getBeveragesData(),
        foodNotes: document.getElementById('foodNotes').value,
        termsAccepted: document.getElementById('terms').checked
    };

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Booking successful!');
            window.location.href = '/booking-confirmation.html';
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while submitting the booking');
    }
}

function getBeveragesData() {
    // Implement logic to gather beverage selections
    const beverages = [];
    // Add logic to collect beverage data from the form
    return beverages;
}