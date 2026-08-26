# PROJECT COMPLETE EXPLANATION & VIVA MASTER STUDY DOCUMENT
## Intelligent University-Wide Timetable Generator Using Knowledge Representation and Fuzzy Decision Making

> **Document Purpose**: This comprehensive master study guide explains the entire project from absolute fundamentals to final production implementation. It is designed for study, project presentations, research paper documentation, technical interviews, and university viva examinations.

---

## SECTION 1 — PROJECT IN ONE SIMPLE EXPLANATION

### What Problem Are We Solving?
Universities face an enormous challenge every semester: assigning dozens of courses, section cohorts, faculty members, classrooms, and laboratory spaces into a weekly schedule (Monday to Friday, 7 periods per day) without causing conflicts.

### Why is University Timetable Generation Difficult?
Timetabling is not a simple scheduling task. It is a **combinatorial optimization problem**. As the number of sections, faculty, and rooms grows, the number of possible schedule combinations expands exponentially:
$$\text{Search Space Size} \approx (\text{Days} \times \text{Periods} \times \text{Rooms})^{|\text{Scheduling Units}|}$$
For a typical department, the search space contains over $10^{30}$ possible combinations. Human schedulers cannot search this space manually.

### What Happens in a Traditional/Manual Timetable Process?
In a manual process, department heads use spreadsheets or whiteboards. They attempt to place classes one by one. Eventually, they run into dead ends where a teacher or room is double-booked, forcing hours of manual erasing, swapping, and re-checking.

### Why Do Conflicts Occur?
Conflicts occur because resources are **shared and constrained**:
- A **faculty member** cannot be in two classrooms at the same time.
- A **section of students** cannot attend two subjects simultaneously.
- A **classroom** cannot hold two different classes at the same period.
- A **laboratory subject** requires a specialized lab room, not a standard theory room.
- A **large section** (e.g., 65 students) cannot fit into a small classroom (e.g., 30 seats).

### Why is This an Optimization Problem?
Beyond avoiding hard conflicts (making a timetable *feasible*), we must satisfy human preferences (making a timetable *comfortable*):
- Spreading classes evenly across Monday–Friday so students don't have 8 classes on Monday and 1 on Friday.
- Balancing faculty teaching load across the week.
- Minimizing internal idle gaps where students sit idle between classes.
- Preventing 3 or 4 consecutive hours of heavy theory lectures.
- Respecting faculty time preferences (e.g., morning vs afternoon teaching slots).

### What Does "Intelligent University-Wide Timetable Generator" Mean?
It means the system uses Artificial Intelligence algorithms to automatically generate a complete, university-wide timetable that guarantees **zero hard conflicts** while mathematically maximizing **soft constraint suitability**.

### What Does "Knowledge Representation" Mean in This Project?
Knowledge Representation (KR) is the field of AI dedicated to representing real-world information in a structured data format that computer algorithms can reason over. In this project:
- University rules, curricula, section sizes, room capacities, faculty availability, lab requirements, and period definitions are represented in a normalized relational database schema (SQLAlchemy + SQLite).
- Algorithm state structures (variables, domains, chromosomes, gene representations, fuzzy membership sets) transform this database knowledge into AI computable data.

### What Does "Fuzzy Decision Making" Mean?
Human concepts like a *"good timetable"*, *"balanced workload"*, or *"minimal gaps"* are not binary (True/False). A day with 3 classes is not strictly "100% Good" or "0% Good". 

**Fuzzy Logic** allows us to represent partial truth using degrees of membership between $0.0$ and $1.0$. The Fuzzy Decision Engine uses Mamdani IF-THEN rules (e.g., *IF Day Distribution is Good AND Student Gaps is Low THEN Suitability is Excellent*) to evaluate the overall linguistic quality of a timetable and defuzzifies it into a scalar score ($0 \dots 100$).

