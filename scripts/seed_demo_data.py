from __future__ import annotations

from datetime import datetime
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import select

from app.data_access.database import get_session_factory
from app.data_access.database import init_db
from app.data_access.models.quiz_attempt_orm import QuizAttemptAnswerORM
from app.data_access.models.quiz_attempt_orm import QuizAttemptORM
from app.data_access.models.quiz_orm import QuizORM
from app.data_access.models.quiz_orm import QuizQuestionORM
from app.data_access.models.shadowing_session_orm import ShadowingSessionORM
from app.data_access.models.transcript_orm import TranscriptORM
from app.data_access.models.user_orm import UserORM
from app.security.password import hash_password

DEMO_EMAIL = "demo@shadowingstudio.app"
LEGACY_DEMO_EMAILS = ("demo@shadowing.local",)
DEMO_USERNAME = "shadowingdemo"
DEMO_PASSWORD = "Demo12345"


def count_words(text: str) -> int:
    return len([token for token in text.split() if token.strip()])


def build_question(
    *,
    question: str,
    option_a: str,
    option_b: str,
    option_c: str,
    option_d: str,
    correct_answer: str,
    explanation: str,
) -> QuizQuestionORM:
    return QuizQuestionORM(
        question=question,
        option_a=option_a,
        option_b=option_b,
        option_c=option_c,
        option_d=option_d,
        correct_answer=correct_answer,
        explanation=explanation,
    )


