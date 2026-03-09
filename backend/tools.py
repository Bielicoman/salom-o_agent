from langchain_core.tools import tool
import os

@tool
def download_youtube_audio(url: str) -> str:
    """Useful when you need to download a YouTube video or extract audio. Returns the local file path."""
    import yt_dlp
    output_path = os.path.join(os.path.dirname(__file__), "..", "downloads", "%(title)s.%(ext)s")
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': output_path,
        'quiet': True
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            base, _ = os.path.splitext(filename)
            mp3_file = f"{base}.mp3"
            return f"Áudio salvo com sucesso em: {mp3_file}"
    except Exception as e:
        return f"Erro ao baixar: {str(e)}"

@tool
def search_internet(query: str) -> str:
    """Useful when you need to answer questions about current events or fetch up-to-date information from the internet."""
    from duckduckgo_search import DDGS
    try:
        results = ""
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=3):
                results += f"Título: {r['title']}\nSnippet: {r['body']}\n\n"
        return results if results else "Nenhum resultado encontrado."
    except Exception as e:
        return f"Erro na pesquisa: {str(e)}"

@tool
def convert_media(input_file: str, output_format: str) -> str:
    """Useful when you need to convert a video or audio file to a different format (e.g. mp4 to mp3). Specify absolute path to the local input file."""
    import ffmpeg
    import os
    
    if not os.path.exists(input_file):
        return f"Erro: O arquivo '{input_file}' não foi encontrado."
        
    base, _ = os.path.splitext(input_file)
    output_file = f"{base}.{output_format}"
    
    try:
        ffmpeg.input(input_file).output(output_file).run(overwrite_output=True, quiet=True)
        return f"Arquivo convertido com sucesso: {output_file}"
    except Exception as e:
        return f"Erro ao converter mídia: {str(e)}"

@tool
def generate_image(prompt: str) -> str:
    """Useful to generate an image based on a prompt. It uses Pollinations AI (free, no auth). Return the URL."""
    import urllib.parse
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1920&height=1080&nologo=true"
    return f"Imagem gerada. Você pode visualizar ou baixar acessando este link: {url}"