### Real-World Simple Example
> Suppose our university has **7 Sections** (CSE-A, CSE-B, CSE-C, ECE-A, ECE-B, EEE-A, EEE-B), **9 Faculty Members**, **35 Subjects**, and **10 Rooms/Labs**. 
> We must place **98 weekly class periods** into 35 available time slots (5 days $\times$ 7 periods/day).
> - **CSP / Backtracking** acts as the strict law enforcer: It ensures no teacher, section, or room is double-booked and all 98 classes are assigned.
> - **Genetic Algorithm** acts as the optimizer: It rearranges the schedule across 100 generations to spread classes evenly across Monday–Friday.
> - **Fuzzy Decision Engine** acts as the expert judge: It evaluates the overall schedule using human-like linguistic rules and produces an overall suitability grade (e.g., **78.7 / 100 — "Good"**).

---

## SECTION 2 — PROBLEM STATEMENT

### Formal Problem Definition
Given a set of university resources, scheduling rules, and physical constraints, generate a weekly timetable matrix $\mathbf{T}$ that assigns every required subject period to a valid `(Day, Period, Room, Faculty)` tuple.

### 1. Inputs
- **University Configuration**: Working days ($D = \{\text{Mon}, \text{Tue}, \text{Wed}, \text{Thu}, \text{Fri}\}$), Periods per day ($P = 7$), Period start/end times, Morning break, Lunch break.
- **Departments**: $DEPT = \{\text{CSE}, \text{ECE}, \text{EEE}\}$.
- **Sections**: $S = \{s_1, s_2, \dots, s_7\}$, each with a student count $N_{s} \le 70$.
- **Faculty**: $F = \{f_1, f_2, \dots, f_9\}$, each with max weekly hours $H_f$ and preferred time slot (Morning/Afternoon/No Preference).
- **Subjects**: $SUB = \{sub_1, sub_2, \dots, sub_{35}\}$, each with weekly required classes $W_{sub}$, course type (Theory/Lab), duration in periods (1 or 2), lab requirement flag, section assignment, and assigned faculty.
- **Rooms**: $R = \{r_1, r_2, \dots, r_{10}\}$, each with seat capacity $C_r \le 70$ and type (Classroom/Laboratory).

### 2. Output
A complete set of 98 persisted `TimetableEntry` records mapping `(section_id, subject_id, faculty_id, room_id, day_of_week, period_number)`.

### 3. Hard Constraints vs Soft Constraints

| Constraint Type | Definition | Violation Consequence | Examples in Project |
| :--- | :--- | :--- | :--- |
| **Hard Constraint** | Physical or logical rule that **MUST NEVER** be violated under any circumstances. | Timetable is **INVALID / UNUSABLE** (0 Score). | 1. Section non-overlap<br>2. Faculty non-overlap<br>3. Room non-overlap<br>4. Room capacity ($C_r \ge N_s$)<br>5. Lab room matching<br>6. Break period protection |
| **Soft Constraint** | Desirable quality preference that should be **OPTIMIZED** as much as possible. | Timetable remains valid, but receives a **LOWER QUALITY SCORE**. | 1. Day distribution spreading<br>2. Faculty workload balance<br>3. Student idle gap minimization<br>4. Consecutive class control<br>5. Faculty preferred slot matching |

### 4. Objective Function
$$\text{Maximize } U(\mathbf{T}) = 0.60 \cdot \text{Fitness}_{\text{GA}}(\mathbf{T}) + 0.40 \cdot \text{Suitability}_{\text{Fuzzy}}(\mathbf{T}) \quad \text{subject to } \text{HardViolations}(\mathbf{T}) = 0$$

---

## SECTION 3 — WHY THIS PROJECT NEEDS AI

### Why Simple Database Logic / CRUD Is Not Enough
A standard CRUD database application can store and display records, but it cannot solve scheduling problems. Writing a simple nested `for` loop to assign classes results in immediate deadlocks when resources conflict. 

### The Combinatorial Search Explosion
When assigning 98 class blocks across 7 sections, 9 faculty, 10 rooms, and 35 weekly slots:
$$\text{Total Assignments} = 35^{98} \approx 10^{151}$$
Even a supercomputer executing 1 billion checks per second would require $10^{134}$ years to evaluate all possibilities using brute force.

