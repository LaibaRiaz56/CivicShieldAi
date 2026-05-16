const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../services/db');
const { orchestrate } = require('../agents/orchestrator');
const { detectImageCrisis, transcribeAudio } = require('../services/mlService');

// POST /api/reports — submit a new citizen report
router.post('/', async (req, res, next) => {
  try {
    const { report, location, language, userId } = req.body;
    let imageDetections = null;
    let audioTranscript = null;

    // Handle image upload
    if (req.files?.image) {
      const img = req.files.image;
      imageDetections = await detectImageCrisis(img.tempFilePath, img.mimetype);
    }

    // Handle audio upload
    if (req.files?.audio) {
      const aud = req.files.audio;
      const transcription = await transcribeAudio(aud.tempFilePath, aud.mimetype);
      audioTranscript = transcription.transcript;
    }

    // Validate: require at least some text input
    if (!report && !audioTranscript && !imageDetections) {
      return res.status(400).json({ error: 'Please provide a report, audio, or image.' });
    }

    // Vague location check
    const vaguePatterns = /\b(yahan|yaar|idhar|udhar|kahi|here|there)\b/i;
    if ((!location || location === 'Unknown') && vaguePatterns.test(report || '')) {
      return res.status(422).json({
        clarification_needed: true,
        message: 'آپ کی رپورٹ موصول ہوئی، لیکن مقام واضح نہیں ہے۔ براہ کرم اپنا سیکٹر یا علاقہ بتائیں۔',
        message_english: 'Report received, but the location is not clear. Please specify your sector or area (e.g., G-10, F-8).',
      });
    }

    // Store report in DB
    const reportRecord = {
      id: uuidv4(),
      user_id: userId || 'anonymous',
      report_text: report || audioTranscript || '',
      location: location || 'Unknown',
      language: language || 'unknown',
      has_image: !!req.files?.image,
      has_audio: !!req.files?.audio,
      image_detections: imageDetections ? JSON.stringify(imageDetections) : null,
      audio_transcript: audioTranscript || null,
      status: 'received',
    };
    await db.insert('reports', reportRecord);

    // Trigger orchestration asynchronously (non-blocking)
    orchestrate({ report, audioTranscript, imageDetections, location, userId })
      .then(result => {
        db.update('reports', reportRecord.id, { incident_id: result.incident_id, status: 'processed' });
        console.log(`[Orchestrator] Incident ${result.incident_id} processed ✓`);
      })
      .catch(err => console.error('[Orchestrator Error]', err));

    res.status(202).json({
      success: true,
      report_id: reportRecord.id,
      message: 'آپ کی رپورٹ موصول ہوئی اور اس پر کارروائی ہو رہی ہے۔',
      message_english: 'Your report has been received and is being processed.',
      status: 'processing',
    });

  } catch (err) {
    next(err);
  }
});

// GET /api/reports — list all reports
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await db.getAll('reports');
    if (error) return res.status(500).json({ error });
    res.json({ reports: data || [], count: (data || []).length });
  } catch (err) { next(err); }
});

module.exports = router;
