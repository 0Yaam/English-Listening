from __future__ import annotations

from app.data_access.adapters.youtube_subtitle_adapter import YouTubeSubtitleAdapter


def test_youtube_subtitle_adapter_parses_vtt_segments() -> None:
    adapter = YouTubeSubtitleAdapter()
    raw_vtt = """WEBVTT

00:00:01.000 --> 00:00:03.500
<c>Good listening</c> &amp; shadowing

00:00:04.000 --> 00:00:06.000 align:start position:0%
<00:00:04.200>helps learners notice rhythm.
"""

    segments = adapter._parse_vtt(raw_vtt)

    assert len(segments) == 2
    assert segments[0].text == "Good listening & shadowing"
    assert segments[0].start == 1.0
    assert segments[0].duration == 2.5
    assert segments[1].text == "helps learners notice rhythm."


def test_youtube_subtitle_adapter_prefers_manual_subtitles() -> None:
    adapter = YouTubeSubtitleAdapter()
    info = {
        "subtitles": {
            "en": [
                {
                    "ext": "vtt",
                    "url": "https://example.test/manual.vtt",
                    "name": "English",
                },
            ],
        },
        "automatic_captions": {
            "en": [
                {
                    "ext": "vtt",
                    "url": "https://example.test/auto.vtt",
                    "name": "English auto",
                },
            ],
        },
    }

    track = adapter._select_subtitle_track(info=info, languages=("en",))

    assert track["url"] == "https://example.test/manual.vtt"
    assert track["is_generated"] is False


def test_youtube_subtitle_adapter_falls_back_to_language_variant() -> None:
    adapter = YouTubeSubtitleAdapter()
    info = {
        "subtitles": {},
        "automatic_captions": {
            "en-US": [
                {
                    "ext": "vtt",
                    "url": "https://example.test/en-us.vtt",
                    "name": "English US",
                },
            ],
        },
    }

    track = adapter._select_subtitle_track(info=info, languages=("en",))

    assert track["language_code"] == "en-US"
    assert track["is_generated"] is True
