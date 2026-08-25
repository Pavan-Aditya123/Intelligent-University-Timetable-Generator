from datetime import datetime, timedelta
from typing import List, Dict, Any

def generate_academic_periods(
    start_time_str: str = "08:25",
    class_duration_mins: int = 50,
    morning_break_after: int = 2,
    morning_break_mins: int = 15,
    lunch_break_after: int = 4,
    lunch_break_mins: int = 50,
    periods_count: int = 7
) -> List[Dict[str, Any]]:
    """
    Constructs the daily timetable period breakdown based on academic day rules:
    - Period 1: 08:25 - 09:15
    - Period 2: 09:15 - 10:05
    - Morning Break (15 mins): 10:05 - 10:20
    - Period 3: 10:20 - 11:10
    - Period 4: 11:10 - 12:00
    - Lunch Break (50 mins): 12:00 - 12:50
    - Period 5: 12:50 - 13:40
    - Period 6: 13:40 - 14:30
    - Period 7: 14:30 - 15:20
    Total: 7 class periods per day.
    """
    try:
        current_time = datetime.strptime(start_time_str, "%H:%M")
    except ValueError:
        current_time = datetime.strptime("08:25", "%H:%M")

    periods = []
    class_index = 1

    while class_index <= periods_count:
        # Morning Break (after Period 2)
        if class_index == morning_break_after + 1 and morning_break_mins > 0:
            break_start = current_time.strftime("%H:%M")
            current_time += timedelta(minutes=morning_break_mins)
            break_end = current_time.strftime("%H:%M")
            periods.append({
                "period_number": 0,
                "start_time": break_start,
                "end_time": break_end,
                "period_type": "MorningBreak",
                "label": f"Morning Break ({morning_break_mins} mins)"
            })

        # Lunch Break (after Period 4)
        if class_index == lunch_break_after + 1 and lunch_break_mins > 0:
            break_start = current_time.strftime("%H:%M")
            current_time += timedelta(minutes=lunch_break_mins)
            break_end = current_time.strftime("%H:%M")
            periods.append({
                "period_number": 0,
                "start_time": break_start,
                "end_time": break_end,
                "period_type": "LunchBreak",
                "label": f"Lunch Break ({lunch_break_mins} mins)"
            })

        # Class Period
        p_start = current_time.strftime("%H:%M")
        current_time += timedelta(minutes=class_duration_mins)
        p_end = current_time.strftime("%H:%M")

        periods.append({
            "period_number": class_index,
            "start_time": p_start,
            "end_time": p_end,
            "period_type": "Class",
            "label": f"Period {class_index}"
        })
        class_index += 1

    return periods
