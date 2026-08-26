"""
Fuzzy Decision Making Engine Interface
Integrates Phase 2.3 Fuzzy Decision-Making Engine while maintaining 
stub compatibility for legacy imports.
"""

from typing import Dict, Any, List
from .fuzzy_decision import FuzzyDecisionEngine

class FuzzyEvaluationEngineStub:
    def __init__(self):
        self.is_initialized = True

    def evaluate_timetable_from_data(
        self, config: Any, sections: List[Any], faculty_list: List[Any],
        subjects: List[Any], rooms: List[Any], entries: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Executes the Phase 2.3 Fuzzy Decision Engine on timetable entries."""
        engine = FuzzyDecisionEngine(config, sections, faculty_list, subjects, rooms)
        return engine.evaluate_timetable(entries)

    def evaluate_timetable_fitness(self, timetable_solution: Dict[str, Any], preferences: Dict[str, str]) -> Dict[str, Any]:
        """Legacy stub interface maintained for backward compatibility."""
        return {
            "status": "deprecated",
            "message": "Use evaluate_timetable_from_data() or POST /api/scheduler/generate.",
            "overall_fitness_score": 0.0
        }