### Why We Use a Multi-Technique Hybrid AI Pipeline
No single AI algorithm is ideal for all aspects of timetabling:
1. **CSP (Constraint Satisfaction Problem)** is deterministic and excels at **satisfying hard constraints** to produce a 100% feasible baseline. However, CSP alone produces poorly distributed schedules.
2. **GA (Genetic Algorithm)** is stochastic and excels at **multi-objective global search**, taking a feasible baseline and optimizing day spreading and workload balancing across generations.
3. **Fuzzy Logic** excels at **human-like linguistic decision making**, evaluating trade-offs between competing soft goals without hardcoding arbitrary binary thresholds.

Combining **CSP + GA + Fuzzy Decision Engine** leverages the distinct strength of each technique.

---

## SECTION 4 — COMPLETE SYSTEM ARCHITECTURE

```
                                  [ REACT FRONTEND UI (Vite + Tailwind) ]
                                 (Dashboard, Generate, View, Evaluation, Audit)
                                                        │
                                                        ▼ REST API (HTTP JSON / CORS)
                                     [ FASTAPI BACKEND (Uvicorn / Python 3.13) ]
                                                        │
                         ┌──────────────────────────────┴──────────────────────────────┐
                         ▼                                                             ▼
           [ SQLALCHEMY ORM & DATABASE ]                                  [ PRE-GENERATION AUDIT ]
           (SQLite: backend/timetable.db)                               (backend/app/engine/validator.py)
                         │                                                             │
                         └──────────────────────────────┬──────────────────────────────┘
                                                        ▼
                                       [ CSP / BACKTRACKING SOLVER ENGINE ]
                                       (backend/app/engine/csp_scheduler.py)
                                       - MRV Variable Selection
                                       - Forward Checking Domain Pruning
                                       - Hard Constraint Feasibility Baseline (Fitness ≈ 30.9)
                                                        │
                                                        ▼ (Feasible Initial Solution)
                                     [ GENETIC ALGORITHM OPTIMIZER ENGINE ]
                                     (backend/app/engine/genetic_scheduler.py)
                                     - Population: 50 | Generations: 100
                                     - Tournament Selection (3) | Uniform Crossover (0.80)
                                     - Mutation (0.10) | Elitism (2) | Gene Repair
                                     - Multi-Objective Optimization (Fitness ≈ 78.2)
                                                        │
                                                        ▼ (Optimized Candidate Chromosome)
                                      [ FUZZY DECISION-MAKING ENGINE ]
                                      (backend/app/engine/fuzzy_decision.py)
                                      - Fuzzification (Triangular & Trapezoidal MFs)
                                      - 15 Explicit Mamdani IF-THEN Rules
                                      - Min-Max Inference & Aggregation
                                      - Centroid Defuzzification (Score ≈ 79.5)
                                                        │
                                                        ▼ (Combined Score = GA 60% + Fuzzy 40%)
                                      [ POST-GENERATION HARD VALIDATION AUDIT ]
                                      (audit_hard_constraints -> 0 Violations)
                                                        │
                                                        ▼
                                      [ PERSISTENCE & CSV EXPORT ROUTER ]
                                      - Saved to database table: timetable_entries
                                      - Downloadable CSV: university_timetable_export.csv
```

### Component Details

