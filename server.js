const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/ktp';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'KTP-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

function formatOrderDetails(orders) {
  const items = {

    lemonTea: { name: 'Lemon Tea (Hangat)', price: 25000 },
    lemonTeaCold: { name: 'Lemon Tea (Dingin)', price: 25000 },
    raspberryLime: { name: 'Raspberry Lime (Dingin)', price: 25000 },
    sunmofeeLatte: { name: 'Sunmofee Latte (Dingin)', price: 30000 },
    biscoffCoffee: { name: 'Biscoff Coffee (Dingin)', price: 35000 },
    
    nasiGoreng: { name: 'Nasi Goreng Seafood', price: 35000 },
    riceBowl: { name: 'Rice Bowl Ayam Rica', price: 35000 },
    sweetTea: { name: 'Sweet Tea (Hangat)', price: 10000 },
    sweetTeaCold: { name: 'Sweet Tea (Dingin)', price: 10000 },
    kopi: { name: 'Kopi (Hangat, Gelas)', price: 10000 },
    esBandung: { name: 'Es Bandung (Dingin)', price: 20000 },
    esJerukKelapa: { name: 'Es Jeruk Kelapa (Dingin)', price: 35000 }
  };

  let orderList = '';
  let totalPrice = 0;

  for (const [key, quantity] of Object.entries(orders)) {
    if (quantity > 0 && items[key]) {
      const itemTotal = items[key].price * quantity;
      totalPrice += itemTotal;
      orderList += `- ${items[key].name}: ${quantity}x @ IDR ${items[key].price.toLocaleString('id-ID')} = IDR ${itemTotal.toLocaleString('id-ID')}\n`;
    }
  }

  return { orderList, totalPrice };
}

app.post('/api/booking', upload.single('ktp'), async (req, res) => {
  try {
    const {
      nama,
      email,
      telp,
      tamu,
      destination,
      date,
      catatan,
      catatanMakanan,
      orders
    } = req.body;

    if (!nama || !email || !telp || !tamu || !destination || !date || !catatan || !catatanMakanan) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mohon lengkapi semua field yang wajib diisi!' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mohon upload gambar E-KTP/Paspor!' 
      });
    }

    const parsedOrders = typeof orders === 'string' ? JSON.parse(orders) : orders;
    const { orderList, totalPrice } = formatOrderDetails(parsedOrders);

    const bookingId = 'BK-' + Date.now();

    const bookingData = {
      bookingId,
      nama,
      email,
      telp,
      tamu,
      destination,
      date,
      catatan,
      catatanMakanan,
      orders: parsedOrders,
      totalPrice,
      ktpPath: req.file.path,
      createdAt: new Date().toISOString()
    };
    const bookingsDir = 'data/bookings';
    if (!fs.existsSync(bookingsDir)) {
      fs.mkdirSync(bookingsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(bookingsDir, `${bookingId}.json`),
      JSON.stringify(bookingData, null, 2)
    );

    const customerMailOptions = {
      from: process.env.EMAIL_USER || 'zona.official@gmail.com',
      to: email,
      subject: `Booking Confirmation - ${bookingId}`,
      html: `
        <h2>Booking Confirmation</h2>
        <p>Terima kasih atas booking Anda, ${nama}!</p>
        <h3>Detail Booking:</h3>
        <ul>
          <li><strong>Booking ID:</strong> ${bookingId}</li>
          <li><strong>Tujuan:</strong> ${destination}</li>
          <li><strong>Tanggal:</strong> ${date}</li>
          <li><strong>Jumlah Tamu:</strong> ${tamu} orang</li>
        </ul>
        <h3>Pesanan:</h3>
        <pre>${orderList || 'Tidak ada pesanan makanan/minuman'}</pre>
        <p><strong>Total Perkiraan:</strong> IDR ${totalPrice.toLocaleString('id-ID')}</p>
        <h3>Catatan Booking:</h3>
        <p>${catatan}</p>
        <h3>Catatan Makanan & Minuman:</h3>
        <p>${catatanMakanan}</p>
        <hr>
        <p>Kami akan menghubungi Anda segera untuk konfirmasi lebih lanjut.</p>
        <p>Salam,<br>Tim ZoNa</p>
      `
    };

    const adminMailOptions = {
      from: process.env.EMAIL_USER || 'zona.official@gmail.com',
      to: 'zona.official@gmail.com',
      subject: `New Booking - ${bookingId}`,
      html: `
        <h2>New Booking Received</h2>
        <h3>Customer Information:</h3>
        <ul>
          <li><strong>Nama:</strong> ${nama}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Telepon:</strong> ${telp}</li>
          <li><strong>Jumlah Tamu:</strong> ${tamu} orang</li>
        </ul>
        <h3>Booking Details:</h3>
        <ul>
          <li><strong>Booking ID:</strong> ${bookingId}</li>
          <li><strong>Tujuan:</strong> ${destination}</li>
          <li><strong>Tanggal:</strong> ${date}</li>
        </ul>
        <h3>Orders:</h3>
        <pre>${orderList || 'No food/drink orders'}</pre>
        <p><strong>Total Estimate:</strong> IDR ${totalPrice.toLocaleString('id-ID')}</p>
        <h3>Catatan Booking:</h3>
        <p>${catatan}</p>
        <h3>Catatan Makanan & Minuman:</h3>
        <p>${catatanMakanan}</p>
        <p><strong>KTP/Passport:</strong> Uploaded to ${req.file.path}</p>
      `,
      attachments: [{
        filename: req.file.filename,
        path: req.file.path
      }]
    };

    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(adminMailOptions);

    res.json({
      success: true,
      message: 'Booking berhasil dikirim!',
      bookingId: bookingId,
      data: {
        ...bookingData,
        ktpPath: undefined 
      }
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses booking. Silakan coba lagi.',
      error: error.message
    });
  }
});

app.get('/api/booking/:id', (req, res) => {
  try {
    const bookingPath = path.join('data/bookings', `${req.params.id}.json`);
    
    if (!fs.existsSync(bookingPath)) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    const bookingData = JSON.parse(fs.readFileSync(bookingPath, 'utf8'));
    delete bookingData.ktpPath;
    
    res.json({
      success: true,
      data: bookingData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving booking',
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}`);
});

module.exports = app;