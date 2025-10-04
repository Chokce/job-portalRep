import { Router } from 'express';
import { firestore, storage } from '../lib/firebase.js';
import { requireAuth } from '../middleware/requireAuth.js';
import multer from 'multer';

const router = Router();

// Multer setup for memory storage
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// Public: list all applications
router.get('/', async (req, res) => {
  try {
    const snapshot = await firestore.collection('applications').orderBy('appliedAt', 'desc').get();
    const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(applications);
  } catch (err) { 
    res.status(500).json({ error: err.message });
  }
});


// Create a new application
router.post('/', upload.single('cv'), async (req, res) => {
  const { job_id, user_id, cover_letter, name, email } = req.body;
  if (!job_id || !name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'CV is required' });
  }

  try {
    // Upload CV to Firebase Storage
    const bucket = storage.bucket();
    const blob = bucket.file(`cvs/${Date.now()}-${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on('error', (err) => {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload CV' });
    });

    blobStream.on('finish', async () => {
        const cv_url = await blob.getSignedUrl({ action: 'read', expires: '03-09-2491' }).then(urls => urls[0]);

        // Save application to Firestore
        const application = {
          job_id,
          user_id: user_id || null, // User may not be logged in
          name,
          email,
          cv_url,
          cover_letter: cover_letter || null,
          appliedAt: new Date()
        };
        const docRef = await firestore.collection('applications').add(application);

        res.status(201).json({ id: docRef.id, ...application });
    });

    blobStream.end(req.file.buffer);

  } catch (err) {
    console.error(err); // Log the full error
    res.status(500).json({ error: 'Failed to submit application' });
  }
});


export default router;
