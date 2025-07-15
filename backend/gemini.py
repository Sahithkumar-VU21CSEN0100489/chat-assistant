import os
import httpx

# Gemini 2.5 Flash model
GEMINI_API_KEY = "AIzaSyCZashkxFoC_9424VbHx-CwReYFlqNIIvg"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

async def ask_gemini(document: str, question: str) -> str:
    prompt = (
        "Answer the following question using ONLY the information in the document below. "
        "If the answer is not present in the document, reply with 'no information.'\n\n"
        f"Question: {question}\n\n"
        f"Document:\n{document}\n\n"
        "Answer:"
    )
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(GEMINI_API_URL, json=data)
            response.raise_for_status()
            result = response.json()
            answer = result["candidates"][0]["content"]["parts"][0]["text"]
            return answer
    except Exception as e:
        return f"Error: {str(e)}" 