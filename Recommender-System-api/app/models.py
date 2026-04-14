import uuid

from sqlalchemy import Column, String, Float, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY, TEXT
from pgvector.sqlalchemy import Vector
from app.database import Base

class StudentGrade(Base):
    __tablename__ = "student_grades"

    student_id = Column(String, primary_key=True, index=True)
    course_code = Column(String, primary_key=True, index=True)
    rating = Column(Float)

class CourseMaster(Base):
    __tablename__ = "course_master"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(String(20), nullable=False, index=True)
    course_name_th = Column(String(200), nullable=False)
    course_name_en = Column(String(200), nullable=False)
    description = Column(TEXT, nullable=True)
    is_elective = Column(Boolean, default=False)
    topics = Column(ARRAY(TEXT), nullable=True)
    embedding_vector = Column(Vector(1024), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

