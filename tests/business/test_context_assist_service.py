from __future__ import annotations

from app.business.models.context_assist import ContextAssistSegment
from app.business.services.context_assist_service import ContextAssistService


def test_context_assist_fallback_masks_blanks_and_uses_natural_vietnamese() -> None:
    service = ContextAssistService(provider=None)

    items = service.build_context_assist(
        segments=[
            ContextAssistSegment(
                segment_index=0,
                text="Shadowing improves _____ and word recognition over time.",
                terms=("recognition", "there's"),
            ),
        ],
    )

    assert [item.term for item in items] == ["recognition", "there's"]
    assert items[0].meaning_vi == "khả năng nhận ra từ, âm thanh hoặc ý đã gặp trước đó"
    assert items[0].context_sentence == "Shadowing improves [blank] and word recognition over time."
    assert items[0].example == "Word recognition gets faster with repeated listening."
    assert "[blank]" not in items[0].example
    assert "A useful transcript word" not in items[0].meaning_en
    assert items[1].part_of_speech == "contraction / dạng rút gọn"


def test_context_assist_list_term_does_not_build_blank_chunks() -> None:
    service = ContextAssistService(provider=None)

    items = service.build_context_assist(
        segments=[
            ContextAssistSegment(
                segment_index=0,
                text="Our list [blank]. When's [blank] last place",
                terms=("list",),
            ),
        ],
    )

    assert items[0].term == "list"
    assert items[0].meaning_vi.startswith("danh sách")
    assert items[0].chunks == ("a list of", "make a list", "on the list", "list items")
    assert items[0].context_sentence == "Our list [blank]. When's [blank] last place"
    assert items[0].example == "Make a list of words you often miss."
    assert all("blank" not in chunk.lower() for chunk in items[0].chunks)
