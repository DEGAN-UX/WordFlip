import json
from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT=Path(__file__).parent
rows=json.loads((ROOT/'dist/cards.json').read_text(encoding='utf-8'))
out=ROOT/'Hungarian_Flashcards_500_Words_50_Phrases.pdf'
pdfmetrics.registerFont(TTFont('DejaVu','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuBold','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='Title2',fontName='DejaVuBold',fontSize=23,leading=29,textColor=colors.HexColor('#193e34'),spaceAfter=15))
styles.add(ParagraphStyle(name='Body2',fontName='DejaVu',fontSize=9.4,leading=15,textColor=colors.HexColor('#384e43')))
styles.add(ParagraphStyle(name='Card2',fontName='DejaVuBold',fontSize=11,leading=17,textColor=colors.HexColor('#193e34')))
styles.add(ParagraphStyle(name='Section2',fontName='DejaVuBold',fontSize=15,leading=21,textColor=colors.HexColor('#c76c53'),spaceBefore=18,spaceAfter=10))
doc=SimpleDocTemplate(str(out),pagesize=(595,842),rightMargin=48,leftMargin=48,topMargin=48,bottomMargin=48,title='Hungarian Flashcards — 500 words and grammar entries, plus 50 phrases')
story=[Paragraph('Hungarian flashcards',styles['Title2']),Paragraph('500 vocabulary and grammar entries + 50 practical phrases',styles['Body2']),Spacer(1,9),Paragraph('Every entry has an English meaning and an illustrative Hungarian sentence with a British English translation. Selection favours common, practical A1–A2 vocabulary; the order is approximate and is not an independently verified corpus-frequency ranking. Many short model sentences deliberately reuse familiar structures.',styles['Body2']),Spacer(1,13)]
sections=[('noun','Nouns'),('verb','Verbs and present-tense conjugation'),('adjective','Adjectives'),('adverb','Adverbs'),('pronoun','Pronouns'),('conjunction','Conjunctions'),('postposition','Postpositions'),('suffix','Suffixes'),('phrase','Practical phrases')]
story.append(Paragraph('Contents',styles['Section2']))
for pos,title in sections:
    n=sum(1 for row in rows if row['partOfSpeech']==pos)
    story.append(Paragraph(f'{title} — {n} entries',styles['Body2']))
story.append(Spacer(1,15))
for cat,title in sections:
    story.append(Paragraph(title,styles['Section2']))
    for i,row in enumerate([r for r in rows if r['partOfSpeech']==cat],1):
        story.append(KeepTogether([Paragraph(f"{i:02}. {row['hu']}  —  {row['en']}",styles['Card2']),Paragraph(row['exampleHu'],styles['Body2']),Paragraph(row['exampleEn'],styles['Body2']),Spacer(1,13)]))
def footer(canvas,doc):
    canvas.setFont('DejaVu',8);canvas.setFillColor(colors.HexColor('#89958d'));canvas.drawString(48,28,'MAGYAR FLIP · HUNGARIAN REFERENCE');canvas.drawRightString(547,28,str(doc.page))
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(out)
