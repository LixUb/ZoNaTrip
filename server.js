const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname)));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

function formatDateForFilename(date) {
    return date.toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .split('.')[0];
}

function formatDateUTC() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function saveBookingToFile(bookingData, username) {
    const bookingsDir = path.join(__dirname, 'bookings');
    if (!fs.existsSync(bookingsDir)) {
        fs.mkdirSync(bookingsDir);
    }

    const date = new Date();
    const formattedDate = formatDateForFilename(date);
    const fileName = `${formattedDate}-${username}.txt`;
    const filePath = path.join(bookingsDir, fileName);

    const bookingContent = `Booking Details:
Date (UTC): ${formatDateUTC()}
User: ${username}
Name: ${bookingData.nama}
Email: ${bookingData.email}
Phone: ${bookingData.telp}
Number of Guests: ${bookingData.tamu}
Destination: ${bookingData.destination}
Travel Date: ${bookingData.date}
Booking Notes: ${bookingData.catatan}
Food Notes: ${bookingData.catatanMakanan}

Orders:
${JSON.stringify(bookingData.orders, null, 2)}

ID/Passport File: ${bookingData.ktpFile || 'Not uploaded'}
`;

    fs.writeFileSync(filePath, bookingContent);
    return fileName;
}

app.post('/submit-booking', upload.single('ktp'), (req, res) => {
    try {
        const bookingData = {
            ...req.body,
            ktpFile: req.file ? req.file.filename : null,
            timestamp: new Date()
        };

        const fileName = saveBookingToFile(bookingData, 'LixUb'); 

        console.log('Booking saved to:', fileName);
        console.log('Received booking:', bookingData);

        res.json({
            success: true,
            message: 'Booking received successfully',
            redirectUrl: '/submit.html',
            fileName: fileName
        });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your booking'
        });
    }
});

app.get('/local.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'local.html'));
});

app.get('/booking-international', (req, res) => {
    res.sendFile(path.join(__dirname, 'booking-international.html'));
});

const pages = {
    '/Homepage.html': 'Homepage.html',
    '/accomodation.html': 'accomodation.html',
    '/places.html': 'places.html',
    '/event.html': 'event.html',
    '/gozona.html': 'gozona.html',
    '/submit.html': 'submit.html'
};

Object.entries(pages).forEach(([route, file]) => {
    app.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, file));
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Current Date and Time (UTC): ${formatDateUTC()}`);
    console.log(`Current User's Login: LixUb`);
});