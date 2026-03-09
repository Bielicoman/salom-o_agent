import docx

def getText(filename):
    doc = docx.Document(filename)
    fullText = []
    for para in doc.paragraphs:
        fullText.append(para.text)
    return '\n'.join(fullText)

with open('brain_text.txt', 'w', encoding='utf-8') as f:
    f.write(getText('CÉREBRO - SALOMÃO_v6.8.docx'))
