import pandas as pd
import random

def get_ranked_topics(user_id):
    weakness_df = pd.read_csv("data/weakness_scores.csv")
    user_row = weakness_df[weakness_df["user_id"] == user_id]
    
    if len(user_row) == 0:
        return None
    
    topic_scores = []
    for col in weakness_df.columns:
        if col.endswith("_weakness"):
            topic_name = col.replace("_weakness", "").replace("_", " ").title()
            score = user_row[col].values[0]
            topic_scores.append((topic_name, score))
    
    topic_scores.sort(key=lambda x: x[1], reverse=True)
    
    ranked_topics = [topic for topic, score in topic_scores]
    return ranked_topics

def recommend_problems(user_id, n_per_difficulty=1):
    problems_df = pd.read_csv("data/problems.csv")
    submissions_df = pd.read_csv("data/submissions.csv")
    
    ranked_topics = get_ranked_topics(user_id)
    if ranked_topics is None:
        return {"error": f"couldnt find data for user {user_id}"}
    
    solved = submissions_df[
        (submissions_df["user_id"] == user_id) & 
        (submissions_df["solved"] == True)
    ]
    solved_ids = solved["problem_id"].astype(str).tolist()
    
    selected_topic = None
    selected_problems = None
    
    for topic in ranked_topics:
        topic_problems = problems_df[problems_df["topic"] == topic]
        unsolved = topic_problems[~topic_problems["questionId"].astype(str).isin(solved_ids)]
        
        if len(unsolved) > 0:
            selected_topic = topic
            selected_problems = unsolved
            break
    
    if selected_topic is None:
        return {
            "user_id": user_id,
            "message": "damn u solved everything! go touch grass",
            "recommendations": []
        }
    
    easy = selected_problems[selected_problems["difficulty"] == "EASY"]
    medium = selected_problems[selected_problems["difficulty"] == "MEDIUM"]
    hard = selected_problems[selected_problems["difficulty"] == "HARD"]
    
    picks = []
    
    if len(easy) > 0:
        pick = easy.sample(min(n_per_difficulty, len(easy)))
        picks.append(("EASY", pick.iloc[0]["title"]))
    
    if len(medium) > 0:
        pick = medium.sample(min(n_per_difficulty, len(medium)))
        picks.append(("MEDIUM", pick.iloc[0]["title"]))
    
    if len(hard) > 0:
        pick = hard.sample(min(n_per_difficulty, len(hard)))
        picks.append(("HARD", pick.iloc[0]["title"]))
    
    return {
        "user_id": user_id,
        "weakest_topic": selected_topic,
        "recommendations": [
            {"difficulty": diff, "title": title}
            for diff, title in picks
        ]
    }

if __name__ == "__main__":
    result = recommend_problems(user_id=1)
    print(result)