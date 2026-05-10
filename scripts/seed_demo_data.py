from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import or_
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
from app.data_access.models.vocabulary_orm import VocabularyItemORM
from app.security.password import hash_password


DEMO_PASSWORD = "Demo12345"
LEGACY_DEMO_EMAILS = ("demo@shadowing.local",)


@dataclass(frozen=True)
class QuestionSeed:
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: str


@dataclass(frozen=True)
class VocabularySeed:
    term: str
    context_sentence: str
    definition: str
    difficulty: str = "medium"


@dataclass(frozen=True)
class SessionSeed:
    video_id: str
    video_title: str
    source_url: str
    accuracy_score: float
    completed_at: datetime
    transcript: str
    quiz_title: str | None = None
    questions: tuple[QuestionSeed, ...] = ()
    selected_answers: tuple[str, ...] = ()
    vocabulary: tuple[VocabularySeed, ...] = ()


@dataclass(frozen=True)
class UserSeed:
    username: str
    email: str
    sessions: tuple[SessionSeed, ...]


def count_words(text: str) -> int:
    return len([token for token in text.split() if token.strip()])


def normalize_term(term: str) -> str:
    return term.strip().lower()


def question(
    text: str,
    *,
    a: str,
    b: str,
    c: str,
    d: str,
    correct: str,
    explanation: str,
) -> QuestionSeed:
    return QuestionSeed(
        question=text,
        option_a=a,
        option_b=b,
        option_c=c,
        option_d=d,
        correct_answer=correct,
        explanation=explanation,
    )


def vocabulary(term: str, context: str, definition: str, difficulty: str = "medium") -> VocabularySeed:
    return VocabularySeed(
        term=term,
        context_sentence=context,
        definition=definition,
        difficulty=difficulty,
    )


