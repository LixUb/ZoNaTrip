// server.js
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files (so local.html and booking-international.html are accessible)
app.use(express.static(__dirname));
app.use("/uploads", express.static(uploadsDir));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/gozonaBooking", {
    // modern mongoose doesn't require these options; kept for older versions compatibility
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-"));
  },
});
const upload = multer({ storage });

// Mongoose schema
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

// Simple root check
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "local.html"));
});

// Serve forms explicitly (optional)
app.get("/local", (req, res) => res.sendFile(path.join(__dirname, "local.html")));
app.get("/booking-international", (req, res) => res.sendFile(path.join(__dirname, "booking-international.html")));

// Booking POST route
// Expect multipart/form-data with file field "fileIdentitas" and fields:
// formType, nama, email, telp, jumlahTamu, catatan, catatanMakanan, setuju
app.post("/api/booking", upload.single("fileIdentitas"), async (req, res) => {
  try {
    // Normalize incoming values
    const body = req.body || {};
    const jumlah = body.jumlahTamu ? Number(body.jumlahTamu) : undefined;
    const setujuVal =
      body.setuju === "true" || body.setuju === "on" || body.setuju === true;

    const data = new Booking({
      formType: body.formType || "local",
      nama: body.nama || "",
      email: body.email || "",
      telp: body.telp || "",
      jumlahTamu: isNaN(jumlah) ? undefined : jumlah,
      catatan: body.catatan || "",
      catatanMakanan: body.catatanMakanan || "",
      fileIdentitas: req.file ? path.join("uploads", path.basename(req.file.path)) : null,
      setuju: !!setujuVal,
    });

    await data.save();
    res.status(201).json({ message: "Booking berhasil disimpan", data });
  } catch (err) {
    console.error("Error saving booking:", err);
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});