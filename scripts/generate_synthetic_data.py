import csv
import random
import os
from datetime import datetime, timedelta

SOLVE_RATES = {
    "EASY": 0.80,
    "MEDIUM": 0.55,
    "HARD": 0.30
}

NUM_USERS = 100
ATTEMPT_RATE = 0.60

def load_problems(filename="data/problems.csv"):
    problems = []
    with open(filename, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            problems.append({
                "problem_id": row["questionId"],
                "difficulty": row["difficulty"],
                "topic": row["topic"]
            })
    return problems

def generate_submitted_at(base_date, variation_days=90):
    random_days = random.randint(-variation_days, variation_days)
    random_hours = random.randint(0, 23)
    random_minutes = random.randint(0, 59)
    random_seconds = random.randint(0, 59)
    
    submission_date = base_date + timedelta(
        days=random_days,
        hours=random_hours,
        minutes=random_minutes,
        seconds=random_seconds
    )
    
    return submission_date.strftime("%Y-%m-%d %H:%M:%S")

def generate_attempts(solved):
    if solved:
        if random.random() < 0.7:
            return random.randint(1, 3)
        else:
            return random.randint(4, 8)
    else:
        return random.randint(1, 5)

def generate_user_submissions(user_id, problems):
    submissions = []
    
    attempted_problems = random.sample(
        problems, 
        k=int(len(problems) * ATTEMPT_RATE)
    )
    
    base_date = datetime.now()
    
    for problem in attempted_problems:
        difficulty = problem["difficulty"]
        solve_rate = SOLVE_RATES[difficulty]
        
        solved = random.random() < solve_rate
        attempts = generate_attempts(solved)
        submitted_at = generate_submitted_at(base_date)
        
        submissions.append({
            "user_id": user_id,
            "problem_id": problem["problem_id"],
            "solved": solved,
            "attempts": attempts,
            "submitted_at": submitted_at
        })
    
    return submissions

def save_submissions(submissions, filename="data/submissions.csv"):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    with open(filename, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(["user_id", "problem_id", "solved", "attempts", "submitted_at"])
        
        for sub in submissions:
            writer.writerow([
                sub["user_id"],
                sub["problem_id"],
                sub["solved"],
                sub["attempts"],
                sub["submitted_at"]
            ])
    
    print(f"Saved {len(submissions)} submissions to {filename}")

def main():
    print("Loading problems...")
    problems = load_problems()
    print(f"Loaded {len(problems)} problems")
    
    all_submissions = []
    
    print(f"\nGenerating submissions for {NUM_USERS} users...")
    for user_id in range(1, NUM_USERS + 1):
        user_submissions = generate_user_submissions(user_id, problems)
        all_submissions.extend(user_submissions)
        print(f"  User {user_id}: {len(user_submissions)} submissions")
    
    print(f"\nTotal submissions generated: {len(all_submissions)}")
    
    solved_count = sum(1 for sub in all_submissions if sub["solved"])
    print(f"Solved: {solved_count} ({solved_count/len(all_submissions)*100:.1f}%)")
    
    save_submissions(all_submissions)

if __name__ == "__main__":
    main()