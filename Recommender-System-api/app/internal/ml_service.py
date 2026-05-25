from google import genai
from sentence_transformers import SentenceTransformer
from app.database import SessionLocal
from app.models import CourseMaster
from google.genai import types
from app.config import settings

embedding_model = SentenceTransformer('intfloat/multilingual-e5-large')
client = genai.Client(api_key=settings.GEMINI_API_KEY)


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


def generate_course_explanation(course_id: str, course_name: str, course_desc: str, student_topics: str,
                                predicted_grade: float) -> str:
    prompt = f"""
    คุณคืออาจารย์ที่ปรึกษาทางวิชาการระดับมหาวิทยาลัย หน้าที่ของคุณคือให้คำแนะนำรายวิชาเลือกแก่นักศึกษาด้วยความเป็นมืออาชีพ น่าเชื่อถือ และอ้างอิงจากข้อมูล

    ข้อมูลรายวิชา:
    - รหัสวิชา: {course_id}
    - รายชื่อวิชา: {course_name}
    - เนื้อหาวิชา: {course_desc}
    - ความสนใจของนักศึกษา: {student_topics}
    - เกรดที่คาดว่าจะได้: {predicted_grade:.2f} (เต็ม 4.00)

    คำสั่งและเงื่อนไข (Strict Guidelines):
    1. ความยาวและรูปแบบ: จงเขียนคำแนะนำเชิงวิชาการที่กระชับ ไม่เกิน 3 บรรทัด (ภาษาไทย) 
    2. การเชื่อมโยง: อธิบายความสอดคล้องระหว่าง "เนื้อหาวิชา" กับ "ความสนใจ" ของนักศึกษาอย่างสมเหตุสมผล เพื่อชี้ให้เห็นประโยชน์ที่จะได้รับ
    3. การให้กำลังใจ: กล่าวเสริมเพื่อสร้างความมั่นใจว่านักศึกษามีศักยภาพที่จะทำผลการเรียนในรายวิชานี้ได้ในระดับดีเยี่ยม (อ้างอิงจาก {predicted_grade} และ {student_topics})
    4. การใช้ภาษาและสรรพนาม: **บังคับใช้สรรพนามแทนนักศึกษาว่า "คุณ" เท่านั้น** (ห้ามใช้คำว่า น้อง, หนู, หรือผู้เรียน) และต้องใช้ระดับภาษาที่เป็นทางการ สุภาพ และน่าเชื่อถือ
    """

    try:
        response = client.models.generate_content(
            # model='gemini-3-flash-preview',
            model='gemini-2.5-flash',
            contents=[prompt],
            config=types.GenerateContentConfig(
                temperature=0.7
                # max_output_tokens=150,
            ),
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini LLM Error: {e}")
        return "วิชานี้มีเนื้อหาที่ตรงกับความสนใจของคุณ และจากประวัติการเรียน คุณมีโอกาสทำคะแนนได้ดีเยี่ยมครับ"
