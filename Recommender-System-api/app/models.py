from sqlalchemy import Column, String, Float
from app.database import Base

class StudentGrade(Base):
    __tablename__ = "student_grades"

    student_id = Column(String, primary_key=True, index=True)
    course_code = Column(String, primary_key=True, index=True)
    rating = Column(Float)