| Subsystem Component | What It Is | Why We Use It | Input Received | Output Produced | Interaction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **React Frontend** | Single Page Web App (SPA) built with React 18 & Vite. | Provides interactive admin UI for setup, generation, grid viewing, and evaluation. | User clicks, form inputs, API JSON. | Rendered UI grids, metrics cards, comparison tables. | Calls FastAPI endpoints via Axios. |
| **FastAPI Backend** | Asynchronous Python 3.13 web application server. | Exposes high-performance REST API endpoints with auto OpenAPI docs. | HTTP Requests from React. | JSON payloads, CSV file binary stream. | Queries SQLAlchemy ORM and triggers AI engines. |
| **SQLAlchemy ORM** | Object-Relational Mapper bridging Python & SQLite. | Safely queries and persists university entities with type safety. | Python Model objects. | SQL queries against `timetable.db`. | Manages DB transactions and WAL backups. |
| **Validator Engine** | Rule auditing module in `validator.py`. | Guarantees pre-generation setup readiness and post-generation 0 hard conflicts. | DB Session / Timetable entries list. | Hard audit report (`is_valid`, 0 violations). | Blocks invalid generation; validates output entries. |
| **CSP Scheduler** | Backtracking CSP solver in `csp_scheduler.py`. | Finds a 100% hard-feasible initial timetable using MRV and Forward Checking. | University DB Config & Models. | `csp_result` (98 entries, Fitness ≈ 30.9). | Passes initial feasible chromosome to GA. |
| **GA Optimizer** | Stochastic optimizer in `genetic_scheduler.py`. | Rearranges slots across 100 generations to maximize soft constraint quality. | `csp_result` baseline. | `ga_result` (Best entries, Fitness ≈ 78.2). | Passes optimized chromosome to Fuzzy Engine. |
| **Fuzzy Engine** | Decision engine in `fuzzy_decision.py`. | Evaluates soft suitability using Mamdani inference & Centroid defuzzification. | Assigned entries list. | `fuzzy_result` (Fuzzy score ≈ 79.5, Decision: Good). | Combined with GA fitness to produce Final Score. |
| **Evaluation Engine**| Research framework in `evaluation_engine.py`. | Conducts reproducible experiments comparing Exp A, B, C & 5 stochastic GA runs. | DB Session (Read-Only). | Comprehensive research metrics payload. | Invokes CSP, GA, Fuzzy engines safely without DB mutation. |

---

## SECTION 5 — TECHNOLOGY STACK

```
[ FRONTEND ]                  [ BACKEND ]                   [ DATABASE & DATA ]
- React 18.3.1                - Python 3.13.12              - SQLite 3 (timetable.db)
- Vite 5.4.21                 - FastAPI 0.115.0             - SQLAlchemy 2.0.38
- Tailwind CSS 3.4.17         - Uvicorn 0.34.0              - WAL Journal Mode
- Lucide React 0.475.0        - Pydantic 2.10.6             - Automated WAL Backups
- React Router DOM 7.1.5      - Pytest 9.1.1                - Isolated In-Memory Testing
```

---

## SECTION 6 — DATABASE / KNOWLEDGE REPRESENTATION

### SQLAlchemy Data Models (`backend/app/models.py`)

```
                  ┌────────────────────────┐
                  │    UniversityConfig    │
                  ├────────────────────────┤
                  │ university_name        │
                  │ working_days (JSON)    │
                  │ periods_per_day        │
                  │ period_duration_mins   │
                  │ morning_break_duration │
                  │ lunch_break_duration   │
                  └────────────────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
│  Department  │      │   Faculty    │      │       Room       │
├──────────────┤      ├──────────────┤      ├──────────────────┤
│ id           │      │ id           │      │ id               │
│ code         │      │ name         │      │ room_number      │
│ name         │      │ max_wk_hours │      │ capacity (<=70)  │
└──────┬───────┘      │ pref_slot    │      │ is_lab           │
       │              └──────┬───────┘      └────────┬─────────┘
       ▼                     │                       │
┌──────────────┐             │                       │
│   Section    │             │                       │
├──────────────┤             │                       │
│ id           │             │                       │
│ name         │             │                       │
│ student_cnt  │             │                       │
└──────┬───────┘             │                       │
       │                     │                       │
       ▼                     │                       │
┌──────────────┐             │                       │
│   Subject    │             │                       │
├──────────────┤             │                       │
│ id           │             │                       │
│ code         │             │                       │
│ name         │             │                       │
│ course_type  │             │                       │
│ duration     │             │                       │
└──────┬───────┘             │                       │
       │                     │                       │
       └─────────────────────┼───────────────────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │   TimetableEntry   │
                  ├────────────────────┤
                  │ id                 │
                  │ section_id (FK)    │
                  │ subject_id (FK)    │
                  │ faculty_id (FK)    │
                  │ room_id (FK)       │
                  │ day_of_week        │
                  │ period_number      │
                  └────────────────────┘
```

---

## SECTION 7 — USER WORKFLOW

