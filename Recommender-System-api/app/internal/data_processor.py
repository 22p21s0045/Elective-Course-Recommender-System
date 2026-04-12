import pandas as pd
from typing import List
from app.schemas import OCRSubject

def convert_grade_letter_to_number(grade_letter: str) -> float:
    mapping = {
        'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5,
        'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0
    }
    return mapping.get(grade_letter.strip().upper(), 0.0)

def preprocess_target_student(student_id: str, raw_grades: List[OCRSubject]) -> pd.DataFrame:
    data = []
    for item in raw_grades:
        data.append({
            "student_id": student_id,
            "course_code": item.course_code.strip().upper(),
            "rating": convert_grade_letter_to_number(item.grade_letter)
        })

    df = pd.DataFrame(data)
    df_cleaned = df[df['rating'] > 0.0].copy()
    df_filtered = df_cleaned[df_cleaned['course_code'].str.startswith('INT')].copy()
    return df_filtered
