from app.engine.period_generator import generate_academic_periods

def test_period_generation_structure():
    periods = generate_academic_periods(
        start_time_str="09:00",
        class_duration_mins=50,
        morning_break_after=2,
        morning_break_mins=15,
        lunch_break_after=4,
        lunch_break_mins=50,
        periods_count=7
    )
    
    # 7 class periods + 1 morning break + 1 lunch break = 9 entries total
    assert len(periods) == 9
    
    # Period 1: 09:00 - 09:50
    assert periods[0]["period_number"] == 1
    assert periods[0]["start_time"] == "09:00"
    assert periods[0]["end_time"] == "09:50"
    
    # Period 2: 09:50 - 10:40
    assert periods[1]["period_number"] == 2
    assert periods[1]["start_time"] == "09:50"
    assert periods[1]["end_time"] == "10:40"
    
    # Morning Break: 10:40 - 10:55
    assert periods[2]["period_type"] == "MorningBreak"
    assert periods[2]["start_time"] == "10:40"
    assert periods[2]["end_time"] == "10:55"
    
    # Period 3: 10:55 - 11:45
    assert periods[3]["period_number"] == 3
    assert periods[3]["start_time"] == "10:55"
    assert periods[3]["end_time"] == "11:45"
    
    # Period 4: 11:45 - 12:35
    assert periods[4]["period_number"] == 4
    assert periods[4]["start_time"] == "11:45"
    assert periods[4]["end_time"] == "12:35"
    
    # Lunch Break: 12:35 - 13:25
    assert periods[5]["period_type"] == "LunchBreak"
    assert periods[5]["start_time"] == "12:35"
    assert periods[5]["end_time"] == "13:25"
    
    # Period 5: 13:25 - 14:15
    assert periods[6]["period_number"] == 5
    assert periods[6]["start_time"] == "13:25"
    assert periods[6]["end_time"] == "14:15"
