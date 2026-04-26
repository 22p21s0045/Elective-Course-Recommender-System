import psycopg2
from psycopg2.extras import execute_batch
from sentence_transformers import SentenceTransformer

DB_CONFIG = {
    "dbname": "elective_course_recommendation_db",
    "user": "postgres",
    "password": "password",
    "host": "localhost",
    "port": "5432"
}

def generate_and_update_embeddings():
    # 2. โหลดโมเดล (ครั้งแรกจะใช้เวลาดาวน์โหลดโมเดลประมาณ 2-3 GB)
    print("⏳ กำลังโหลดโมเดล multilingual-e5-large...")
    model = SentenceTransformer('intfloat/multilingual-e5-large')
    print("✅ โหลดโมเดลสำเร็จ!")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # 3. ดึงรายวิชาที่ "มี Description" แต่ "ยังไม่มี Embedding" (จะได้รันซ้ำได้ไม่เสียเวลา)
        cursor.execute("""
                       SELECT id, description
                       FROM course_master
                       WHERE description IS NOT NULL
                         AND description != '' 
              AND embedding_vector IS NULL;
                       """)
        courses = cursor.fetchall()

        if not courses:
            print("🎉 ไม่มีวิชาที่ต้องทำ Embedding เพิ่ม ทุกวิชาอัปเดตหมดแล้ว!")
            return

        print(f"🔍 พบวิชาที่ต้องทำ Embedding จำนวน {len(courses)} วิชา...")

        # เตรียมข้อมูลสำหรับ Embedding
        course_ids = []
        texts_to_encode = []

        for course_id, description in courses:
            course_ids.append(course_id)
            # 🌟 กฎของ E5: ต้องเติม 'passage: ' นำหน้าข้อความที่เป็น Document เสมอ
            texts_to_encode.append(f"passage: {description}")

        # 4. แปลงข้อความเป็น Vector
        print("🧠 กำลังประมวลผลข้อความเป็น Vector (อาจใช้เวลาสักครู่)...")
        # ใช้ normalize_embeddings=True เพื่อให้รองรับการคำนวณ Cosine Similarity ได้ดีที่สุด
        embeddings = model.encode(texts_to_encode, normalize_embeddings=True, show_progress_bar=True)

        # 5. เตรียมข้อมูล Update กลับเข้า Database
        update_data = []
        for course_id, embedding in zip(course_ids, embeddings):
            # pgvector รับค่าเป็น list ของ float ได้เลย
            update_data.append((embedding.tolist(), course_id))

        # 6. อัปเดตข้อมูลกลับเข้า DB
        print("💾 กำลังบันทึก Vector ลงฐานข้อมูล...")
        update_query = """
                       UPDATE course_master
                       SET embedding_vector = %s::vector
                       WHERE id = %s; \
                       """

        execute_batch(cursor, update_query, update_data)
        conn.commit()

        print("✅ บันทึก Embedding ลงฐานข้อมูลสำเร็จทั้งหมด!")

    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


if __name__ == "__main__":
    generate_and_update_embeddings()