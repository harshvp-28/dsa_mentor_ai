from fastapi import FastAPI, HTTPException
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.recommendation_engine import recommend_problems as get_recs, get_ranked_topics
from scripts.llm_generator import generate_adaptive_content
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="DSA Mentor API", description="Personalized LeetCode problem recommendations")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def root():
    return {
        "message": "DSA Mentor AI is running",
        "docs": "Go to /docs for interactive documentation"
    }
@app.get("/user/{user_id}/weakness")
def get_weakness(user_id: int):
    try:
        ranked = get_ranked_topics(user_id)
        if ranked is None:
            raise HTTPException(status_code=404, detail=f"User {user_id} not found")
        
        return {
            "user_id": user_id,
            "ranked_topics": ranked
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/user/{user_id}/recommend")
def get_recommendations(user_id: int, n_per_difficulty: int = 1):
    try:
        result = get_recs(user_id, n_per_difficulty)
        if result is None:
            raise HTTPException(status_code=404, detail=f"User {user_id} not found or no unsolved problems")
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/user/{user_id}/generate")
def generate_content(user_id: int):
    try:
        content = generate_adaptive_content(user_id)
        if content is None:
            raise HTTPException(status_code=404, detail=f"User {user_id} not found")
        
        return {
            "user_id": user_id,
            "content": content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/{username}")
def analyze(username: str):
    from scripts.analyze_user import analyze_user
    result = analyze_user(username)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post("/generate/{username}")
def generate_for_user(username: str):
    from scripts.analyze_user import analyze_user
    from scripts.llm_generator import generate_adaptive_content

    data = analyze_user(username)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])

    # Build context manually and call gemini
    from google import genai
    import os
    from dotenv import load_dotenv
    load_dotenv()

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    prompt = f"""
    You are an expert DSA tutor analyzing a student's performance.

    Student: {username}
    Weakest topic: {data['weakest_topic']}
    Accuracy: {data['accuracy_on_weakest']*100:.1f}%
    Weakness score: {data['weakness_score']}

    Generate:
    1. PROGRESSIVE QUESTIONS: 3 practice questions (Easy → Medium → Hard) with approach hints
    2. TRAP QUESTION: 1 tricky question testing common misconceptions
    3. COMMON MISTAKES: Top 3 mistakes in {data['weakest_topic']}
    4. LEARNING ROADMAP: 3-step weekly plan to improve from {data['accuracy_on_weakest']*100:.1f}% to 80%+
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return {"username": username, "content": response.text}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