```
1. Configure University Setup (Days, Periods, Break Durations)
                        ↓
2. Add Academic Departments (CSE, ECE, EEE)
                        ↓
3. Create Student Sections (CSE-A...EEE-B with Student Capacity <= 70)
                        ↓
4. Add Faculty Members & Time Preferences (Morning / Afternoon)
                        ↓
5. Add Subjects & Map Curricula (Theory 1p, Lab 2p contiguous)
                        ↓
6. Add Classrooms & Laboratories (Capacity <= 70, Room Types)
                        ↓
7. Configure Timetable Soft Preferences
                        ↓
8. Execute Pre-Generation System Audit (/api/validation -> 100% PASS)
                        ↓
9. Click "Generate Timetable" (/api/scheduler/generate)
   [ Database -> CSP Feasibility -> GA Optimization -> Fuzzy Evaluation -> Post-Audit -> Persist ]
                        ↓
10. View Master Weekly Matrix Grid (/view-timetable)
                        ↓
11. Review Executive Evaluation & AI Explainability (/generate-timetable)
                        ↓
12. Execute Research Evaluation Suite (/evaluation)
                        ↓
13. Download Official Timetable CSV (/api/scheduler/export)
```

---

## SECTION 8 — PERIOD GENERATION

The module `backend/app/engine/period_generator.py` dynamically calculates start and end times for every period based on `UniversityConfig`.

### Configured Timetable Schedule Matrix
- **Base Start Time**: `08:25`
- **Period Duration**: `50 minutes`
- **Morning Break**: `15 minutes` (after Period 2)
- **Lunch Break**: `50 minutes` (after Period 4)

---

## SECTION 9 — VALIDATION BEFORE GENERATION

Pre-generation validation (`run_pre_generation_validation` in `validator.py`) queries the database before launching CSP to catch configuration errors early.

---

## SECTION 10 — CSP + BACKTRACKING SOLVER

### CSP Fundamentals
A **Constraint Satisfaction Problem (CSP)** is defined by a tuple $(X, D, C)$:
- **$X = \{x_1, x_2, \dots, x_n\}$**: Set of variables to be scheduled.
- **$D = \{D_1, D_2, \dots, D_n\}$**: Domains of possible values for each variable.
- **$C = \{c_1, c_2, \dots, c_m\}$**: Set of hard constraints that must be satisfied.

---

## SECTION 11 — ALL HARD CONSTRAINTS

| Hard Constraint | Meaning | Why Needed | How Code Enforces It | Example Violation |
| :--- | :--- | :--- | :--- | :--- |
| **1. Section Non-Overlap** | A section cannot attend 2 classes at once. | Students cannot split physically. | Maintains `sec_busy` set `(sec_id, day, p)`. | Section `CSE-A` scheduled in `CS101` and `CS102` at Mon P1. |
| **2. Faculty Non-Overlap** | A teacher cannot teach 2 classes at once. | Faculty cannot split physically. | Maintains `fac_busy` set `(fac_id, day, p)`. | `Dr. Turing` scheduled in `CSE-A` and `ECE-B` at Mon P1. |
| **3. Room Non-Overlap** | A room cannot hold 2 classes at once. | Physical room collision. | Maintains `room_busy` set `(room_id, day, p)`. | Room `C-101` assigned to `CSE-A` and `EEE-A` at Mon P1. |
| **4. Room Capacity** | Room capacity $\ge$ section student count. | Prevents student overcrowding. | Checks `room.capacity >= section.student_count`. | Section `CSE-A` (65 students) in Room `C-105` (30 seats). |
| **5. Laboratory Room Type** | Lab subjects require Laboratory rooms. | Requires specialized equipment. | Checks `sub.course_type == 'Lab' ==> room.is_lab`. | `CSE Lab` assigned to standard lecture classroom `C-101`. |
| **6. Weekly Required Load** | All required subject periods must be scheduled. | Fulfills academic syllabus. | Tracks `subject_period_counts[sub_id] == W_sub`. | `CS101` requires 3 periods/week, but only 2 scheduled. |
| **7. Lab Contiguous Blocks** | Labs require 2 consecutive periods. | Practical experiments take time. | Scheduled as contiguous `(p, p+1)` unit. | `CSE Lab` assigned as single 50-min period. |
| **8. Break Protection** | No classes during breaks or outside P1–P7. | Protects student/faculty rest. | Enforces `1 <= period <= 7` & skips break gaps. | Class scheduled during Lunch break (`12:00–12:50`). |
| **9. Faculty Workload Limit** | Faculty total hours $\le$ max weekly limit. | Prevents faculty burnout. | Enforces `assigned_hours <= fac.max_weekly_hours`. | `Dr. Turing` assigned 24 hours when max limit is 20 hours. |
| **10. Lab Crossing Break Protection**| Labs cannot span across break periods. | Prevents broken lab sessions. | Restricts lab start periods to `P1`, `P3`, `P5`. | Lab starting at `P2` (09:15) and ending at `P3` (10:50). |