DEMO_USERS: tuple[UserSeed, ...] = (
    UserSeed(
        username="shadowingdemo",
        email="demo@shadowingstudio.app",
        sessions=(
            SessionSeed(
                video_id="yt-shadowing-ready-001",
                video_title="How Short Shadowing Sessions Build Listening Habits",
                source_url="https://www.youtube.com/watch?v=yt-shadowing-ready-001",
                accuracy_score=84.6,
                completed_at=datetime(2026, 5, 3, 9, 15, 0),
                transcript=(
                    "Shadowing works best when learners focus on short and clear audio segments. "
                    "Instead of trying to understand a full video at once, they repeat a smaller part, "
                    "notice the missing words, and compare what they heard with the original sentence. "
                    "This process improves attention, rhythm, and word recognition over time. "
                    "A short practice session can feel simple, but repeated sessions create a stronger listening habit."
                ),
                vocabulary=(
                    vocabulary(
                        "audio segments",
                        "Shadowing works best when learners focus on short and clear audio segments.",
                        "Short parts of spoken audio used for focused listening practice.",
                        "easy",
                    ),
                    vocabulary(
                        "word recognition",
                        "This process improves attention, rhythm, and word recognition over time.",
                        "The ability to identify words accurately while listening.",
                    ),
                ),
            ),
            SessionSeed(
                video_id="yt-shadowing-quiz-002",
                video_title="Why Consistent Shadowing Improves English Faster",
                source_url="https://www.youtube.com/watch?v=yt-shadowing-quiz-002",
                accuracy_score=91.2,
                completed_at=datetime(2026, 5, 2, 20, 30, 0),
                transcript=(
                    "Many learners think progress comes only from long study hours, but consistency is often more important. "
                    "A focused ten minute practice session gives the brain a clear task and keeps motivation stable. "
                    "When students replay a short segment, listen carefully, and type the missing words, they train both memory and comprehension. "
                    "Over several weeks, this repeated routine makes difficult videos feel more manageable and less stressful."
                ),
                quiz_title="Reading Quiz - Consistent Shadowing",
                questions=(
                    question(
                        "What does the transcript say matters more than long study hours?",
                        a="Studying with friends",
                        b="Consistency",
                        c="Using harder videos",
                        d="Taking long breaks",
                        correct="B",
                        explanation="The transcript says consistency is often more important than long study hours.",
                    ),
                    question(
                        "Why is a focused ten minute practice session useful?",
                        a="It gives the brain a clear task",
                        b="It replaces all other study methods",
                        c="It removes the need for replay",
                        d="It guarantees perfect pronunciation",
                        correct="A",
                        explanation="The passage says a focused session gives the brain a clear task.",
                    ),
                    question(
                        "What do students train when they replay a segment and type missing words?",
                        a="Only pronunciation",
                        b="Grammar and spelling only",
                        c="Memory and comprehension",
                        d="Speed reading",
                        correct="C",
                        explanation="The transcript says this trains both memory and comprehension.",
                    ),
                    question(
                        "How do difficult videos feel after several weeks of repeated routine?",
                        a="More stressful",
                        b="Less manageable",
                        c="More entertaining",
                        d="More manageable and less stressful",
                        correct="D",
                        explanation="The final sentence says difficult videos become more manageable and less stressful.",
                    ),
                    question(
                        "What is the overall message of the transcript?",
                        a="Learners should avoid short practice sessions",
                        b="Regular focused practice can improve listening gradually",
                        c="Only advanced learners benefit from shadowing",
                        d="Long sessions are the only effective approach",
                        correct="B",
                        explanation="The passage emphasizes steady, focused practice for gradual improvement.",
                    ),
                ),
                selected_answers=("B", "A", "C", "D", "A"),
                vocabulary=(
                    vocabulary(
                        "consistency",
                        "Many learners think progress comes only from long study hours, but consistency is often more important.",
                        "The habit of doing something regularly over time.",
                    ),
                    vocabulary(
                        "manageable",
                        "Over several weeks, this repeated routine makes difficult videos feel more manageable.",
                        "Possible to handle or control without too much difficulty.",
                    ),
                ),
            ),
            SessionSeed(
                video_id="yt-shadowing-attempt-003",
                video_title="Turning Short Videos into Effective Study Material",
                source_url="https://www.youtube.com/watch?v=yt-shadowing-attempt-003",
                accuracy_score=77.4,
                completed_at=datetime(2026, 5, 1, 18, 5, 0),
                transcript=(
                    "Good listening practice is not about rushing through content. "
                    "A learner who pauses, repeats, and reflects can understand more than a learner who only watches passively. "
                    "This is why structured shadowing sessions can turn short videos into effective study material for long term improvement."
                ),
                vocabulary=(
                    vocabulary(
                        "reflects",
                        "A learner who pauses, repeats, and reflects can understand more.",
                        "Thinks carefully about what they have heard or learned.",
                    ),
                ),
            ),
        ),
    ),
    UserSeed(
        username="teacher_demo",
        email="teacher.demo@shadowingstudio.app",
        sessions=(
            SessionSeed(
                video_id="yt-teacher-demo-001",
                video_title="Helping Students Notice Key Words While Listening",
                source_url="https://www.youtube.com/watch?v=yt-teacher-demo-001",
                accuracy_score=88.0,
                completed_at=datetime(2026, 5, 4, 8, 45, 0),
                transcript=(
                    "Teachers can make listening practice more effective by asking students to notice key words first. "
                    "When students listen for names, numbers, dates, and repeated phrases, they build a frame for understanding the whole message. "
                    "After that, they can replay the audio and focus on details that were unclear during the first attempt."
                ),
                vocabulary=(
                    vocabulary(
                        "key words",
                        "Teachers can make listening practice more effective by asking students to notice key words first.",
                        "Important words that carry the main meaning of a sentence.",
                        "easy",
                    ),
                    vocabulary(
                        "repeated phrases",
                        "Students listen for names, numbers, dates, and repeated phrases.",
                        "Groups of words that appear more than once.",
                    ),
                ),
            ),
            SessionSeed(
                video_id="yt-teacher-demo-002",
                video_title="Checking Understanding with Short Reading Quizzes",
                source_url="https://www.youtube.com/watch?v=yt-teacher-demo-002",
                accuracy_score=94.5,
                completed_at=datetime(2026, 5, 4, 9, 20, 0),
                transcript=(
                    "A short quiz helps students check whether they understood the main idea and supporting details. "
                    "The best questions do not ask students to memorize every word. "
                    "Instead, they ask students to connect information, identify reasons, and choose the answer that matches the transcript."
                ),
                quiz_title="Reading Quiz - Understanding Checks",
                questions=(
                    question(
                        "What does a short quiz help students check?",
                        a="Their drawing skill",
                        b="Main ideas and supporting details",
                        c="Their typing speed",
                        d="The length of a video",
                        correct="B",
                        explanation="The transcript says a short quiz checks main ideas and supporting details.",
                    ),
                    question(
                        "What should the best questions avoid?",
                        a="Asking students to memorize every word",
                        b="Asking about the transcript",
                        c="Checking understanding",
                        d="Using clear answers",
                        correct="A",
                        explanation="The text says good questions do not ask students to memorize every word.",
                    ),
                    question(
                        "What should students do when answering better questions?",
                        a="Ignore the transcript",
                        b="Guess as quickly as possible",
                        c="Connect information and identify reasons",
                        d="Only count the number of sentences",
                        correct="C",
                        explanation="The passage says students should connect information and identify reasons.",
                    ),
                    question(
                        "Which answer should students choose?",
                        a="The shortest answer",
                        b="The answer that matches the transcript",
                        c="The first answer",
                        d="The most difficult answer",
                        correct="B",
                        explanation="The final sentence says students should choose the answer that matches the transcript.",
                    ),
                ),
                selected_answers=("B", "A", "C", "B"),
                vocabulary=(
                    vocabulary(
                        "supporting details",
                        "A short quiz helps students check whether they understood the main idea and supporting details.",
                        "Facts or examples that explain or support the main idea.",
                    ),
                    vocabulary(
                        "identify",
                        "They ask students to connect information, identify reasons, and choose the answer.",
                        "To recognize or find something clearly.",
                        "easy",
                    ),
                ),
            ),
        ),
    ),
    UserSeed(
        username="student_demo",
        email="student.demo@shadowingstudio.app",
        sessions=(
            SessionSeed(
                video_id="yt-student-demo-001",
                video_title="Building Confidence Before Speaking Practice",
                source_url="https://www.youtube.com/watch?v=yt-student-demo-001",
                accuracy_score=72.0,
                completed_at=datetime(2026, 5, 5, 19, 10, 0),
                transcript=(
                    "Many students feel nervous before speaking because they are not sure how English rhythm should sound. "
                    "Listening and shadowing give them a safe way to copy natural pauses, stress, and intonation. "
                    "With enough repetition, students begin to speak with more confidence and fewer long pauses."
                ),
                vocabulary=(
                    vocabulary(
                        "intonation",
                        "Listening and shadowing give them a safe way to copy natural pauses, stress, and intonation.",
                        "The rise and fall of the voice when speaking.",
                        "hard",
                    ),
                    vocabulary(
                        "confidence",
                        "Students begin to speak with more confidence and fewer long pauses.",
                        "A feeling that you can do something well.",
                        "easy",
                    ),
                ),
            ),
            SessionSeed(
                video_id="yt-student-demo-002",
                video_title="Learning from Mistakes in Dictation Practice",
                source_url="https://www.youtube.com/watch?v=yt-student-demo-002",
                accuracy_score=81.8,
                completed_at=datetime(2026, 5, 5, 20, 0, 0),
                transcript=(
                    "Mistakes in dictation are useful because they show exactly where listening breaks down. "
                    "A missing article may show a grammar habit, while a wrong verb may show that the learner missed a sound change. "
                    "When students review these mistakes calmly, they can choose one small target for the next practice session."
                ),
                quiz_title="Reading Quiz - Dictation Mistakes",
                questions=(
                    question(
                        "Why are mistakes in dictation useful?",
                        a="They show where listening breaks down",
                        b="They prove students should stop practicing",
                        c="They replace teacher feedback",
                        d="They make videos shorter",
                        correct="A",
                        explanation="The transcript says mistakes show exactly where listening breaks down.",
                    ),
                    question(
                        "What may a missing article show?",
                        a="A strong accent",
                        b="A grammar habit",
                        c="A perfect answer",
                        d="A video problem",
                        correct="B",
                        explanation="The transcript says a missing article may show a grammar habit.",
                    ),
                    question(
                        "What may a wrong verb show?",
                        a="The learner typed too fast",
                        b="The learner missed a sound change",
                        c="The question was impossible",
                        d="The transcript was too long",
                        correct="B",
                        explanation="The passage links a wrong verb to missing a sound change.",
                    ),
                    question(
                        "What should students choose for the next practice session?",
                        a="One small target",
                        b="Five difficult videos",
                        c="A longer password",
                        d="A new account",
                        correct="A",
                        explanation="The final sentence says students can choose one small target.",
                    ),
                ),
                selected_answers=("A", "B", "C", "A"),
                vocabulary=(
                    vocabulary(
                        "breaks down",
                        "Mistakes in dictation are useful because they show exactly where listening breaks down.",
                        "Stops working correctly or becomes difficult to continue.",
                    ),
                    vocabulary(
                        "sound change",
                        "A wrong verb may show that the learner missed a sound change.",
                        "A change in pronunciation when words are spoken naturally.",
                        "hard",
                    ),
                ),
            ),
        ),
    ),
)


