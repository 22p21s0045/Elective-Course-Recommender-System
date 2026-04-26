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


def calculate_calibrated_similarity(distance: float) -> float:
    MIN_DISTANCE = 0.10
    MAX_DISTANCE = 0.185

    # 1. ถ้าห่างเกินเกณฑ์ ตัดทิ้งเป็น 0% เลย
    if distance >= MAX_DISTANCE:
        return 0.0

    # 2. ถ้าใกล้เกินเกณฑ์ ให้เต็ม 100% ไปเลย
    if distance <= MIN_DISTANCE:
        return 100.0

    # 3. เทียบบัญญัติไตรยางศ์ (Min-Max Scaling) เพื่อขยายสเกลตรงกลาง
    # สูตร: ((Max - ค่าปัจจุบัน) / (Max - Min)) * 100
    calibrated_percent = ((MAX_DISTANCE - distance) / (MAX_DISTANCE - MIN_DISTANCE)) * 100

    return round(calibrated_percent, 2)