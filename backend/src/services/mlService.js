const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function detectImageCrisis(filePath, mimetype) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), { contentType: mimetype });
    const { data } = await axios.post(`${ML_URL}/detect-image`, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });
    return data;
  } catch (err) {
    console.warn('[ML Service] Image detection failed, using mock:', err.message);
    return getMockDetection();
  }
}

async function transcribeAudio(filePath, mimetype) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), { contentType: mimetype });
    const { data } = await axios.post(`${ML_URL}/transcribe-audio`, form, {
      headers: form.getHeaders(),
      timeout: 60000,
    });
    return data;
  } catch (err) {
    console.warn('[ML Service] Transcription failed, using mock:', err.message);
    return { transcript: 'G-10 mein pani bhar gaya hai, bohat zyada hai', language: 'roman_urdu', confidence: 0.88 };
  }
}

function getMockDetection() {
  const scenarios = [
    {
      detections: [
        { class: 'flood_water', confidence: 0.93, bbox: [120, 200, 450, 380] },
        { class: 'vehicle', confidence: 0.87, bbox: [300, 250, 420, 320] },
        { class: 'crowd', confidence: 0.72, bbox: [50, 180, 200, 350] },
      ],
      crisis_indicators: { flood: 0.93, fire: 0, smoke: 0, crowd_density: 0.72 },
      primary_detection: 'flood_water',
      image_quality: 'good',
      processing_time_ms: 234,
      source: 'mock_yolo',
    },
    {
      detections: [
        { class: 'smoke', confidence: 0.91, bbox: [100, 50, 500, 300] },
        { class: 'fire', confidence: 0.85, bbox: [200, 100, 420, 280] },
      ],
      crisis_indicators: { flood: 0, fire: 0.85, smoke: 0.91, crowd_density: 0 },
      primary_detection: 'smoke',
      image_quality: 'good',
      processing_time_ms: 198,
      source: 'mock_yolo',
    },
  ];
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

module.exports = { detectImageCrisis, transcribeAudio };
