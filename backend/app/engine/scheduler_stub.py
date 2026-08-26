"""
AI Timetable Generation Engine Interface
Integrates Phase 2.1 CSP & Backtracking solver engine while maintaining 
stub compatibility for future Phase 2.2 GA & Phase 3 Fuzzy modules.
"""

from typing import Dict, Any, List
from .csp_scheduler import CSPSchedulerEngine

class TimetableSchedulerEngineStub:
    def __init__(self):
        self.phase = "Phase 2.1 - CSP & Backtracking Engine"

    def generate_timetable_from_data(self, config: Any, departments: List[Any],
                                   sections: List[Any], faculty_list: List[Any],
                                   subjects: List[Any], rooms: List[Any]) -> Dict[str, Any]:
        """
        Executes the CSP / Backtracking scheduling solver on active university data models.
        """
        engine = CSPSchedulerEngine(config, departments, sections, faculty_list, subjects, rooms)
        return engine.solve()

    def generate_timetable(self, constraints: Dict[str, Any]) -> Dict[str, Any]:
        """
        Legacy stub method maintained for backward compatibility.
        """
        return {
            "status": "not_implemented",
            "message": "Use generate_timetable_from_data() or POST /api/scheduler/generate.",
            "generated_entries": [],
            "conflicts": []
        }
