#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Phase 14 — Voice Pipeline CLI Runner
=====================================
Demonstrates the complete pipeline:
  1. Accept audio file + source language
  2. Transcribe with Faster Whisper (or surface blocker for Odia)
  3. Allow transcript review/correction in terminal
  4. Pass corrected transcript to phase14-sarvam via Ollama
  5. Print original transcript, corrected transcript, Hindi output, English output

Usage:
  python pipeline_runner.py <audio_file> <language>
  python pipeline_runner.py recording.wav hi
  python pipeline_runner.py recording.mp3 en
  python pipeline_runner.py recording.wav bn
  python pipeline_runner.py --manual-text "Meri saari haath se bani hai" hi

Supported languages: hi, en, or (manual only), bn, te
"""
from __future__ import annotations

import sys
import os
import io
import argparse
import textwrap

# Make sure we can import from project root
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _THIS_DIR)

# Force UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from backend.app.adapters.translation import (
    OllamaSarvamTranslator,
    check_speech_support,
    LANGUAGE_NAMES,
    SPEECH_SUPPORTED_LANGUAGES,
)


SEPARATOR = "-" * 64


def print_section(title: str, body: str) -> None:
    print(f"\n{SEPARATOR}")
    print(f"  {title}")
    print(SEPARATOR)
    print(textwrap.fill(body, width=72) if body else "(empty)")


def transcribe_audio(audio_path: str, language: str) -> tuple[str, float]:
    """
    Transcribe audio file using Faster Whisper.
    Returns (transcript_text, confidence).
    Raises RuntimeError on failure.
    """
    with open(audio_path, "rb") as f:
        audio_bytes = f.read()

    ext = os.path.splitext(audio_path)[1].lstrip(".").lower() or "wav"

    from backend.app.adapters.speech import FasterWhisperSpeechAdapter
    from backend.app.adapters.speech.base import SpeechTranscriptionRequest

    adapter = FasterWhisperSpeechAdapter()
    import asyncio

    request = SpeechTranscriptionRequest(
        audio_data=audio_bytes,
        format=ext,
        language_hint=language,
    )

    try:
        response = asyncio.run(adapter.transcribe(request))
    except Exception as exc:
        raise RuntimeError(str(exc)) from exc

    return response.original_text or "", float(response.confidence or 0.0)


def ask_correction(original: str) -> str:
    """Prompt user to review / correct the transcript. Returns corrected text."""
    print_section("TRANSCRIPT REVIEW", original)
    print("\nPress ENTER to accept as-is, or type a corrected version:")
    try:
        correction = input("> ").strip()
    except (EOFError, KeyboardInterrupt):
        correction = ""
    return correction if correction else original


def run_pipeline(
    source_language: str,
    audio_path: str | None = None,
    manual_text: str | None = None,
) -> None:
    lang_name = LANGUAGE_NAMES.get(source_language, source_language)
    print(f"\nPhase 14 Voice Pipeline — language: {lang_name} ({source_language})")
    print(SEPARATOR)

    # --- Step 1: Speech Support Check ---
    speech_ok, blocker_msg = check_speech_support(source_language)

    original_transcript = ""

    if audio_path and not manual_text:
        if not speech_ok:
            print(f"\n[BLOCKER] {blocker_msg}")
            print("\nManual transcript entry required:")
            try:
                manual_text = input("> ").strip()
            except (EOFError, KeyboardInterrupt):
                manual_text = ""
            if not manual_text:
                print("No input provided. Exiting.")
                return
            original_transcript = manual_text
        else:
            # --- Step 2: Transcription ---
            print(f"\nTranscribing: {audio_path}")
            print(f"Language hint: {lang_name} ({source_language})")
            try:
                original_transcript, confidence = transcribe_audio(audio_path, source_language)
                print(f"Confidence: {confidence:.2f}")
                if not original_transcript:
                    print("[WARNING] Transcription returned empty — switching to manual entry")
                    print("Please type the spoken content:")
                    try:
                        original_transcript = input("> ").strip()
                    except (EOFError, KeyboardInterrupt):
                        original_transcript = ""
                    if not original_transcript:
                        print("No input provided. Exiting.")
                        return
            except RuntimeError as exc:
                print(f"[ERROR] Transcription failed: {exc}")
                print("Please type the spoken content manually:")
                try:
                    original_transcript = input("> ").strip()
                except (EOFError, KeyboardInterrupt):
                    original_transcript = ""
                if not original_transcript:
                    print("No input provided. Exiting.")
                    return
    elif manual_text:
        original_transcript = manual_text
        if not speech_ok:
            print(f"[INFO] Speech recognition not available for {lang_name}. Using provided text.")
        else:
            print(f"[INFO] Using manually provided text (no audio file).")
    else:
        print("[ERROR] Provide either --audio or --manual-text")
        return

    # --- Step 3: Transcript Review / Correction ---
    corrected_transcript = ask_correction(original_transcript)

    # --- Step 4: Translation via phase14-sarvam ---
    print(f"\nTranslating via phase14-sarvam (Ollama)...")
    translator = OllamaSarvamTranslator()
    result = translator.translate(corrected_transcript, source_language)

    # --- Step 5: Results ---
    print_section("ORIGINAL TRANSCRIPT", result["original_transcript"])
    print_section("CORRECTED TRANSCRIPT", result["corrected_transcript"])
    print_section("HINDI OUTPUT", result["hindi_output"] or "[not available]")
    print_section("ENGLISH OUTPUT", result["english_output"] or "[not available]")

    print(f"\nRouting path: {' | '.join(result['routing_path'])}")

    if result["review_required"]:
        print(f"\n[REVIEW REQUIRED] {result['review_reason']}")
    else:
        print("\n[Pipeline complete — all outputs ready for artisan review]")

    print(SEPARATOR)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Phase 14 Voice Pipeline CLI Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--audio", "-a", help="Path to audio file (wav, mp3, m4a, webm, ogg)")
    parser.add_argument(
        "--language", "-l",
        required=True,
        choices=list(LANGUAGE_NAMES.keys()),
        help="Source language code: hi, en, or, bn, te",
    )
    parser.add_argument("--manual-text", "-t", help="Provide transcript text directly (skips speech recognition)")

    args = parser.parse_args()

    if not args.audio and not args.manual_text:
        parser.error("Provide either --audio <file> or --manual-text <text>")

    if args.audio and not os.path.isfile(args.audio):
        parser.error(f"Audio file not found: {args.audio}")

    run_pipeline(
        source_language=args.language,
        audio_path=args.audio,
        manual_text=args.manual_text,
    )


if __name__ == "__main__":
    main()
