"""
Genetic Algorithm Timetable Optimization Engine (Phase 2.2)
Optimizes CSP-generated feasible timetables according to soft constraints and multi-objective fitness criteria:
1. Day distribution / workload spreading (35%)
2. Faculty workload balance (20%)
3. Avoid unnecessary student gaps (20%)
4. Avoid excessive consecutive classes (15%)
5. Faculty preferred teaching time (10%)

Preserves all 15 Hard Constraints strictly via gene-level block representation and repair procedures.
"""

import copy
import json
import random
from typing import List, Dict, Any, Tuple, Optional, Set

class GeneticSchedulerEngine:
    def __init__(
        self,
        config: Any,
        departments: List[Any],
        sections: List[Any],
        faculty_list: List[Any],
        subjects: List[Any],
        rooms: List[Any],
        population_size: int = 50,
        generations: int = 100,
        crossover_rate: float = 0.80,
        mutation_rate: float = 0.10,
        elitism_count: int = 2,
        tournament_size: int = 3
    ):
        self.config = config
        self.departments = departments
        self.sections = sections
        self.faculty_list = faculty_list
        self.subjects = subjects
        self.rooms = rooms

        # GA Parameters
        self.population_size = population_size
        self.generations = generations
        self.crossover_rate = crossover_rate
        self.mutation_rate = mutation_rate
        self.elitism_count = elitism_count
        self.tournament_size = tournament_size

        # Schedule parameters
        self.working_days = json.loads(config.working_days) if config and config.working_days else ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        self.periods_per_day = config.periods_per_day if config else 7
        self.morning_break_after = config.morning_break_after_period if config else 2
        self.lunch_break_after = config.lunch_break_after_period if config else 4

        # Fast lookup maps
        self.section_map = {s.id: s for s in sections}
        self.faculty_map = {f.id: f for f in faculty_list}
        self.subject_map = {sub.id: sub for sub in subjects}
        self.room_map = {r.id: r for r in rooms}

    def csp_to_genes(self, csp_entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Converts flat CSP TimetableEntry dictionaries into logical Gene scheduling units.
        Contiguous 2-period lab entries are grouped into single genes (duration_in_periods=2).
        Maintains deterministic, sorted gene order.
        """
        grouped: Dict[Tuple[int, int, str], List[Dict[str, Any]]] = {}
        for entry in csp_entries:
            key = (entry["subject_id"], entry["section_id"], entry["day_of_week"])
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(entry)

        genes = []
        gene_id_counter = 0

        # Sort keys to ensure consistent gene ordering across all chromosomes
        sorted_keys = sorted(grouped.keys(), key=lambda k: (k[0], k[1], k[2]))

        for key in sorted_keys:
            entry_list = grouped[key]
            sub_id, sec_id, day = key
            sub = self.subject_map.get(sub_id)
            sec = self.section_map.get(sec_id)
            if not sub or not sec:
                continue

            requires_lab = sub.requires_lab or (sub.course_type == "Lab")
            assigned_fac_ids = [a.faculty_id for a in sub.faculty_assignments]
            if not assigned_fac_ids:
                assigned_fac_ids = [entry_list[0]["faculty_id"]]

            compatible_rooms = []
            for r in self.rooms:
                if r.capacity < sec.student_count:
                    continue
                if requires_lab:
                    if r.is_lab or r.room_type == "Laboratory":
                        compatible_rooms.append(r.id)
                else:
                    if not r.is_lab and r.room_type == "Classroom":
                        compatible_rooms.append(r.id)
            if not compatible_rooms:
                compatible_rooms = [r.id for r in self.rooms if r.capacity >= sec.student_count]

            entry_list.sort(key=lambda x: x["period_number"])

            i = 0
            while i < len(entry_list):
                current = entry_list[i]
                if (
                    sub.duration_in_periods == 2 and
                    i + 1 < len(entry_list) and
                    entry_list[i + 1]["period_number"] == current["period_number"] + 1 and
                    current["period_number"] in (1, 3, 5)
                ):
                    genes.append({
                        "gene_id": f"gene_{gene_id_counter}",
                        "subject_id": sub_id,
                        "section_id": sec_id,
                        "faculty_id": current["faculty_id"],
                        "room_id": current["room_id"],
                        "day_of_week": day,
                        "start_period": current["period_number"],
                        "duration_in_periods": 2,
                        "requires_lab": requires_lab,
                        "course_type": sub.course_type,
                        "compatible_room_ids": compatible_rooms,
                        "assigned_faculty_ids": assigned_fac_ids,
                        "student_count": sec.student_count
                    })
                    gene_id_counter += 1
                    i += 2
                else:
                    genes.append({
                        "gene_id": f"gene_{gene_id_counter}",
                        "subject_id": sub_id,
                        "section_id": sec_id,
                        "faculty_id": current["faculty_id"],
                        "room_id": current["room_id"],
                        "day_of_week": day,
                        "start_period": current["period_number"],
                        "duration_in_periods": 1,
                        "requires_lab": requires_lab,
                        "course_type": sub.course_type,
                        "compatible_room_ids": compatible_rooms,
                        "assigned_faculty_ids": assigned_fac_ids,
                        "student_count": sec.student_count
                    })
                    gene_id_counter += 1
                    i += 1

        return genes

    def genes_to_entries(self, genes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Converts logical Gene objects back to flat period entries for DB storage and UI view."""
        entries = []
        for gene in genes:
            duration = gene["duration_in_periods"]
            for p_offset in range(duration):
                entries.append({
                    "section_id": gene["section_id"],
                    "subject_id": gene["subject_id"],
                    "faculty_id": gene["faculty_id"],
                    "room_id": gene["room_id"],
                    "day_of_week": gene["day_of_week"],
                    "period_number": gene["start_period"] + p_offset,
                    "is_locked": False
                })
        return entries

    def get_valid_slots_for_gene(self, gene: Dict[str, Any]) -> List[Tuple[str, int]]:
        """Returns valid (day, start_period) options preserving break boundaries."""
        duration = gene["duration_in_periods"]
        slots = []
        for day in self.working_days:
            if duration == 1:
                for p in range(1, self.periods_per_day + 1):
                    slots.append((day, p))
            elif duration == 2:
                if self.periods_per_day >= 2: slots.append((day, 1))
                if self.periods_per_day >= 4: slots.append((day, 3))
                if self.periods_per_day >= 6: slots.append((day, 5))
        return slots

    def check_hard_conflicts(self, genes: List[Dict[str, Any]]) -> Tuple[int, List[str]]:
        """Validates hard constraints for a chromosome."""
        conflicts = 0
        violations = []

        section_busy: Set[Tuple[int, str, int]] = set()
        faculty_busy: Set[Tuple[int, str, int]] = set()
        room_busy: Set[Tuple[int, str, int]] = set()
        faculty_hours: Dict[int, int] = {f.id: 0 for f in self.faculty_list}

        for gene in genes:
            duration = gene["duration_in_periods"]
            sec_id = gene["section_id"]
            fac_id = gene["faculty_id"]
            room_id = gene["room_id"]
            day = gene["day_of_week"]
            start_p = gene["start_period"]

            periods = [start_p + i for i in range(duration)]

            rm = self.room_map.get(room_id)
            sec = self.section_map.get(sec_id)
            if not rm or (sec and rm.capacity < sec.student_count):
                conflicts += 1
                violations.append(f"Room capacity conflict: Room {room_id}")

            if gene["requires_lab"] and rm and not (rm.is_lab or rm.room_type == "Laboratory"):
                conflicts += 1
                violations.append(f"Lab requirement conflict for Gene {gene['gene_id']}")

            for p in periods:
                if (sec_id, day, p) in section_busy:
                    conflicts += 1
                    violations.append(f"Section overlap ({sec_id}, {day}, {p})")
                else:
                    section_busy.add((sec_id, day, p))

                if (fac_id, day, p) in faculty_busy:
                    conflicts += 1
                    violations.append(f"Faculty overlap ({fac_id}, {day}, {p})")
                else:
                    faculty_busy.add((fac_id, day, p))

                if (room_id, day, p) in room_busy:
                    conflicts += 1
                    violations.append(f"Room overlap ({room_id}, {day}, {p})")
                else:
                    room_busy.add((room_id, day, p))

            faculty_hours[fac_id] = faculty_hours.get(fac_id, 0) + duration
            fac_obj = self.faculty_map.get(fac_id)
            if fac_obj and faculty_hours[fac_id] > fac_obj.max_weekly_hours:
                conflicts += 1
                violations.append(f"Faculty workload exceeded for {fac_obj.name}")

        return conflicts, violations

    def repair_chromosome(self, genes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Repairs hard constraint conflicts while maintaining FIXED gene array order.
        """
        repaired = copy.deepcopy(genes)
        indices = list(range(len(repaired)))
        random.shuffle(indices)  # Shuffle evaluation order, NOT array order

        section_busy: Set[Tuple[int, str, int]] = set()
        faculty_busy: Set[Tuple[int, str, int]] = set()
        room_busy: Set[Tuple[int, str, int]] = set()
        faculty_hours: Dict[int, int] = {f.id: 0 for f in self.faculty_list}

        for idx in indices:
            gene = repaired[idx]
            duration = gene["duration_in_periods"]
            sec_id = gene["section_id"]
            fac_id = gene["faculty_id"]
            room_id = gene["room_id"]
            day = gene["day_of_week"]
            start_p = gene["start_period"]

            periods = [start_p + i for i in range(duration)]
            has_conflict = False

            for p in periods:
                if (sec_id, day, p) in section_busy or (fac_id, day, p) in faculty_busy or (room_id, day, p) in room_busy:
                    has_conflict = True
                    break

            fac_obj = self.faculty_map.get(fac_id)
            if fac_obj and (faculty_hours.get(fac_id, 0) + duration > fac_obj.max_weekly_hours):
                has_conflict = True

            if not has_conflict:
                for p in periods:
                    section_busy.add((sec_id, day, p))
                    faculty_busy.add((fac_id, day, p))
                    room_busy.add((room_id, day, p))
                faculty_hours[fac_id] = faculty_hours.get(fac_id, 0) + duration
            else:
                valid_slots = self.get_valid_slots_for_gene(gene)
                random.shuffle(valid_slots)
                found = False

                for alt_day, alt_start_p in valid_slots:
                    alt_periods = [alt_start_p + i for i in range(duration)]

                    if any((sec_id, alt_day, p) in section_busy for p in alt_periods):
                        continue

                    for alt_fac_id in gene["assigned_faculty_ids"]:
                        alt_fac_obj = self.faculty_map.get(alt_fac_id)
                        if not alt_fac_obj or (faculty_hours.get(alt_fac_id, 0) + duration > alt_fac_obj.max_weekly_hours):
                            continue
                        if any((alt_fac_id, alt_day, p) in faculty_busy for p in alt_periods):
                            continue

                        for alt_room_id in gene["compatible_room_ids"]:
                            if any((alt_room_id, alt_day, p) in room_busy for p in alt_periods):
                                continue

                            gene["day_of_week"] = alt_day
                            gene["start_period"] = alt_start_p
                            gene["faculty_id"] = alt_fac_id
                            gene["room_id"] = alt_room_id

                            for p in alt_periods:
                                section_busy.add((sec_id, alt_day, p))
                                faculty_busy.add((alt_fac_id, alt_day, p))
                                room_busy.add((alt_room_id, alt_day, p))
                            faculty_hours[alt_fac_id] = faculty_hours.get(alt_fac_id, 0) + duration
                            found = True
                            break
                        if found: break
                    if found: break

                if not found:
                    for p in periods:
                        section_busy.add((sec_id, day, p))
                        faculty_busy.add((fac_id, day, p))
                        room_busy.add((room_id, day, p))
                    faculty_hours[fac_id] = faculty_hours.get(fac_id, 0) + duration

        return repaired

    def evaluate_fitness(self, genes: List[Dict[str, Any]]) -> Tuple[float, Dict[str, float]]:
        """Calculates normalized weighted fitness (0.0 to 100.0) across 5 soft criteria."""
        conflicts, _ = self.check_hard_conflicts(genes)
        if conflicts > 0:
            return max(0.0, 50.0 - (conflicts * 10.0)), {
                "day_distribution": 0.0,
                "faculty_balance": 0.0,
                "student_gaps": 0.0,
                "consecutive_classes": 0.0,
                "faculty_preference": 0.0,
                "hard_penalties": float(conflicts * 10.0)
            }

        # 1. Day Distribution Score (35.0 pts)
        sec_day_counts: Dict[Tuple[int, str], int] = {}
        for gene in genes:
            sec_id = gene["section_id"]
            day = gene["day_of_week"]
            dur = gene["duration_in_periods"]
            sec_day_counts[(sec_id, day)] = sec_day_counts.get((sec_id, day), 0) + dur

        total_sec_variance = 0.0
        for sec in self.sections:
            counts = [sec_day_counts.get((sec.id, day), 0) for day in self.working_days]
            total_classes = sum(counts)
            if total_classes > 0:
                mean = total_classes / len(self.working_days)
                var = sum((c - mean) ** 2 for c in counts) / len(self.working_days)
                total_sec_variance += var

        num_sections = max(1, len(self.sections))
        avg_sec_variance = total_sec_variance / num_sections
        day_dist_score = max(0.0, 35.0 - (avg_sec_variance * 3.5))

        # 2. Faculty Workload Balance Score (20.0 pts)
        fac_day_counts: Dict[Tuple[int, str], int] = {}
        for gene in genes:
            fac_id = gene["faculty_id"]
            day = gene["day_of_week"]
            dur = gene["duration_in_periods"]
            fac_day_counts[(fac_id, day)] = fac_day_counts.get((fac_id, day), 0) + dur

        total_fac_variance = 0.0
        for fac in self.faculty_list:
            counts = [fac_day_counts.get((fac.id, day), 0) for day in self.working_days]
            total_h = sum(counts)
            if total_h > 0:
                mean = total_h / len(self.working_days)
                var = sum((c - mean) ** 2 for c in counts) / len(self.working_days)
                total_fac_variance += var

        num_fac = max(1, len(self.faculty_list))
        avg_fac_variance = total_fac_variance / num_fac
        fac_balance_score = max(0.0, 20.0 - (avg_fac_variance * 2.5))

        # 3. Student Gaps Score (20.0 pts)
        sec_day_periods: Dict[Tuple[int, str], Set[int]] = {}
        for gene in genes:
            sec_id = gene["section_id"]
            day = gene["day_of_week"]
            dur = gene["duration_in_periods"]
            start_p = gene["start_period"]
            if (sec_id, day) not in sec_day_periods:
                sec_day_periods[(sec_id, day)] = set()
            for p in range(start_p, start_p + dur):
                sec_day_periods[(sec_id, day)].add(p)

        total_gaps = 0
        for (sec_id, day), p_set in sec_day_periods.items():
            if len(p_set) >= 2:
                min_p = min(p_set)
                max_p = max(p_set)
                full_span = max_p - min_p + 1
                gaps = full_span - len(p_set)
                total_gaps += max(0, gaps)

        student_gaps_score = max(0.0, 20.0 - (total_gaps * 1.5))

        # 4. Consecutive Classes Score (15.0 pts)
        consecutive_violations = 0
        for (sec_id, day), p_set in sec_day_periods.items():
            sorted_p = sorted(list(p_set))
            current_run = 1
            for idx in range(1, len(sorted_p)):
                if sorted_p[idx] == sorted_p[idx - 1] + 1:
                    current_run += 1
                    if current_run >= 3:
                        consecutive_violations += 1
                else:
                    current_run = 1

        consecutive_score = max(0.0, 15.0 - (consecutive_violations * 3.0))

        # 5. Faculty Preferred Time Slot Score (10.0 pts)
        preferred_matches = 0
        total_assignments = len(genes)

        for gene in genes:
            fac = self.faculty_map.get(gene["faculty_id"])
            if not fac or fac.preferred_time_slot == "No Preference":
                preferred_matches += 1
            elif fac.preferred_time_slot == "Morning" and gene["start_period"] <= 4:
                preferred_matches += 1
            elif fac.preferred_time_slot == "Afternoon" and gene["start_period"] >= 5:
                preferred_matches += 1

        fac_pref_ratio = (preferred_matches / max(1, total_assignments))
        fac_pref_score = round(fac_pref_ratio * 10.0, 2)

        total_fitness = round(day_dist_score + fac_balance_score + student_gaps_score + consecutive_score + fac_pref_score, 2)

        breakdown = {
            "day_distribution": round(day_dist_score, 2),
            "faculty_balance": round(fac_balance_score, 2),
            "student_gaps": round(student_gaps_score, 2),
            "consecutive_classes": round(consecutive_score, 2),
            "faculty_preference": round(fac_pref_score, 2)
        }

        return total_fitness, breakdown

    def mutate_gene(self, gene: Dict[str, Any]) -> Dict[str, Any]:
        """Mutates a gene's placement to a random alternative valid slot and room."""
        mutated = copy.deepcopy(gene)
        valid_slots = self.get_valid_slots_for_gene(mutated)
        if valid_slots:
            alt_day, alt_start_p = random.choice(valid_slots)
            mutated["day_of_week"] = alt_day
            mutated["start_period"] = alt_start_p

        if mutated["compatible_room_ids"]:
            mutated["room_id"] = random.choice(mutated["compatible_room_ids"])

        if mutated["assigned_faculty_ids"]:
            mutated["faculty_id"] = random.choice(mutated["assigned_faculty_ids"])

        return mutated

    def crossover(self, parent_a: List[Dict[str, Any]], parent_b: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Performs uniform scheduling-unit level crossover between two parent chromosomes."""
        child = []
        for i in range(len(parent_a)):
            if random.random() < 0.5:
                child.append(copy.deepcopy(parent_a[i]))
            else:
                child.append(copy.deepcopy(parent_b[i]))
        return self.repair_chromosome(child)

    def tournament_selection(self, population: List[List[Dict[str, Any]]], fitnesses: List[float]) -> List[Dict[str, Any]]:
        """Selects the highest-fitness chromosome out of a random tournament sample."""
        selected_indices = random.sample(range(len(population)), self.tournament_size)
        best_idx = max(selected_indices, key=lambda i: fitnesses[i])
        return copy.deepcopy(population[best_idx])

    def optimize(self, csp_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main Genetic Algorithm optimization loop across 100 generations.
        """
        if csp_result.get("status") != "success" or not csp_result.get("generated_entries"):
            return {
                "status": "failed",
                "message": "Cannot run GA optimization: CSP baseline solution is missing.",
                "best_entries": [],
                "initial_fitness": 0.0,
                "optimized_fitness": 0.0,
                "improvement_percent": 0.0
            }

        initial_entries = csp_result["generated_entries"]
        initial_genes = self.csp_to_genes(initial_entries)
        initial_fitness, initial_breakdown = self.evaluate_fitness(initial_genes)

        # Build initial population
        population: List[List[Dict[str, Any]]] = [initial_genes]

        for _ in range(self.population_size - 1):
            mutated_pop = []
            for gene in initial_genes:
                if random.random() < 0.30:
                    mutated_pop.append(self.mutate_gene(gene))
                else:
                    mutated_pop.append(copy.deepcopy(gene))
            repaired_pop = self.repair_chromosome(mutated_pop)
            population.append(repaired_pop)

        best_chromosome = copy.deepcopy(initial_genes)
        best_fitness = initial_fitness

        for gen in range(self.generations):
            fitnesses = []
            for chrom in population:
                f, _ = self.evaluate_fitness(chrom)
                fitnesses.append(f)

            max_idx = max(range(len(fitnesses)), key=lambda i: fitnesses[i])
            if fitnesses[max_idx] > best_fitness:
                best_fitness = fitnesses[max_idx]
                best_chromosome = copy.deepcopy(population[max_idx])

            sorted_indices = sorted(range(len(fitnesses)), key=lambda i: fitnesses[i], reverse=True)
            next_population = [copy.deepcopy(population[i]) for i in sorted_indices[:self.elitism_count]]

            while len(next_population) < self.population_size:
                parent_a = self.tournament_selection(population, fitnesses)
                parent_b = self.tournament_selection(population, fitnesses)

                if random.random() < self.crossover_rate:
                    offspring = self.crossover(parent_a, parent_b)
                else:
                    offspring = copy.deepcopy(parent_a)

                if random.random() < self.mutation_rate:
                    mutated_offspring = []
                    for g in offspring:
                        if random.random() < 0.15:
                            mutated_offspring.append(self.mutate_gene(g))
                        else:
                            mutated_offspring.append(g)
                    offspring = self.repair_chromosome(mutated_offspring)

                next_population.append(offspring)

            population = next_population

        final_entries = self.genes_to_entries(best_chromosome)
        optimized_fitness, final_breakdown = self.evaluate_fitness(best_chromosome)

        improvement = max(0.0, round(((optimized_fitness - initial_fitness) / max(1.0, initial_fitness)) * 100.0, 1))

        return {
            "status": "success",
            "phase": "Phase 2.2 - CSP + Genetic Algorithm",
            "message": f"GA Optimization completed successfully across {self.generations} generations with {improvement}% fitness improvement.",
            "initial_fitness": round(initial_fitness, 1),
            "optimized_fitness": round(optimized_fitness, 1),
            "improvement_percent": improvement,
            "generations": self.generations,
            "best_entries": final_entries,
            "fitness_breakdown": final_breakdown,
            "diagnostics": []
        }
