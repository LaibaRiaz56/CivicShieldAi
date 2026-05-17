const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const db = require('../services/db');
const { orchestrate } = require('../agents/orchestrator');
const { detectImageCrisis, transcribeAudio } = require('../services/mlService');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports
// Submit emergency report
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    console.log('\n================ NEW REPORT =================');
    console.log('REPORT ROUTE HIT');
    console.log('BODY:', req.body);

    const { report, location, language, userId } = req.body;

    let imageDetections = null;
    let audioTranscript = null;

    // ─── Image Upload ──────────────────────────────────────────────────────
    if (req.files?.image) {
      console.log('IMAGE DETECTED');

      try {
        const img = req.files.image;

        imageDetections = await detectImageCrisis(
          img.tempFilePath,
          img.mimetype
        );

        console.log('IMAGE ANALYSIS:', imageDetections);

      } catch (imgErr) {
        console.error('IMAGE ANALYSIS ERROR:', imgErr);
      }
    }

    // ─── Audio Upload ──────────────────────────────────────────────────────
    if (req.files?.audio) {
      console.log('AUDIO DETECTED');

      try {
        const aud = req.files.audio;

        const transcription = await transcribeAudio(
          aud.tempFilePath,
          aud.mimetype
        );

        audioTranscript = transcription?.transcript || '';

        console.log('AUDIO TRANSCRIPT:', audioTranscript);

      } catch (audioErr) {
        console.error('AUDIO ERROR:', audioErr);
      }
    }

    // ─── Validation ────────────────────────────────────────────────────────
    if (!report && !audioTranscript && !imageDetections) {
      return res.status(400).json({
        error: 'Please provide a report, audio, or image.'
      });
    }

    // ─── Location Validation ───────────────────────────────────────────────
    const vaguePatterns =
      /\b(yahan|yaar|idhar|udhar|kahi|here|there)\b/i;

    if ((!location || location === 'Unknown') &&
      vaguePatterns.test(report || '')) {

      return res.status(422).json({
        clarification_needed: true,
        message:
          'آپ کی رپورٹ موصول ہوئی، لیکن مقام واضح نہیں ہے۔ براہ کرم اپنا سیکٹر یا علاقہ بتائیں۔',
        message_english:
          'Report received, but location is unclear. Please specify sector or area.',
      });
    }

    // ─── Create Report Record ──────────────────────────────────────────────
    const reportRecord = {
      id: uuidv4(),
      user_id: userId || 'anonymous',

      report_text: report || audioTranscript || '',

      location: location || 'Unknown',
      language: language || 'unknown',

      has_image: !!req.files?.image,
      has_audio: !!req.files?.audio,

      image_detections: imageDetections
        ? JSON.stringify(imageDetections)
        : null,

      audio_transcript: audioTranscript || null,

      status: 'processing',
      incident_id: null,
      ai_result: null,
    };

    console.log('SAVING REPORT TO DB...');

    const inserted = await db.insert('reports', reportRecord);

    console.log('REPORT SAVED:', inserted?.data?.[0]?.id);

    // ───────────────────────────────────────────────────────────────────────
    // START ORCHESTRATOR
    // ───────────────────────────────────────────────────────────────────────
    console.log('STARTING ORCHESTRATOR...');

    orchestrate({
      report,
      audioTranscript,
      imageDetections,
      location,
      userId,
    })

      .then(async result => {

        console.log('\n=========== ORCHESTRATOR SUCCESS ===========');
        console.log(result);

        try {

          await db.update('reports', reportRecord.id, {
            incident_id: result?.incident_id || null,
            status: 'processed',
            ai_result: JSON.stringify(result),
          });

          console.log(
            `[SUCCESS] Incident processed: ${result?.incident_id}`
          );

        } catch (updateErr) {

          console.error(
            '[REPORT UPDATE ERROR]',
            updateErr
          );
        }
      })

      .catch(err => {

        console.error('\n=========== ORCHESTRATOR FAILED ===========');
        console.error(err);
        console.error(err?.stack);
      });

    // ─── Immediate Response ────────────────────────────────────────────────
    res.status(202).json({
      success: true,

      report_id: reportRecord.id,

      message:
        'آپ کی رپورٹ موصول ہوئی اور اس پر کارروائی ہو رہی ہے۔',

      message_english:
        'Your report has been received and is being processed by AI agents.',

      status: 'processing',

      image_analysis: imageDetections
        ? {
          primary_detection:
            imageDetections.primary_detection,

          confidence:
            imageDetections.confidence,

          summary:
            imageDetections.summary,

          crisis_detected:
            imageDetections.crisis_detected,
        }
        : null,

      audio_transcript: audioTranscript || null,
    });

  } catch (err) {

    console.error('\n=========== REPORT ROUTE ERROR ===========');
    console.error(err);
    console.error(err?.stack);

    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/:id/result
// Poll orchestration result
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/result', async (req, res, next) => {
  try {

    const { data: report, error } =
      await db.selectOne('reports', req.params.id);

    if (error || !report) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    // Still processing
    if (
      report.status === 'processing' ||
      !report.ai_result
    ) {
      return res.json({
        status: 'processing',
        report_id: req.params.id,
        message:
          'AI agents are still analyzing your report...',
      });
    }

    let aiResult = {};

    try {
      aiResult = JSON.parse(report.ai_result);
    } catch {
      aiResult = {};
    }

    let incident = null;
    let agentTrace = [];

    if (report.incident_id) {

      const { data: inc } =
        await db.selectOne(
          'incidents',
          report.incident_id
        );

      incident = inc;

      const { data: traces } =
        await db.select(
          'agent_traces',
          { incident_id: report.incident_id }
        );

      if (traces?.[0]) {
        try {
          agentTrace =
            JSON.parse(traces[0].trace);
        } catch {
          agentTrace = [];
        }
      }
    }

    res.json({
      status: 'completed',

      report_id: req.params.id,
      incident_id: report.incident_id,

      crisis_type:
        aiResult.crisis_type ||
        incident?.crisis_type,

      severity_level:
        aiResult.severity_level ||
        incident?.severity_level,

      confidence:
        aiResult.confidence ||
        incident?.confidence,

      ticket_id:
        aiResult.ticket_id ||
        incident?.ticket_id,

      location:
        aiResult.location ||
        incident?.location,

      actions_taken:
        aiResult.actions_taken,

      citizens_alerted:
        aiResult.citizens_alerted ||
        incident?.citizens_alerted,

      outcome:
        aiResult.outcome,

      incident,

      agent_trace: agentTrace,

      total_time_ms:
        aiResult.total_time_ms,
    });

  } catch (err) {

    console.error('\n=========== RESULT ROUTE ERROR ===========');
    console.error(err);

    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {

    const { data, error } =
      await db.getAll('reports');

    if (error) {
      return res.status(500).json({ error });
    }

    res.json({
      reports: data || [],
      count: (data || []).length,
    });

  } catch (err) {

    console.error('REPORT LIST ERROR:', err);

    next(err);
  }
});

module.exports = router;