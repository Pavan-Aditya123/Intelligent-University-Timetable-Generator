from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/api/rooms", tags=["Classrooms & Laboratories"])

@router.get("", response_model=List[schemas.RoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    rms = crud.get_rooms(db)
    return [
        schemas.RoomResponse(
            id=r.id,
            room_number=r.room_number,
            name=r.name,
            room_type=r.room_type,
            capacity=r.capacity,
            is_lab=r.is_lab
        ) for r in rms
    ]

@router.post("", response_model=schemas.RoomResponse)
def create_room(room_in: schemas.RoomCreate, db: Session = Depends(get_db)):
    try:
        r = crud.create_room(db, room_in)
        return schemas.RoomResponse(
            id=r.id,
            room_number=r.room_number,
            name=r.name,
            room_type=r.room_type,
            capacity=r.capacity,
            is_lab=r.is_lab
        )
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create room: {str(e)}")

@router.put("/{room_id}", response_model=schemas.RoomResponse)
def update_room(room_id: int, room_in: schemas.RoomBase, db: Session = Depends(get_db)):
    try:
        r = crud.update_room(db, room_id, room_in)
        if not r:
            raise HTTPException(status_code=404, detail="Room not found.")
        return schemas.RoomResponse(
            id=r.id,
            room_number=r.room_number,
            name=r.name,
            room_type=r.room_type,
            capacity=r.capacity,
            is_lab=r.is_lab
        )
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update room: {str(e)}")

@router.delete("/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    success = crud.delete_room(db, room_id)
    if not success:
        raise HTTPException(status_code=404, detail="Room not found.")
    return {"message": "Room deleted successfully."}
