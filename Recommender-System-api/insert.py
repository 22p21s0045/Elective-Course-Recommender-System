import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch

# 1. ตั้งค่าการเชื่อมต่อ Database ของคุณ
DB_CONFIG = {
    "dbname": "elective_course_recommendation_db",
    "user": "postgres",
    "password": "password",
    "host": "localhost",
    "port": "5432"
}


def clean_text(text):
    if pd.isna(text):
        return ""
    return str(text).strip()


def process_and_insert_data(csv_file_path):
    # 2. โหลดข้อมูลจาก CSV
    df = pd.read_csv(csv_file_path)

    insert_data = []
    for index, row in df.iterrows():
        course_id = row['Course_Code']

        course_name_th = clean_text(row['Course_Name_TH'])
        course_name_en = clean_text(row['Course_Name_EN'])

        desc_th = clean_text(row['Description_TH'])
        desc_en = clean_text(row['Description_EN'])

        description = ""
        if desc_th:
            description += f"[TH]\n{desc_th}\n\n"
        if desc_en:
            description += f"[EN]\n{desc_en}"

        description = description.strip()
        credits = clean_text(row['Credits'])
        is_elective = bool(row['IS_ELECTIVE'])

        # นำข้อมูลที่ผ่านเงื่อนไขใส่ใน List เตรียม Insert
        insert_data.append((
            course_id,
            course_name_th,
            course_name_en,
            description,
            credits,
            is_elective
        ))

    # 4. Insert เข้า PostgreSQL
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # คำสั่ง SQL Insert โดยข้ามฟิลด์ Unique_Course_Code และ topics(Course_Topic) ไปเลย
        insert_query = """
                       INSERT INTO course_master (course_id, \
                                                  course_name_th, \
                                                  course_name_en, \
                                                  description, \
                                                  credits, \
                                                  is_elective) \
                       VALUES (%s, %s, %s, %s, %s, %s); \
                       """

        # ทำ Batch Insert เพื่อความรวดเร็ว
        execute_batch(cursor, insert_query, insert_data)

        conn.commit()
        print(f"✅ Insert ข้อมูลสำเร็จจำนวน {len(insert_data)} รายวิชา!")

    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


# เรียกใช้งานฟังก์ชัน (สมมติว่าไฟล์อยู่ในโฟลเดอร์เดียวกัน)
process_and_insert_data('INT_Course-Original-Description_ONLY.csv')