def main() -> None:
    init_db()
    session_factory = get_session_factory()

    with session_factory() as db:
        existing_users = db.scalars(
            select(UserORM).where(UserORM.email.in_((DEMO_EMAIL, *LEGACY_DEMO_EMAILS))),
        ).all()
        for existing_user in existing_users:
            db.delete(existing_user)
        if existing_users:
            db.commit()

        user = UserORM(
            username=DEMO_USERNAME,
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
        )
        db.add(user)
        db.flush()

        transcript_ready = (
            "Shadowing works best when learners focus on short and clear audio segments. "
            "Instead of trying to understand a full video at once, they repeat a smaller part, "
            "notice the missing words, and compare what they heard with the original sentence. "
            "This process improves attention, rhythm, and word recognition over time. "
            "A short practice session can feel simple, but repeated sessions create a stronger listening habit."
        )
        session_ready = ShadowingSessionORM(
            user_id=user.id,
            video_id="yt-shadowing-ready-001",
            video_title="How Short Shadowing Sessions Build Listening Habits",
            source_url="https://www.youtube.com/watch?v=yt-shadowing-ready-001",
            accuracy_score=84.6,
            completed_at=datetime(2026, 5, 3, 9, 15, 0),
        )
        db.add(session_ready)
        db.flush()
        db.add(
            TranscriptORM(
                session_id=session_ready.id,
                raw_text=transcript_ready,
                language="English",
                language_code="en",
                word_count=count_words(transcript_ready),
            ),
        )

        transcript_generated = (
            "Many learners think progress comes only from long study hours, but consistency is often more important. "
            "A focused ten minute practice session gives the brain a clear task and keeps motivation stable. "
            "When students replay a short segment, listen carefully, and type the missing words, they train both memory and comprehension. "
            "Over several weeks, this repeated routine makes difficult videos feel more manageable and less stressful."
        )
        session_generated = ShadowingSessionORM(
            user_id=user.id,
            video_id="yt-shadowing-quiz-002",
            video_title="Why Consistent Shadowing Improves English Faster",
            source_url="https://www.youtube.com/watch?v=yt-shadowing-quiz-002",
            accuracy_score=91.2,
            completed_at=datetime(2026, 5, 2, 20, 30, 0),
        )
        db.add(session_generated)
        db.flush()
        db.add(
            TranscriptORM(
                session_id=session_generated.id,
                raw_text=transcript_generated,
                language="English",
                language_code="en",
                word_count=count_words(transcript_generated),
            ),
        )

        quiz = QuizORM(
            session_id=session_generated.id,
            user_id=user.id,
            title="Reading Quiz - Consistent Shadowing",
            status="generated",
        )
        quiz.questions = [
            build_question(
                question="What does the transcript say matters more than long study hours?",
                option_a="Studying with friends",
                option_b="Consistency",
                option_c="Using harder videos",
                option_d="Taking long breaks",
                correct_answer="B",
                explanation="The transcript directly says consistency is often more important than long study hours.",
            ),
            build_question(
                question="Why is a focused ten minute practice session useful?",
                option_a="It gives the brain a clear task",
                option_b="It replaces all other study methods",
                option_c="It removes the need for replay",
                option_d="It guarantees perfect pronunciation",
                correct_answer="A",
                explanation="The transcript explains that a short focused session gives the brain a clear task and keeps motivation stable.",
            ),
            build_question(
                question="What do students train when they replay a segment and type missing words?",
                option_a="Only pronunciation",
                option_b="Grammar and spelling only",
                option_c="Memory and comprehension",
                option_d="Speed reading",
                correct_answer="C",
                explanation="The transcript explicitly mentions that this routine trains both memory and comprehension.",
            ),
            build_question(
                question="How do difficult videos feel after several weeks of repeated routine?",
                option_a="More stressful",
                option_b="Less manageable",
                option_c="More entertaining",
                option_d="More manageable and less stressful",
                correct_answer="D",
                explanation="The final sentence says difficult videos feel more manageable and less stressful over time.",
            ),
            build_question(
                question="What is the overall message of the transcript?",
                option_a="Learners should avoid short practice sessions",
                option_b="Regular focused practice can improve listening gradually",
                option_c="Only advanced learners benefit from shadowing",
                option_d="Long sessions are the only effective approach",
                correct_answer="B",
                explanation="The passage emphasizes the value of steady, focused practice for gradual listening improvement.",
            ),
        ]
        db.add(quiz)
        db.flush()

        attempt = QuizAttemptORM(
            quiz_id=quiz.id,
            user_id=user.id,
            score=80.0,
            total_questions=5,
            correct_count=4,
            submitted_at=datetime(2026, 5, 2, 20, 45, 0),
        )
        db.add(attempt)
        db.flush()

        selected_answers = ["B", "A", "C", "D", "A"]
        for question, selected_answer in zip(quiz.questions, selected_answers, strict=True):
            db.add(
                QuizAttemptAnswerORM(
                    attempt_id=attempt.id,
                    question_id=question.id,
                    selected_answer=selected_answer,
                    is_correct=selected_answer == question.correct_answer,
                ),
            )

        transcript_attempt = (
            "Good listening practice is not about rushing through content. "
            "A learner who pauses, repeats, and reflects can understand more than a learner who only watches passively. "
            "This is why structured shadowing sessions can turn short videos into effective study material for long term improvement."
        )
        session_attempt = ShadowingSessionORM(
            user_id=user.id,
            video_id="yt-shadowing-attempt-003",
            video_title="Turning Short Videos into Effective Study Material",
            source_url="https://www.youtube.com/watch?v=yt-shadowing-attempt-003",
            accuracy_score=77.4,
            completed_at=datetime(2026, 5, 1, 18, 5, 0),
        )
        db.add(session_attempt)
        db.flush()
        db.add(
            TranscriptORM(
                session_id=session_attempt.id,
                raw_text=transcript_attempt,
                language="English",
                language_code="en",
                word_count=count_words(transcript_attempt),
            ),
        )

        db.commit()

    print("Seeded demo data successfully.")
    print(f"Email: {DEMO_EMAIL}")
    print(f"Password: {DEMO_PASSWORD}")
    print("Sessions created: 3")
    print("Quiz-ready session: 1")
    print("Generated quiz session: 1")


if __name__ == "__main__":
    main()
