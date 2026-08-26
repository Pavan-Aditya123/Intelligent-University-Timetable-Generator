"""
Fuzzy Decision-Making Engine (Phase 2.3)
Evaluates soft constraint suitability and timetable candidate quality using:
1. Membership functions (Triangular & Trapezoidal)
2. 5 Fuzzy input variables (Day Distribution, Faculty Balance, Student Gaps, Consecutive Classes, Faculty Preference)
3. 15 Explicit Fuzzy IF-THEN rules
4. Mamdani Min-Max Inference
5. Centroid Defuzzification (0–100 Fuzzy Suitability Score)
"""

import json
from typing import List, Dict, Any, Tuple, Set

# --- Membership Function Helpers ---

def triangular_mf(x: float, a: float, b: float, c: float) -> float:
    """Calculates triangular membership degree for input value x."""
    if x < a or x > c:
        return 0.0
    if a <= x <= b:
        return (x - a) / (b - a) if b > a else 1.0
    if b < x <= c:
        return (c - x) / (c - b) if c > b else 1.0
    return 0.0

def trapezoidal_mf(x: float, a: float, b: float, c: float, d: float) -> float:
    """Calculates trapezoidal membership degree for input value x."""
    if x < a or x > d:
        return 0.0
    if a <= x < b:
        return (x - a) / (b - a) if b > a else 1.0
    if b <= x <= c:
        return 1.0
    if c < x <= d:
        return (d - x) / (d - c) if d > c else 1.0
    return 0.0