---

## SECTION 12 — WHY CSP ALONE IS NOT ENOUGH

- **CSP Baseline Fitness**: **`30.9 / 100`**
- CSP makes the timetable **FEASIBLE**, but not **GOOD**. This naturally motivates the **Genetic Algorithm**.

---

## SECTION 13 — GENETIC ALGORITHM

Population $50$, Generations $100$, Tournament Selection $3$, Uniform Crossover $0.80$, Mutation $0.10$, Elitism $2$, Gene Repair.

---

## SECTION 14 — OUR GA CHROMOSOME

List of scheduling unit gene dictionaries.

---

## SECTION 15 — GA FITNESS FUNCTION

$$\text{Fitness}_{\text{GA}} = 0.35 \cdot S_{\text{DayDist}} + 0.20 \cdot S_{\text{FacBal}} + 0.20 \cdot S_{\text{Gaps}} + 0.15 \cdot S_{\text{Consecutive}} + 0.10 \cdot S_{\text{Pref}}$$

---

## SECTION 16 — GA OPERATORS

Tournament selection, uniform crossover, mutation, gene repair.

---

## SECTION 17 — WHY FREE PERIODS ARE ALLOWED

Free periods provide rest and prevent consecutive class burnout.

---

## SECTION 18 — FUZZY LOGIC FROM ZERO

Degree of membership $\mu \in [0.0, 1.0]$.

---

## SECTION 19 — WHY FUZZY DECISION MAKING

Evaluates multi-objective soft constraint suitability using human-like linguistic rules.

---

## SECTION 20 — OUR FUZZY INPUT VARIABLES

Day Distribution, Faculty Balance, Student Gaps, Consecutive Classes, Faculty Preference.

---

## SECTION 21 — MEMBERSHIP FUNCTIONS

Triangular and Trapezoidal membership functions.

---

## SECTION 22 — OUR FUZZY RULE BASE (15 RULES)

15 explicit Mamdani IF-THEN rules.

---

## SECTION 23 — MAMDANI INFERENCE

Fuzzification, Rule evaluation (MIN), Min implication, Max aggregation, Defuzzification.

---

## SECTION 24 — CENTROID DEFUZZIFICATION

Center of Gravity defuzzification over $[0, 100]$.

---

## SECTION 25 — GA + FUZZY INTEGRATION

$$\text{Final Combined Score} = 0.60 \cdot \text{Fitness}_{\text{GA}} + 0.40 \cdot \text{Score}_{\text{Fuzzy}}$$

---

## SECTION 26 — POST-GENERATION VALIDATION

8-category post-generation audit (`validator.py`).

---

## SECTION 27 — EXPLAINABILITY

Baseline vs GA vs Fuzzy scores, fired rules breakdown, natural language rationale.

---

## SECTION 28 — EXPERIMENTAL EVALUATION

Controlled comparison: Experiment A (CSP Only) vs Experiment B (CSP+GA) vs Experiment C (CSP+GA+Fuzzy).

---

## SECTION 29 — ACTUAL EXPERIMENTAL RESULTS

### Measured Results on Real University Dataset

