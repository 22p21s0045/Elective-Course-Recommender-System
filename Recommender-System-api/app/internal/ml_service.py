from sentence_transformers import SentenceTransformer
from app.database import SessionLocal
from app.models import CourseMaster

embedding_model = SentenceTransformer('intfloat/multilingual-e5-large')

def generate_and_update_embedding(course_uuid: str, description: str):
    db = SessionLocal()
    try:
        if not description:
            return

        text_to_encode = f"passage: {description}"

        vector = embedding_model.encode([text_to_encode], normalize_embeddings=True)[0]

        course = db.query(CourseMaster).filter(CourseMaster.id == course_uuid).first()
        if course:
            course.embedding_vector = vector.tolist()
            db.commit()
            db.refresh(course)
            print(f"Background Task: Embedded course {course.course_id} {course.course_name_en} successfully!")

    except Exception as e:
        db.rollback()
        print(f"Background Task Error: {str(e)}")

    finally:
        db.close()