def build_question(seed: QuestionSeed) -> QuizQuestionORM:
    return QuizQuestionORM(
        question=seed.question,
        option_a=seed.option_a,
        option_b=seed.option_b,
        option_c=seed.option_c,
        option_d=seed.option_d,
        correct_answer=seed.correct_answer,
        explanation=seed.explanation,
    )


def seed_session(db, user: UserORM, seed: SessionSeed) -> None:
    session = ShadowingSessionORM(
        user_id=user.id,
        video_id=seed.video_id,
        video_title=seed.video_title,
        source_url=seed.source_url,
        accuracy_score=seed.accuracy_score,
        completed_at=seed.completed_at,
    )
    db.add(session)
    db.flush()

    db.add(
        TranscriptORM(
            session_id=session.id,
            raw_text=seed.transcript,
            language="English",
            language_code="en",
            word_count=count_words(seed.transcript),
        ),
    )

    for item in seed.vocabulary:
        db.add(
            VocabularyItemORM(
                user_id=user.id,
                session_id=session.id,
                term=item.term,
                term_normalized=normalize_term(item.term),
                context_sentence=item.context_sentence,
                definition=item.definition,
                difficulty=item.difficulty,
                is_saved=True,
            ),
        )

    if not seed.quiz_title:
        return

    quiz = QuizORM(
        session_id=session.id,
        user_id=user.id,
        title=seed.quiz_title,
        status="generated",
    )
    quiz.questions = [build_question(item) for item in seed.questions]
    db.add(quiz)
    db.flush()

    correct_count = 0
    attempt = QuizAttemptORM(
        quiz_id=quiz.id,
        user_id=user.id,
        score=0.0,
        total_questions=len(quiz.questions),
        correct_count=0,
        submitted_at=seed.completed_at,
    )
    db.add(attempt)
    db.flush()

    for quiz_question, selected_answer in zip(quiz.questions, seed.selected_answers, strict=True):
        is_correct = selected_answer == quiz_question.correct_answer
        correct_count += int(is_correct)
        db.add(
            QuizAttemptAnswerORM(
                attempt_id=attempt.id,
                question_id=quiz_question.id,
                selected_answer=selected_answer,
                is_correct=is_correct,
            ),
        )

    attempt.correct_count = correct_count
    attempt.score = round((correct_count / len(quiz.questions)) * 100, 1)