| Metric | Experiment A (CSP Only) | Experiment B (CSP + GA) | Experiment C (CSP + GA + Fuzzy) | Target / Unit |
| :--- | :--- | :--- | :--- | :--- |
| **Hard Constraint Violations** | **0** | **0** | **0** | **0 Violations &check;** |
| **Assigned Timetable Slots** | **98** | **98** | **98** | **98 Slots** |
| **Overall Quality Score** | **30.9 / 100** | **78.2 / 100** | **78.7 / 100** | **Points (0-100)** |
| **Day Distribution Score** | **6.4 / 100** | **98.4 / 100** | **98.4 / 100** | **Points (0-100)** |
| **Faculty Workload Balance** | **19.4 / 100** | **94.0 / 100** | **94.0 / 100** | **Points (0-100)** |
| **Student Internal Idle Gaps** | **0.09 gaps** | **1.77 gaps** | **1.77 gaps** | **Avg Gaps / Sec-Day** |
| **Consecutive 3+ Theory Runs**| **1.71 runs** | **0.00 runs** | **0.00 runs** | **Avg Runs / Sec-Day** |
| **Faculty Preference Match** | **100.0%** | **100.0%** | **100.0%** | **% Match** |
| **Execution Runtime** | **0.011s** | **18.502s** | **0.000s** (Reused GA) | **Seconds** |

### Stochastic GA Performance Analysis (5 Independent Runs)

| Run ID | Seed | CSP Baseline | GA Optimized Fitness | GA Improvement | Hard Violations | Actual Execution Runtime |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Run #1** | `seed=42` | 30.9 / 100 | **78.2 / 100** | **+152.7%** | 0 Violations | **0.000s** (Reused Exp B) |
| **Run #2** | `seed=101` | 30.9 / 100 | **77.5 / 100** | **+150.4%** | 0 Violations | **18.204s** |
| **Run #3** | `seed=202` | 30.9 / 100 | **77.4 / 100** | **+150.1%** | 0 Violations | **18.357s** |
| **Run #4** | `seed=303` | 30.9 / 100 | **76.9 / 100** | **+148.4%** | 0 Violations | **18.255s** |
| **Run #5** | `seed=404` | 30.9 / 100 | **77.6 / 100** | **+150.7%** | 0 Violations | **17.992s** |

- **Sequential Experimental Stages Runtime Sum**: **`91.321 seconds`**
- **Total End-to-End Evaluation Suite Wall-Clock Time**: **`91.348 seconds`**
- **Orchestration & Measurement Overhead**: **`0.027 seconds`**

---

## SECTION 30 — IMPORTANT INTERPRETATION OF RESULTS

Explains feasibility vs soft quality and low stochastic variance ($\sigma = \pm 0.42$).

---

## SECTION 31 — DATABASE SAFETY

`backend/timetable.db` remains 100% intact and read-only during evaluation.

---

## SECTION 32 — TESTING

`pytest backend/tests` (25 passed) and `npm run build` (success).

---

## SECTION 33 — API STRUCTURE

Endpoints grouped by entity and scheduler functionality.

---

## SECTION 34 — FRONTEND STRUCTURE

React UI pages.

---

## SECTION 35 — COMPLETE END-TO-END EXECUTION

End-to-end user and backend workflow.

---

## SECTION 36 — WHY WE USED THREE AI TECHNIQUES

CSP (Feasibility) + GA (Optimization) + Fuzzy (Linguistic Decision Quality).

---

## SECTION 37 — KNOWLEDGE REPRESENTATION CONCEPTS

Relational ontology, domain rules, fuzzy rule base.

---

## SECTION 38 — LIMITATIONS

Stochastic nature, execution time.

---

## SECTION 39 — FUTURE ENHANCEMENTS

Pareto frontiers, real-time rescheduling.

---

## SECTION 40 — VIVA PREPARATION (50 VIVA Q&A)

Categorized questions and answers for viva defense.

---

## SECTION 41 TO 43 — 2-MIN, 5-MIN, 10-MIN EXPLANATIONS

Spoken scripts for presentation.

---

## SECTION 44 & 45 — KEY TERMS & CODE FILE MAP

Quick reference tables.
