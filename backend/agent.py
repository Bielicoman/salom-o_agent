import os
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# Import LangChain agent components
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from dotenv import load_dotenv
from tools import download_youtube_audio, search_internet, convert_media, generate_image

load_dotenv()

def read_system_prompt():
    prompt_path = os.path.join(os.path.dirname(__file__), "system_prompt.txt")
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "You are Salomão, an intelligent AI agent."

# Initialize tools
tools = [download_youtube_audio, search_internet, convert_media, generate_image]

def get_salomao_response(current_message: str, history: list = None):
    """
    history format expected: [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
    """
    if history is None:
         history = []

    sys_prompt = read_system_prompt()
    
    # Initialize the LLM
    llm = ChatGroq(
        model="llama-3.3-70b-versatile", 
        temperature=0.7, 
        max_tokens=4096
    )

    # Convert history into LangChain message objects
    chat_history = []
    for msg in history:
        role = msg.role if hasattr(msg, 'role') else msg.get('role')
        content = msg.content if hasattr(msg, 'content') else msg.get('content')
        if role == 'user':
            chat_history.append(HumanMessage(content=content))
        elif role == 'assistant':
            chat_history.append(AIMessage(content=content))

    chat_history.append(HumanMessage(content=current_message))
    
    try:
        from langgraph.prebuilt import create_react_agent
        
        # Append system prompt as the first message
        messages = [{"role": "system", "content": sys_prompt}]
        
        # Add history
        for msg in history:
            role = msg.role if hasattr(msg, 'role') else msg.get('role')
            content = msg.content if hasattr(msg, 'content') else msg.get('content')
            messages.append({"role": role, "content": content})
            
        messages.append({"role": "user", "content": current_message})
        
        agent_executor = create_react_agent(llm, tools)
        
        response = agent_executor.invoke({"messages": messages})
        
        # The response is a dictionary with "messages", the final message from the AI is the last one
        return response["messages"][-1].content
    except Exception as e:
        return f"Perdoe-me, encontrei um erro interno de processamento ao tentar responder: {str(e)}"
