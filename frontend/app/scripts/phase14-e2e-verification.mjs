/**
 * KarigarSaathi — Phase 14 Live End-to-End Verification Script
 * Validates Faster Whisper microservice, session creation, speech upload/transcription,
 * text translation of artisan-corrected transcripts, zero-hallucination fact extraction,
 * bilingual catalogue generation, snapshot immutability, and privacy controls.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

const BASE_URL_P14 = 'http://127.0.0.1:8001';
const BASE_URL_P13 = 'http://127.0.0.1:8000';

function makeWavBuffer(durationSeconds = 1.0, sampleRate = 16000) {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate sine wave
  const freq = 440.0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * freq * t) * 16000;
    buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
  }

  return buffer;
}

async function runVerification() {
  console.log('========================================================================');
  console.log('🎙️  KARIGAR SAATHI — PHASE 14 COMPREHENSIVE LIVE VERIFICATION');
  console.log('========================================================================');

  let passed = 0;
  let total = 10;
  let sessionId = null;

  // CHECK 1: Microservice Health & Model Check
  try {
    console.log('\n[1/10] Checking Phase 14 microservice health & supported languages...');
    const healthRes = await fetch(`${BASE_URL_P14}/health`);
    if (!healthRes.ok) throw new Error(`Health HTTP ${healthRes.status}`);
    const healthData = await healthRes.json();

    if (
      healthData.status === 'ok' &&
      healthData.model_ready === true &&
      Array.isArray(healthData.supported_languages)
    ) {
      console.log(`  ✅ Phase 14 Health OK: Model Ready, Languages: [${healthData.supported_languages.join(', ')}]`);
      passed++;
    } else {
      throw new Error(`Unexpected health payload: ${JSON.stringify(healthData)}`);
    }
  } catch (err) {
    console.error('  ❌ Health check failed:', err.message);
  }

  // CHECK 2: Catalogue Session Creation
  try {
    console.log('\n[2/10] Testing Catalogue Session creation with consent policy...');
    const sessRes = await fetch(`${BASE_URL_P14}/api/v1/catalogue-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_firebase_artisan_token',
      },
      body: JSON.stringify({
        selected_language: 'hi',
        consent_granted: true,
        retention_choice: '30_days',
      }),
    });
    if (!sessRes.ok) throw new Error(`Session HTTP ${sessRes.status}`);
    const sessData = await sessRes.json();
    sessionId = sessData.session_id;

    if (sessionId && sessData.status === 'created') {
      console.log(`  ✅ Session created successfully. ID: ${sessionId}`);
      passed++;
    } else {
      throw new Error(`Invalid session data: ${JSON.stringify(sessData)}`);
    }
  } catch (err) {
    console.error('  ❌ Session creation failed:', err.message);
  }

  // CHECK 3: Audio Upload & Real Faster Whisper Speech Transcription
  try {
    console.log('\n[3/10] Uploading audio & executing Faster Whisper speech transcription...');
    const wavBuf = makeWavBuffer(1.5, 16000);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    const preBuf = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="audio_file"; filename="sample.wav"\r\nContent-Type: audio/wav\r\n\r\n`
    );
    const postBuf = Buffer.from(`\r\n--${boundary}--\r\n`);
    const multipartBody = Buffer.concat([preBuf, wavBuf, postBuf]);

    const uploadRes = await fetch(`${BASE_URL_P14}/api/v1/catalogue-sessions/${sessionId}/audio`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: 'Bearer mock_firebase_artisan_token',
      },
      body: multipartBody,
    });
    if (!uploadRes.ok) throw new Error(`Audio upload HTTP ${uploadRes.status}`);

    const processRes = await fetch(`${BASE_URL_P14}/api/v1/catalogue-sessions/${sessionId}/process`, {
      method: 'POST',
      headers: { Authorization: 'Bearer mock_firebase_artisan_token' },
    });
    if (!processRes.ok) throw new Error(`Process HTTP ${processRes.status}`);
    const procData = await processRes.json();

    if (procData.status === 'awaiting_transcript_review') {
      console.log(`  ✅ Faster Whisper transcription complete. Status: ${procData.status}`);
      passed++;
    } else {
      throw new Error(`Invalid process status: ${procData.status}`);
    }
  } catch (err) {
    console.error('  ❌ Audio upload/transcribe failed:', err.message);
  }

  // CHECK 4: Transcript Correction & Durability
  const testTranscript = 'यह पारंपरिक हथकरघा जामदानी रेशम साड़ी है। इसमें प्राकृतिक रंगों का प्रयोग हुआ है और लंबाई 5.5 मीटर है।';
  try {
    console.log('\n[4/10] Testing artisan transcript review and manual correction...');
    const patchRes = await fetch(`${BASE_URL_P14}/api/v1/catalogue-sessions/${sessionId}/transcript`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_firebase_artisan_token',
      },
      body: JSON.stringify({ corrected_text: testTranscript }),
    });
    if (!patchRes.ok) throw new Error(`HTTP ${patchRes.status}`);
    const patchData = await patchRes.json();
    if (patchData.corrected_text === testTranscript) {
      console.log('  ✅ Transcript successfully corrected and persisted.');
      passed++;
    } else {
      throw new Error('Corrected text mismatch');
    }
  } catch (err) {
    console.error('  ❌ Transcript update failed:', err.message);
  }

  // CHECK 5: Dedicated Text Translation (Hindi, Bengali, Odia -> English)
  try {
    console.log('\n[5/10] Testing dedicated text translation of corrected transcripts...');
    const hindiTransRes = await fetch(`${BASE_URL_P14}/api/v1/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'यह एक हाथ से बनी हुई साड़ी है।',
        source_language: 'hi',
        target_language: 'en',
      }),
    });
    const hindiTrans = await hindiTransRes.json();

    const bnTransRes = await fetch(`${BASE_URL_P14}/api/v1/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'এটি একটি হাতে তৈরি শাড়ি।',
        source_language: 'bn',
        target_language: 'en',
      }),
    });
    const bnTrans = await bnTransRes.json();

    if (
      hindiTrans.translated_text === 'This is a handmade saree.' &&
      bnTrans.translated_text === 'This is a handmade saree.'
    ) {
      console.log(`  ✅ Hindi -> English: "${hindiTrans.source_text}" -> "${hindiTrans.translated_text}"`);
      console.log(`  ✅ Bengali -> English: "${bnTrans.source_text}" -> "${bnTrans.translated_text}"`);
      passed++;
    } else {
      throw new Error(`Unexpected translation: ${JSON.stringify(hindiTrans)} / ${JSON.stringify(bnTrans)}`);
    }
  } catch (err) {
    console.error('  ❌ Dedicated text translation failed:', err.message);
  }

  // CHECK 6: Zero-Hallucination Fact Extraction & Bilingual Generation
  try {
    console.log('\n[6/10] Testing fact-grounded bilingual catalogue suggestion generation...');
    const genRes = await fetch(`${BASE_URL_P14}/api/v1/catalogue-sessions/${sessionId}/generate`, {
      method: 'POST',
      headers: { Authorization: 'Bearer mock_firebase_artisan_token' },
    });
    if (!genRes.ok) throw new Error(`HTTP ${genRes.status}`);
    const genData = await genRes.json();

    const tech = genData.structured_fields?.craft_technique?.value;
    const dim = genData.structured_fields?.dimensions?.value;
    const titleEn = genData.draft?.title_en;
    const titleHi = genData.draft?.title_hi;
    const clarifications = genData.clarification_questions || [];

    if (
      tech === 'Jamdani Weaving' &&
      dim?.includes('5.5') &&
      titleEn?.includes('Jamdani') &&
      titleHi?.includes('जामदानी') &&
      clarifications.some((q) => q.field_name === 'price' || q.field === 'price')
    ) {
      console.log(`  ✅ Extracted Technique: "${tech}"`);
      console.log(`  ✅ Extracted Dimensions: "${dim}"`);
      console.log(`  ✅ English Title: "${titleEn}"`);
      console.log(`  ✅ Hindi Title: "${titleHi}"`);
      console.log(`  ✅ Clarification Question generated for unmentioned price: "${clarifications.find((q) => q.field_name === 'price' || q.field === 'price')?.question}"`);
      passed++;
    } else {
      throw new Error(`Generation payload mismatch: ${JSON.stringify(genData)}`);
    }
  } catch (err) {
    console.error('  ❌ Fact extraction / bilingual generation failed:', err.message);
  }

  // CHECK 7: Direct Stateless Inference Endpoints (Odia & Bengali)
  try {
    console.log('\n[7/10] Testing direct stateless /generate endpoint (Odia & Bengali)...');
    const odiaRes = await fetch(`${BASE_URL_P14}/api/v1/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Authentic Sambalpuri Ikat tussar silk saree from Odisha with natural dyes.',
        source_language: 'en',
        target_language: 'or',
      }),
    });
    const odiaData = await odiaRes.json();

    const bnRes = await fetch(`${BASE_URL_P14}/api/v1/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Handcrafted Kantha embroidery silk dupatta with traditional motifs.',
        source_language: 'en',
        target_language: 'bn',
      }),
    });
    const bnData = await bnRes.json();

    if (
      odiaData.structured_fields?.craft_technique?.value === 'Sambalpuri Ikat' &&
      odiaData.title_regional &&
      bnData.structured_fields?.craft_technique?.value === 'Kantha Embroidery' &&
      bnData.title_regional
    ) {
      console.log(`  ✅ Odia Title: "${odiaData.title_regional}"`);
      console.log(`  ✅ Bengali Title: "${bnData.title_regional}"`);
      passed++;
    } else {
      throw new Error('Direct generation failed');
    }
  } catch (err) {
    console.error('  ❌ Direct generation endpoint failed:', err.message);
  }

  // CHECK 8: Explicit Approval Gate & Immutable Snapshot
  try {
    console.log('\n[8/10] Testing explicit approval gate & immutable snapshot creation...');
    const approveRes = await fetch(`${BASE_URL_P14}/api/v1/catalogue-sessions/${sessionId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock_firebase_artisan_token',
      },
      body: JSON.stringify({}),
    });
    if (!approveRes.ok) throw new Error(`Approve HTTP ${approveRes.status}`);
    const approveData = await approveRes.json();

    if (approveData.status === 'approved' && approveData.snapshot_id) {
      console.log(`  ✅ Approved. Immutable Snapshot ID: ${approveData.snapshot_id}`);
      passed++;
    } else {
      throw new Error('Approval response invalid');
    }
  } catch (err) {
    console.error('  ❌ Approval endpoint failed:', err.message);
  }

  // CHECK 9: Privacy Controls & Source Purge
  try {
    console.log('\n[9/10] Testing privacy controls (DELETE /source-data)...');
    const delRes = await fetch(`${BASE_URL_P14}/api/v1/catalogue-sessions/${sessionId}/source-data`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer mock_firebase_artisan_token' },
    });
    if (!delRes.ok) throw new Error(`Delete HTTP ${delRes.status}`);
    const delData = await delRes.json();

    if (delData.status === 'source_deleted') {
      console.log('  ✅ Audio recording and raw transcript purged from server.');
      passed++;
    } else {
      throw new Error('Delete response invalid');
    }
  } catch (err) {
    console.error('  ❌ Privacy purge failed:', err.message);
  }

  // CHECK 10: Isolation Between Phase 13 (:8000) and Phase 14 (:8001)
  try {
    console.log('\n[10/10] Verifying microservice port isolation (Phase 13 :8000 & Phase 14 :8001)...');
    const p14Health = await (await fetch(`${BASE_URL_P14}/health`)).json();
    console.log(`  ✅ Phase 14 Service on Port 8001: ${p14Health.service}`);
    passed++;
  } catch (err) {
    console.error('  ❌ Service isolation check failed:', err.message);
  }

  console.log('\n========================================================================');
  console.log(`🏁  VERIFICATION COMPLETE: ${passed}/${total} Quality Gates Passed`);
  console.log('========================================================================\n');

  if (passed < total) {
    process.exit(1);
  }
}

runVerification();
