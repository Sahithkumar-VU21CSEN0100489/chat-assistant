import os
import httpx

# Gemini 2.5 Flash model
GEMINI_API_KEY = "AIzaSyCSnShbwW9KErbM2Pu_KEt5ypnk2EEOi4w"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

async def ask_gemini(document: str, question: str) -> dict:
    prompt = (
        "Answer the following question using ONLY the information in the document below. "
        "If the answer is not present in the document, reply with 'no information.'\n\n"
        f"Question: {question}\n\n"
        f"Document:\n{document}\n\n"
        "Answer:"
    )
    followup_prompt = (
        "Based on the document below and the last question, suggest 3 relevant follow-up questions a user might ask next. "
        "Return only the questions, each on a new line.\n\n"
        f"Last Question: {question}\n\n"
        f"Document:\n{document}\n\n"
        "Follow-up Questions:"
    )
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    followup_data = {
        "contents": [{"parts": [{"text": followup_prompt}]}]
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(GEMINI_API_URL, json=data)
            response.raise_for_status()
            result = response.json()
            answer = result["candidates"][0]["content"]["parts"][0]["text"]
            # Get follow-up questions
            followup_response = await client.post(GEMINI_API_URL, json=followup_data)
            followup_response.raise_for_status()
            followup_result = followup_response.json()
            followup_text = followup_result["candidates"][0]["content"]["parts"][0]["text"]
            followup_questions = [q.strip() for q in followup_text.split("\n") if q.strip()]
            return {"answer": answer, "followup_questions": followup_questions}
    except Exception as e:
        return {"answer": f"Error: {str(e)}", "followup_questions": []} 