class FuzzyDecisionEngine:
    def __init__(self, config: Any, sections: List[Any], faculty_list: List[Any], subjects: List[Any], rooms: List[Any]):
        self.config = config
        self.sections = sections
        self.faculty_list = faculty_list
        self.subjects = subjects
        self.rooms = rooms

        self.working_days = json.loads(config.working_days) if config and config.working_days else ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        self.periods_per_day = config.periods_per_day if config else 7

        self.section_map = {s.id: s for s in sections}
        self.faculty_map = {f.id: f for f in faculty_list}
        self.subject_map = {sub.id: sub for sub in subjects}
        self.room_map = {r.id: r for r in rooms}

    def check_hard_conflicts(self, entries: List[Dict[str, Any]]) -> int:
        """Checks if a timetable candidate has any hard constraint overlaps."""
        section_busy: Set[Tuple[int, str, int]] = set()
        faculty_busy: Set[Tuple[int, str, int]] = set()
        room_busy: Set[Tuple[int, str, int]] = set()
        conflicts = 0

        for e in entries:
            sec_id = e["section_id"]
            fac_id = e["faculty_id"]
            room_id = e["room_id"]
            day = e["day_of_week"]
            p = e["period_number"]

            if (sec_id, day, p) in section_busy:
                conflicts += 1
            else:
                section_busy.add((sec_id, day, p))

            if (fac_id, day, p) in faculty_busy:
                conflicts += 1
            else:
                faculty_busy.add((fac_id, day, p))

            if (room_id, day, p) in room_busy:
                conflicts += 1
            else:
                room_busy.add((room_id, day, p))

        return conflicts

    def compute_input_metrics(self, entries: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculates normalized input metrics from assigned timetable entries."""
        if not entries:
            return {
                "day_distribution": 0.0,
                "faculty_balance": 0.0,
                "student_gaps": 5.0,
                "consecutive_classes": 5.0,
                "faculty_preference": 0.0
            }

        # 1. Day Distribution Metric (0 to 100)
        sec_day_counts: Dict[Tuple[int, str], int] = {}
        for e in entries:
            key = (e["section_id"], e["day_of_week"])
            sec_day_counts[key] = sec_day_counts.get(key, 0) + 1

        total_sec_variance = 0.0
        for sec in self.sections:
            counts = [sec_day_counts.get((sec.id, day), 0) for day in self.working_days]
            total_c = sum(counts)
            if total_c > 0:
                mean = total_c / len(self.working_days)
                var = sum((c - mean) ** 2 for c in counts) / len(self.working_days)
                total_sec_variance += var

        num_sec = max(1, len(self.sections))
        avg_sec_var = total_sec_variance / num_sec
        day_dist_metric = max(0.0, min(100.0, 100.0 - (avg_sec_var * 10.0)))

        # 2. Faculty Workload Balance Metric (0 to 100)
        fac_day_counts: Dict[Tuple[int, str], int] = {}
        for e in entries:
            key = (e["faculty_id"], e["day_of_week"])
            fac_day_counts[key] = fac_day_counts.get(key, 0) + 1

        total_fac_variance = 0.0
        for fac in self.faculty_list:
            counts = [fac_day_counts.get((fac.id, day), 0) for day in self.working_days]
            total_h = sum(counts)
            if total_h > 0:
                mean = total_h / len(self.working_days)
                var = sum((c - mean) ** 2 for c in counts) / len(self.working_days)
                total_fac_variance += var

        num_fac = max(1, len(self.faculty_list))
        avg_fac_var = total_fac_variance / num_fac
        fac_balance_metric = max(0.0, min(100.0, 100.0 - (avg_fac_var * 12.0)))

        # 3. Student Gaps Metric (Average gaps per section-day)
        sec_day_periods: Dict[Tuple[int, str], List[int]] = {}
        for e in entries:
            key = (e["section_id"], e["day_of_week"])
            if key not in sec_day_periods:
                sec_day_periods[key] = []
            sec_day_periods[key].append(e["period_number"])

        total_gaps = 0
        for key, p_list in sec_day_periods.items():
            if len(p_list) >= 2:
                p_set = set(p_list)
                min_p, max_p = min(p_set), max(p_set)
                full_span = max_p - min_p + 1
                gaps = full_span - len(p_set)
                total_gaps += max(0, gaps)

        num_section_days = max(1, len(self.sections) * len(self.working_days))
        avg_gaps_per_section_day = round(total_gaps / num_section_days, 2)

        # 4. Consecutive Classes Metric (Average 3+ consecutive runs per section-day)
        consecutive_runs = 0
        for key, p_list in sec_day_periods.items():
            sorted_p = sorted(list(set(p_list)))
            current_run = 1
            for idx in range(1, len(sorted_p)):
                if sorted_p[idx] == sorted_p[idx - 1] + 1:
                    current_run += 1
                    if current_run >= 3:
                        consecutive_runs += 1
                else:
                    current_run = 1

        avg_consecutive_per_section_day = round(consecutive_runs / num_section_days, 2)

        # 5. Faculty Preference Match Metric (0% to 100%)
        matches = 0
        for e in entries:
            fac = self.faculty_map.get(e["faculty_id"])
            if not fac or fac.preferred_time_slot == "No Preference":
                matches += 1
            elif fac.preferred_time_slot == "Morning" and e["period_number"] <= 4:
                matches += 1
            elif fac.preferred_time_slot == "Afternoon" and e["period_number"] >= 5:
                matches += 1

        fac_pref_metric = round((matches / max(1, len(entries))) * 100.0, 1)

        return {
            "day_distribution": round(day_dist_metric, 1),
            "faculty_balance": round(fac_balance_metric, 1),
            "student_gaps": avg_gaps_per_section_day,
            "consecutive_classes": avg_consecutive_per_section_day,
            "faculty_preference": fac_pref_metric
        }

    def evaluate_fuzzification(self, metrics: Dict[str, float]) -> Dict[str, Dict[str, float]]:
        """Maps crisp numerical input metrics to linguistic term membership degrees."""
        dd = metrics["day_distribution"]
        fb = metrics["faculty_balance"]
        sg = metrics["student_gaps"]
        cc = metrics["consecutive_classes"]
        fp = metrics["faculty_preference"]

        memberships = {
            "day_distribution": {
                "Poor": trapezoidal_mf(dd, 0, 0, 20, 45),
                "Moderate": triangular_mf(dd, 30, 55, 80),
                "Good": trapezoidal_mf(dd, 65, 85, 100, 100)
            },
            "faculty_balance": {
                "Low": trapezoidal_mf(fb, 0, 0, 20, 45),
                "Medium": triangular_mf(fb, 30, 55, 80),
                "High": trapezoidal_mf(fb, 65, 85, 100, 100)
            },
            "student_gaps": {
                "Low": trapezoidal_mf(sg, 0, 0, 1.0, 2.5),
                "Medium": triangular_mf(sg, 1.5, 3.0, 5.0),
                "High": trapezoidal_mf(sg, 4.0, 6.0, 20.0, 20.0)
            },
            "consecutive_classes": {
                "Low": trapezoidal_mf(cc, 0, 0, 0.2, 0.8),
                "Medium": triangular_mf(cc, 0.5, 1.2, 2.0),
                "High": trapezoidal_mf(cc, 1.5, 2.5, 10.0, 10.0)
            },
            "faculty_preference": {
                "Poor": trapezoidal_mf(fp, 0, 0, 25, 50),
                "Partial": triangular_mf(fp, 35, 60, 80),
                "Good": trapezoidal_mf(fp, 70, 85, 100, 100)
            }
        }
        return memberships

    def evaluate_rules(self, mf: Dict[str, Dict[str, float]]) -> Tuple[List[Dict[str, Any]], Dict[str, float]]:
        """
        Evaluates 15 explicit Fuzzy IF-THEN rules using Mamdani Min implication.
        Returns list of fired rules and aggregated output fuzzy set strengths.
        """
        rules_def = [
            # Excellent Rules
            {"id": 1, "cond": [("day_distribution", "Good"), ("faculty_balance", "High"), ("student_gaps", "Low"), ("consecutive_classes", "Low"), ("faculty_preference", "Good")], "conseq": "Excellent"},
            {"id": 2, "cond": [("day_distribution", "Good"), ("student_gaps", "Low"), ("faculty_preference", "Good")], "conseq": "Excellent"},
            {"id": 3, "cond": [("day_distribution", "Good"), ("faculty_balance", "High"), ("student_gaps", "Low")], "conseq": "Excellent"},

            # Good Rules
            {"id": 4, "cond": [("day_distribution", "Moderate"), ("faculty_balance", "Medium"), ("student_gaps", "Low")], "conseq": "Good"},
            {"id": 5, "cond": [("day_distribution", "Good"), ("student_gaps", "Medium"), ("consecutive_classes", "Low")], "conseq": "Good"},
            {"id": 6, "cond": [("faculty_balance", "High"), ("faculty_preference", "Good"), ("student_gaps", "Low")], "conseq": "Good"},
            {"id": 7, "cond": [("day_distribution", "Moderate"), ("faculty_balance", "Medium"), ("consecutive_classes", "Low")], "conseq": "Good"},

            # Acceptable Rules
            {"id": 8, "cond": [("day_distribution", "Moderate"), ("student_gaps", "High")], "conseq": "Acceptable"},
            {"id": 9, "cond": [("day_distribution", "Poor"), ("student_gaps", "Low")], "conseq": "Acceptable"},
            {"id": 10, "cond": [("faculty_balance", "Low"), ("student_gaps", "Medium")], "conseq": "Acceptable"},
            {"id": 11, "cond": [("day_distribution", "Moderate"), ("faculty_balance", "Low")], "conseq": "Acceptable"},

            # Poor Rules
            {"id": 12, "cond": [("day_distribution", "Poor"), ("student_gaps", "High")], "conseq": "Poor"},
            {"id": 13, "cond": [("faculty_balance", "Low"), ("consecutive_classes", "High")], "conseq": "Poor"},
            {"id": 14, "cond": [("student_gaps", "High"), ("consecutive_classes", "High")], "conseq": "Poor"},
            {"id": 15, "cond": [("day_distribution", "Poor"), ("faculty_balance", "Low"), ("faculty_preference", "Poor")], "conseq": "Poor"}
        ]

        output_strengths = {"Poor": 0.0, "Acceptable": 0.0, "Good": 0.0, "Excellent": 0.0}
        fired_rules = []

        for r in rules_def:
            weight = min(mf[var][term] for var, term in r["cond"])
            if weight > 0.0:
                conseq = r["conseq"]
                output_strengths[conseq] = max(output_strengths[conseq], weight)
                cond_str = " AND ".join(f"{var}={term}" for var, term in r["cond"])
                fired_rules.append({
                    "rule_id": r["id"],
                    "statement": f"IF {cond_str} THEN Suitability is {conseq}",
                    "weight": round(weight, 3)
                })

        return fired_rules, output_strengths

    def defuzzify_centroid(self, output_strengths: Dict[str, float]) -> Tuple[float, str]:
        """
        Performs Centroid (Center of Gravity) Defuzzification over output universe [0, 100].
        Maps output fuzzy sets (Poor=20, Acceptable=45, Good=70, Excellent=90) to crisp score.
        """
        centers = {
            "Poor": 20.0,
            "Acceptable": 45.0,
            "Good": 70.0,
            "Excellent": 90.0
        }

        numerator = 0.0
        denominator = 0.0

        for x in range(0, 101, 1):
            mu_poor = min(output_strengths["Poor"], trapezoidal_mf(x, 0, 0, 20, 40))
            mu_acc = min(output_strengths["Acceptable"], triangular_mf(x, 30, 45, 60))
            mu_good = min(output_strengths["Good"], triangular_mf(x, 55, 70, 85))
            mu_exc = min(output_strengths["Excellent"], trapezoidal_mf(x, 75, 90, 100, 100))

            mu_x = max(mu_poor, mu_acc, mu_good, mu_exc)
            numerator += x * mu_x
            denominator += mu_x

        if denominator == 0.0:
            w_sum = sum(output_strengths[cat] * centers[cat] for cat in centers)
            w_den = sum(output_strengths.values())
            score = w_sum / w_den if w_den > 0 else 50.0
        else:
            score = numerator / denominator

        score = round(max(0.0, min(100.0, score)), 1)

        if score >= 80.0:
            decision = "Excellent"
        elif score >= 60.0:
            decision = "Good"
        elif score >= 40.0:
            decision = "Acceptable"
        else:
            decision = "Poor"

        return score, decision

    def evaluate_timetable(self, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Executes full fuzzy evaluation pipeline on a timetable solution.
        Returns fuzzy score, linguistic decision, membership degrees, fired rules, and breakdown.
        """
        metrics = self.compute_input_metrics(entries)

        # Enforce Hard Constraints Independence
        conflicts = self.check_hard_conflicts(entries)
        if conflicts > 0:
            return {
                "fuzzy_score": max(0.0, round(25.0 - (conflicts * 10.0), 1)),
                "decision": "Poor",
                "inputs": metrics,
                "membership_values": {},
                "rules_fired": [{"rule_id": 0, "statement": f"HARD CONFLICT PENALTY: {conflicts} hard violations detected", "weight": 1.0}],
                "output_strengths": {"Poor": 1.0, "Acceptable": 0.0, "Good": 0.0, "Excellent": 0.0},
                "breakdown": {
                    "day_distribution_label": "Poor (Conflict)",
                    "faculty_balance_label": "Poor (Conflict)",
                    "student_gaps_label": "High",
                    "consecutive_load_label": "High",
                    "faculty_preference_label": "Poor"
                }
            }

        mf = self.evaluate_fuzzification(metrics)
        fired_rules, output_strengths = self.evaluate_rules(mf)
        score, decision = self.defuzzify_centroid(output_strengths)

        return {
            "fuzzy_score": score,
            "decision": decision,
            "inputs": metrics,
            "membership_values": mf,
            "rules_fired": fired_rules,
            "output_strengths": {k: round(v, 3) for k, v in output_strengths.items()},
            "breakdown": {
                "day_distribution_label": "Good" if metrics["day_distribution"] >= 70 else ("Moderate" if metrics["day_distribution"] >= 40 else "Poor"),
                "faculty_balance_label": "High" if metrics["faculty_balance"] >= 70 else ("Medium" if metrics["faculty_balance"] >= 40 else "Low"),
                "student_gaps_label": "Low" if metrics["student_gaps"] <= 2.5 else ("Medium" if metrics["student_gaps"] <= 5.0 else "High"),
                "consecutive_load_label": "Low" if metrics["consecutive_classes"] <= 0.8 else ("Medium" if metrics["consecutive_classes"] <= 2.0 else "High"),
                "faculty_preference_label": "Good" if metrics["faculty_preference"] >= 70 else ("Partial" if metrics["faculty_preference"] >= 40 else "Poor")
            }
        }
