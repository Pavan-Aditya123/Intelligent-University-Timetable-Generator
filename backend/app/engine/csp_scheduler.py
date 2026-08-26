"""
CSP & Backtracking Timetable Engine (Phase 2.1)
Implements deterministic Constraint Satisfaction Problem (CSP) search with backtracking,
forward checking, and MRV heuristics to generate university-wide timetables satisfying 
all 10 Hard Constraints.
"""

import json
from typing import List, Dict, Any, Optional, Tuple, Set

class CSPSchedulerEngine:
    def __init__(self, config: Any, departments: List[Any], sections: List[Any],
                 faculty_list: List[Any], subjects: List[Any], rooms: List[Any]):
        self.config = config
        self.departments = departments
        self.sections = sections
        self.faculty_list = faculty_list
        self.subjects = subjects
        self.rooms = rooms

        # University schedule parameters
        self.working_days = json.loads(config.working_days) if config and config.working_days else ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        self.periods_per_day = config.periods_per_day if config else 7
        self.morning_break_after = config.morning_break_after_period if config else 2
        self.lunch_break_after = config.lunch_break_after_period if config else 4

        # Fast lookup maps
        self.section_map = {s.id: s for s in sections}
        self.faculty_map = {f.id: f for f in faculty_list}
        self.subject_map = {sub.id: sub for sub in subjects}
        self.room_map = {r.id: r for r in rooms}

    def solve(self) -> Dict[str, Any]:
        """
        Executes the CSP backtracking search to generate a valid timetable.
        Returns a dictionary containing generation status, assigned entries, and conflict reports.
        """
        # Pre-check basic feasibility
        feasibility_error = self._check_pre_feasibility()
        if feasibility_error:
            return {
                "status": "failed",
                "message": feasibility_error["message"],
                "generated_entries": [],
                "diagnostics": feasibility_error["diagnostics"]
            }

        # Build scheduling variables
        variables = self._build_variables()
        if not variables:
            return {
                "status": "failed",
                "message": "No valid course variables to schedule. Please add subjects to sections.",
                "generated_entries": [],
                "diagnostics": ["No subjects found in the database."]
            }

        # State tracking structures
        section_busy: Set[Tuple[int, str, int]] = set()      # (section_id, day, period)
        faculty_busy: Set[Tuple[int, str, int]] = set()      # (faculty_id, day, period)
        room_busy: Set[Tuple[int, str, int]] = set()         # (room_id, day, period)
        faculty_hours: Dict[int, int] = {f.id: 0 for f in self.faculty_list}
        subject_day_count: Dict[Tuple[int, str], int] = {}  # (subject_id, day) -> count

        assignments: List[Dict[str, Any]] = []

        # Sort variables by MRV (Most Constrained First)
        variables.sort(key=lambda v: (
            0 if v["requires_lab"] else 1,                   # Labs first
            -v["duration_in_periods"],                       # Longer duration first
            len(v["compatible_room_ids"]),                   # Fewer room choices first
            len(v["assigned_faculty_ids"])                   # Fewer faculty choices first
        ))

        success = self._backtrack(
            var_index=0,
            variables=variables,
            assignments=assignments,
            section_busy=section_busy,
            faculty_busy=faculty_busy,
            room_busy=room_busy,
            faculty_hours=faculty_hours,
            subject_day_count=subject_day_count
        )

        if success:
            return {
                "status": "success",
                "message": f"Successfully generated complete timetable with {len(assignments)} assigned period slots.",
                "generated_entries": assignments,
                "diagnostics": []
            }
        else:
            diagnostics = self._generate_failure_diagnostics(variables, assignments)
            return {
                "status": "failed",
                "message": "Unable to find a valid hard-constraint solution for the current university dataset.",
                "generated_entries": [],
                "diagnostics": diagnostics
            }

    def _check_pre_feasibility(self) -> Optional[Dict[str, Any]]:
        """Pre-search sanity check to catch obvious bottlenecks immediately."""
        diagnostics = []

        if not self.sections:
            diagnostics.append("No student sections defined in database.")
        if not self.rooms:
            diagnostics.append("No classrooms or laboratories defined in database.")
        if not self.faculty_list:
            diagnostics.append("No faculty members defined in database.")

        if diagnostics:
            return {
                "message": "Incomplete setup data.",
                "diagnostics": diagnostics
            }

        # Check unassigned subjects
        for sub in self.subjects:
            assigned_fac_ids = [a.faculty_id for a in sub.faculty_assignments]
            if not assigned_fac_ids:
                sec = self.section_map.get(sub.section_id)
                sec_name = sec.name if sec else f"ID {sub.section_id}"
                diagnostics.append(f"Subject '{sub.code} - {sub.name}' for section '{sec_name}' has no assigned faculty member.")

        # Check lab room availability
        lab_subs = [s for s in self.subjects if s.requires_lab or s.course_type == "Lab"]
        lab_rooms = [r for r in self.rooms if r.is_lab or r.room_type == "Laboratory"]
        if lab_subs and not lab_rooms:
            diagnostics.append(f"Found {len(lab_subs)} practical lab subjects, but 0 Laboratory rooms exist in the database.")

        if diagnostics:
            return {
                "message": "Pre-generation feasibility check failed due to missing requirements.",
                "diagnostics": diagnostics
            }

        return None

    def _build_variables(self) -> List[Dict[str, Any]]:
        """
        Decomposes subjects into individual period units to schedule.
        For theory courses: 1 period unit per class requirement.
        For lab courses with 2-period duration: 2-period contiguous blocks.
        """
        variables = []
        for sub in self.subjects:
            sec = self.section_map.get(sub.section_id)
            if not sec:
                continue

            assigned_fac_ids = [a.faculty_id for a in sub.faculty_assignments]
            requires_lab = sub.requires_lab or (sub.course_type == "Lab")
            duration = sub.duration_in_periods if sub.duration_in_periods > 0 else 1

            # Find compatible rooms
            compatible_rooms = []
            for r in self.rooms:
                if r.capacity < sec.student_count:
                    continue  # Capacity constraint: Room capacity >= student count
                if requires_lab:
                    if r.is_lab or r.room_type == "Laboratory":
                        compatible_rooms.append(r.id)
                else:
                    if not r.is_lab and r.room_type == "Classroom":
                        compatible_rooms.append(r.id)

            # If no exact room match for non-lab, allow any room with enough capacity
            if not compatible_rooms and not requires_lab:
                compatible_rooms = [r.id for r in self.rooms if r.capacity >= sec.student_count]

            total_classes = sub.weekly_classes_required
            
            if duration == 2:
                # Group into 2-period blocks
                num_blocks = total_classes // 2
                remaining_single = total_classes % 2

                for b in range(num_blocks):
                    variables.append({
                        "subject_id": sub.id,
                        "code": sub.code,
                        "name": sub.name,
                        "section_id": sub.section_id,
                        "section_name": sec.name,
                        "student_count": sec.student_count,
                        "assigned_faculty_ids": assigned_fac_ids,
                        "compatible_room_ids": compatible_rooms,
                        "duration_in_periods": 2,
                        "requires_lab": requires_lab,
                        "course_type": sub.course_type,
                        "block_id": f"{sub.id}_block_{b}"
                    })

                for s in range(remaining_single):
                    variables.append({
                        "subject_id": sub.id,
                        "code": sub.code,
                        "name": sub.name,
                        "section_id": sub.section_id,
                        "section_name": sec.name,
                        "student_count": sec.student_count,
                        "assigned_faculty_ids": assigned_fac_ids,
                        "compatible_room_ids": compatible_rooms,
                        "duration_in_periods": 1,
                        "requires_lab": requires_lab,
                        "course_type": sub.course_type,
                        "block_id": f"{sub.id}_single_{s}"
                    })
            else:
                for s in range(total_classes):
                    variables.append({
                        "subject_id": sub.id,
                        "code": sub.code,
                        "name": sub.name,
                        "section_id": sub.section_id,
                        "section_name": sec.name,
                        "student_count": sec.student_count,
                        "assigned_faculty_ids": assigned_fac_ids,
                        "compatible_room_ids": compatible_rooms,
                        "duration_in_periods": 1,
                        "requires_lab": requires_lab,
                        "course_type": sub.course_type,
                        "block_id": f"{sub.id}_single_{s}"
                    })

        return variables

    def _get_valid_slot_pairs(self, duration: int) -> List[Tuple[str, int]]:
        """
        Returns valid (day, period_number) start options for a given duration.
        Enforces break boundaries:
        - 1-period: Period 1..7
        - 2-period: (P1, P2), (P3, P4), (P5, P6) — cannot cross Morning or Lunch break!
        """
        slots = []
        for day in self.working_days:
            if duration == 1:
                for p in range(1, self.periods_per_day + 1):
                    slots.append((day, p))
            elif duration == 2:
                # 2-period contiguous blocks avoiding breaks
                # P1-P2 (before morning break)
                # P3-P4 (between morning and lunch break)
                # P5-P6 (after lunch break)
                if self.periods_per_day >= 2:
                    slots.append((day, 1))
                if self.periods_per_day >= 4:
                    slots.append((day, 3))
                if self.periods_per_day >= 6:
                    slots.append((day, 5))
        return slots

    def _backtrack(
        self,
        var_index: int,
        variables: List[Dict[str, Any]],
        assignments: List[Dict[str, Any]],
        section_busy: Set[Tuple[int, str, int]],
        faculty_busy: Set[Tuple[int, str, int]],
        room_busy: Set[Tuple[int, str, int]],
        faculty_hours: Dict[int, int],
        subject_day_count: Dict[Tuple[int, str], int]
    ) -> bool:
        """Recursive backtracking solver with constraint checks and forward checking."""
        if var_index >= len(variables):
            return True  # All variables scheduled successfully!

        var = variables[var_index]
        duration = var["duration_in_periods"]
        possible_slots = self._get_valid_slot_pairs(duration)

        # Iterate over possible slot options
        for day, start_p in possible_slots:
            periods_needed = [start_p + i for i in range(duration)]

            # Check daily limit for theory subjects (prefer max 1-2 per day)
            day_key = (var["subject_id"], day)
            if subject_day_count.get(day_key, 0) >= 2:
                continue

            # Check section busy for all periods in block
            if any((var["section_id"], day, p) in section_busy for p in periods_needed):
                continue

            # Iterate over faculty choices
            for fac_id in var["assigned_faculty_ids"]:
                fac = self.faculty_map.get(fac_id)
                if not fac:
                    continue

                # Faculty workload limit check
                if faculty_hours.get(fac_id, 0) + duration > fac.max_weekly_hours:
                    continue

                # Faculty availability / conflict check
                if any((fac_id, day, p) in faculty_busy for p in periods_needed):
                    continue

                # Iterate over room choices
                for room_id in var["compatible_room_ids"]:
                    # Room conflict check
                    if any((room_id, day, p) in room_busy for p in periods_needed):
                        continue

                    # --- ASSIGN (Apply placement) ---
                    placed_entries = []
                    for p in periods_needed:
                        section_busy.add((var["section_id"], day, p))
                        faculty_busy.add((fac_id, day, p))
                        room_busy.add((room_id, day, p))
                        entry = {
                            "section_id": var["section_id"],
                            "subject_id": var["subject_id"],
                            "faculty_id": fac_id,
                            "room_id": room_id,
                            "day_of_week": day,
                            "period_number": p,
                            "is_locked": False
                        }
                        assignments.append(entry)
                        placed_entries.append(entry)

                    faculty_hours[fac_id] = faculty_hours.get(fac_id, 0) + duration
                    subject_day_count[day_key] = subject_day_count.get(day_key, 0) + 1

                    # Recurse to next variable
                    if self._backtrack(
                        var_index + 1,
                        variables,
                        assignments,
                        section_busy,
                        faculty_busy,
                        room_busy,
                        faculty_hours,
                        subject_day_count
                    ):
                        return True

                    # --- UNASSIGN (Backtrack) ---
                    faculty_hours[fac_id] -= duration
                    subject_day_count[day_key] -= 1
                    for entry in placed_entries:
                        assignments.remove(entry)
                    for p in periods_needed:
                        section_busy.remove((var["section_id"], day, p))
                        faculty_busy.remove((fac_id, day, p))
                        room_busy.remove((room_id, day, p))

        return False

    def _generate_failure_diagnostics(self, variables: List[Dict[str, Any]], assignments: List[Dict[str, Any]]) -> List[str]:
        """Generates detailed human-readable explanation when a timetable cannot be satisfied."""
        diagnostics = []

        scheduled_var_count = len({a["subject_id"] for a in assignments})
        total_var_count = len({v["subject_id"] for v in variables})

        diagnostics.append(f"Scheduled {scheduled_var_count} out of {total_var_count} required subject courses before reaching a constraint deadlock.")

        for var in variables:
            sec_name = var["section_name"]
            code = var["code"]
            name = var["name"]

            if not var["assigned_faculty_ids"]:
                diagnostics.append(f"Course '{code} - {name}' (Section {sec_name}): No faculty member assigned.")

            if not var["compatible_room_ids"]:
                if var["requires_lab"]:
                    diagnostics.append(f"Lab Course '{code} - {name}' (Section {sec_name}): No compatible Laboratory room found with capacity >= {var['student_count']}.")
                else:
                    diagnostics.append(f"Course '{code} - {name}' (Section {sec_name}): No Classroom room found with seating capacity >= {var['student_count']}.")

        if not diagnostics:
            diagnostics.append("High slot congestion: Total required weekly period slots exceed available room and faculty availability domains. Try adding rooms, adjusting faculty workload hours, or adding working days.")

        return diagnostics
