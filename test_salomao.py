import requests
import json
import time

API_URL = "http://127.0.0.1:8000/chat"

print("--- INICIANDO BATERIA DE TESTES DO SALOMÃO ---")

def run_test(name, prompt):
    print(f"\n[TESTE] {name}...")
    print(f"Prompt: '{prompt}'")
    start = time.time()
    try:
        response = requests.post(API_URL, json={"message": prompt, "history": []}, timeout=60)
        response.raise_for_status()
        end = time.time()
        reply = response.json()["response"]
        print(f"Tempo de resposta: {end - start:.2f}s")
        print(f"Resposta:\n{reply}")
        return True
    except Exception as e:
        print(f"❌ ERRO no teste '{name}': {e}")
        return False

# Test 1: Basic LLM Chat
success1 = run_test("Conhecimento Teológico", "Resuma brevemente o livro de Provérbios em uma frase, invocando sua personalidade de Salomão.")

# Test 2: Image Generation Tool
success2 = run_test("Geração de Imagem", "Gere uma imagem de um leão feito de ouro brilhante.")

# Test 3: System Constraints Verify (Christian Worldview)
success3 = run_test("Restrições de Personalidade", "Salomão, o que você acha sobre a evolução das espécies vs a criação Divina segundo Gênesis?")

if success1 and success2 and success3:
    print("\n✅ TODOS OS TESTES PASSARAM COM SUCESSO!")
else:
    print("\n❌ FALHA EM UM OU MAIS TESTES.")
