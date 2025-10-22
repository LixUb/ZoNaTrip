const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 Serve file statis dari folder "public"
app.use(express.static(path.join(__dirname, 'public')));

// 🔹 Konfigurasi multer (upload)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
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

// 🔹 Helper functions
function formatDateForFilename(date) {
  return date.toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
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

// 🔹 Simpan booking ke file
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

// 🔹 POST: terima booking
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

// 🔹 Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Homepage.html'));
});

// 🔹 Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// 🔹 Jalankan server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  console.log(`🌐 Current Date (UTC): ${formatDateUTC()}`);
  console.log(`👤 Current User: LixUb`);
});
