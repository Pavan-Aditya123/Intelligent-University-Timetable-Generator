from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import threading

from ..database import get_db
from ..engine.evaluation_engine import run_full_evaluation

router = APIRouter(prefix="/api/evaluation", tags=["Experimental Evaluation & Research Validation"])

# Global cache & lock for evaluation suite
_LATEST_EVALUATION_CACHE: Optional[Dict[str, Any]] = None
_EVALUATION_LOCK = threading.Lock()

@router.post("/run")
def run_evaluation_suite(db: Session = Depends(get_db)):
    """
    Executes full Phase 4 Experimental Evaluation Suite comparing:
    - Experiment A: CSP Baseline
    - Experiment B: CSP + Genetic Algorithm
    - Experiment C: CSP + GA + Fuzzy Decision Engine
    - 5 Stochastic GA Runs (Seeds: 42, 101, 202, 303, 404)

    Operates READ-ONLY on database. Does NOT alter active timetable entries.
    """
    global _LATEST_EVALUATION_CACHE
    with _EVALUATION_LOCK:
        try:
            print("[EVALUATION API] POST /api/evaluation/run initiated")
            results = run_full_evaluation(db)
            _LATEST_EVALUATION_CACHE = results
            return results
        except Exception as e:
            print(f"[EVALUATION API ERROR] {e}")
            raise HTTPException(status_code=500, detail=f"Experimental Evaluation error: {str(e)}")

@router.get("/results")
def get_evaluation_results(db: Session = Depends(get_db)):
    """
    Returns latest cached experimental evaluation results. Executes suite if cache is empty.
    """
    global _LATEST_EVALUATION_CACHE
    with _EVALUATION_LOCK:
        if _LATEST_EVALUATION_CACHE is None:
            print("[EVALUATION API] GET /api/evaluation/results - Cache empty, executing initial run")
            _LATEST_EVALUATION_CACHE = run_full_evaluation(db)
        return _LATEST_EVALUATION_CACHE

@router.get("/comparison")
def get_evaluation_comparison(db: Session = Depends(get_db)):
    """
    Returns structured side-by-side comparison table for Experiments A, B, C.
    """
    global _LATEST_EVALUATION_CACHE
    with _EVALUATION_LOCK:
        if _LATEST_EVALUATION_CACHE is None:
            print("[EVALUATION API] GET /api/evaluation/comparison - Cache empty, executing initial run")
            _LATEST_EVALUATION_CACHE = run_full_evaluation(db)

        return {
            "timestamp": _LATEST_EVALUATION_CACHE.get("timestamp"),
            "comparison_table": _LATEST_EVALUATION_CACHE.get("comparison_table", []),
            "research_conclusions": _LATEST_EVALUATION_CACHE.get("research_conclusions", [])
        }
