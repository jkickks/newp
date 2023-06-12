const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Add any other Firebase configuration options here if needed
});

const db = admin.firestore();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
app.use(express.static('public'));

app.post('/upload', upload.single('pdfFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const buffer = req.file.buffer;
  try {
    const data = await pdf(buffer);
    const text = data.text;

    // Store the extracted text in Firestore
    const docRef = await db.collection('pdfs').add({
      text: text,
      uploadedAt: admin.firestore.Timestamp.now()
    });

    res.send(text);
    console.log('PDF uploaded and stored in Firestore with ID:', docRef.id);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    res.status(500).send('Error parsing PDF.');
  }
});

const server = app.listen(3000, () => {
  console.log('Server listening on port 3000');
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
