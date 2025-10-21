// server.js
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Koneksi ke MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/gozonaBooking", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Setup multer untuk upload file (misalnya KTP)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Schema Mongoose
const bookingSchema = new mongoose.Schema({
  formType: { type: String, enum: ["local", "international"], default: "local" },
  nama: String,
  email: String,
  telp: String,
  jumlahTamu: Number,
  catatan: String,
  catatanMakanan: String,
  fileIdentitas: String,
  setuju: Boolean,
  tanggal: { type: Date, default: Date.now },
});

const Booking = mongoose.model("Booking", bookingSchema);

// Route utama
app.get("/", (req, res) => {
  res.send("Server booking Gozona aktif!");
});

// Route untuk simpan data booking
app.post("/api/booking", upload.single("fileIdentitas"), async (req, res) => {
  try {
    const data = new Booking({
      formType: req.body.formType,
      nama: req.body.nama,
      email: req.body.email,
      telp: req.body.telp,
      jumlahTamu: req.body.jumlahTamu,
      catatan: req.body.catatan,
      catatanMakanan: req.body.catatanMakanan,
      fileIdentitas: req.file ? req.file.path : null,
      setuju: req.body.setuju === "true" || req.body.setuju === true,
    });

    await data.save();
    res.status(201).json({ message: "Booking berhasil disimpan", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