def main() -> None:
    init_db()
    session_factory = get_session_factory()

    demo_emails = tuple(user.email for user in DEMO_USERS)
    demo_usernames = tuple(user.username for user in DEMO_USERS)

    with session_factory() as db:
        existing_users = db.scalars(
            select(UserORM).where(
                or_(
                    UserORM.email.in_((*demo_emails, *LEGACY_DEMO_EMAILS)),
                    UserORM.username.in_(demo_usernames),
                ),
            ),
        ).all()
        for existing_user in existing_users:
            db.delete(existing_user)
        if existing_users:
            db.commit()

        for user_seed in DEMO_USERS:
            user = UserORM(
                username=user_seed.username,
                email=user_seed.email,
                password_hash=hash_password(DEMO_PASSWORD),
            )
            db.add(user)
            db.flush()

            for session_seed in user_seed.sessions:
                seed_session(db, user, session_seed)

        db.commit()

    print("Seeded demo data successfully.")
    print(f"Password for all demo accounts: {DEMO_PASSWORD}")
    for user_seed in DEMO_USERS:
        quiz_count = len([session for session in user_seed.sessions if session.quiz_title])
        vocabulary_count = sum(len(session.vocabulary) for session in user_seed.sessions)
        print(
            f"- {user_seed.email} | username={user_seed.username} | "
            f"sessions={len(user_seed.sessions)} | quizzes={quiz_count} | vocabulary={vocabulary_count}"
        )


if __name__ == "__main__":
    main()
