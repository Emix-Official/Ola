"""Regenerate the public CV: python -m pip install reportlab; python scripts/build-cv.py"""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/documents/olaoluwa-abiodun-cv.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
font_dir = Path('/usr/share/fonts/truetype/dejavu')
REGULAR, BOLD = 'Helvetica', 'Helvetica-Bold'
if (font_dir / 'DejaVuSans.ttf').exists():
    pdfmetrics.registerFont(TTFont('CVSans', str(font_dir / 'DejaVuSans.ttf')))
    pdfmetrics.registerFont(TTFont('CVSans-Bold', str(font_dir / 'DejaVuSans-Bold.ttf')))
    pdfmetrics.registerFontFamily('CVSans', normal='CVSans', bold='CVSans-Bold')
    REGULAR, BOLD = 'CVSans', 'CVSans-Bold'

INK = colors.HexColor('#18181b')
SECONDARY = colors.HexColor('#45454b')
GOLD = colors.HexColor('#8b6914')
styles = {
    'name': ParagraphStyle('Name', fontName=BOLD, fontSize=25, leading=30, textColor=INK, spaceAfter=5),
    'subtitle': ParagraphStyle('Subtitle', fontName=REGULAR, fontSize=10, leading=14, textColor=GOLD, spaceAfter=10),
    'contact': ParagraphStyle('Contact', fontName=REGULAR, fontSize=8.3, leading=13, textColor=SECONDARY),
    'section': ParagraphStyle('Section', fontName=BOLD, fontSize=8, leading=11, textColor=GOLD, spaceBefore=17, spaceAfter=7),
    'body': ParagraphStyle('Body', fontName=REGULAR, fontSize=9.5, leading=14.5, textColor=INK, alignment=TA_LEFT),
    'project': ParagraphStyle('Project', fontName=BOLD, fontSize=10, leading=14, textColor=INK, spaceAfter=3),
    'small': ParagraphStyle('Small', fontName=REGULAR, fontSize=8.1, leading=12, textColor=SECONDARY),
}
flow = []
def p(text, style='body'):
    return Paragraph(text, styles[style])
def section(label):
    flow.append(p(label.upper(), 'section'))
def link(label, url):
    return f'<link href="{url}" color="#8b6914">{label}</link>'
def project(name, status, url, description):
    title = f'{link(name, url)} <font name="{REGULAR}" size="8" color="#45454b"> / {status}</font>'
    flow.append(KeepTogether([p(title, 'project'), p(description), Spacer(1, 10)]))

flow.extend([
    p('Olaoluwa Abiodun', 'name'),
    p('Software engineering student  /  Creative developer', 'subtitle'),
    p(f'{link("laoluwaabiodun1@gmail.com", "mailto:laoluwaabiodun1@gmail.com")}  ·  +234 701 596 2937  ·  Lagos, Nigeria', 'contact'),
    p(f'{link("Portfolio: ola-two-nu.vercel.app", "https://ola-two-nu.vercel.app/")}  ·  {link("GitHub: Emix-Official", "https://github.com/Emix-Official")}  ·  {link("LinkedIn", "https://www.linkedin.com/in/olaoluwa-abiodun-673868368/")}', 'contact'),
])
section('Profile')
flow.append(p('Software engineering student at Babcock University working across web applications, desktop experiments, and 3D animation. I learn by building useful tools and visual studies, from university timetables and document workflows to NFC interactions. I publish my work under the name MarkOS.'))
section('Selected projects')
project('Upright', 'Live web project', 'https://upright-seven.vercel.app/',
    'Created a browser-based document compiler that brings Word documents, PDFs, spreadsheets, presentations, and images into a unified document, with preview and download controls.')
project('Time Tableau', 'Live beta', 'https://timetableau-two.vercel.app/',
    'Developed a university timetable project and shaped it into a student-facing experience after sharing previews with classmates. The current beta presents class schedules, a calendar, and next-class information.')
project('NFC Bridge', 'Prototype', 'https://github.com/Emix-Official/NFC-Bridge-Desktop',
    'Exploring a phone-to-desktop bridge over USB, with the goal of mapping scanned NFC tags to configurable computer actions such as opening apps or starting a timer.')
project('SenseAid', 'University prototype · Lead developer', 'https://senseaid-site.web.app/',
    'Led development in a six-person team on an accessible education prototype. Built site-based tools and resources using HTML, TypeScript, Node.js, and Firebase.')
project('Three cars. One frame.', '3D and motion study', 'https://ola-two-nu.vercel.app/#motion',
    'Created a Blender racing scene exploring composition, lighting, camera movement, and animation. Presented the rendered film, a viewport breakdown, and an interactive 3D view in the MarkOS portfolio.')
section('Skills & tools')
flow.extend([
    p('<b>Languages:</b> JavaScript, TypeScript, Python, C, C++, C#, HTML, CSS'),
    p('<b>Web:</b> React, Vite, Next.js, Node.js, Supabase, Firebase'),
    p('<b>Creative & workflow:</b> Blender, After Effects, video editing, Unity, Git'),
])
section('Education & participation')
flow.append(p('<b>BSc Software Engineering</b> · Babcock University<br/>Current undergraduate student. Participant, Babcock University Innovation Challenge 2024.'))

def page(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(colors.HexColor('#d4a017'))
    canvas.rect(42, height-27, 48, 3, fill=1, stroke=0)
    canvas.setFont(BOLD, 8)
    canvas.setFillColor(GOLD)
    canvas.drawRightString(width-42, height-30, 'MarkOS')
    canvas.setStrokeColor(colors.HexColor('#dededc'))
    canvas.setLineWidth(.5)
    canvas.line(42, 35, width-42, 35)
    canvas.setFont(REGULAR, 7)
    canvas.setFillColor(SECONDARY)
    canvas.drawString(42, 23, 'CODE / FORM / MOTION')
    canvas.drawRightString(width-42, 23, 'Olaoluwa Abiodun')
    canvas.restoreState()

SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=42, rightMargin=42,
    topMargin=45, bottomMargin=47, title='Olaoluwa Abiodun — CV', author='Olaoluwa Abiodun',
    subject='Software engineering, web applications, 3D and motion').build(flow, onFirstPage=page, onLaterPages=page)
print(OUT)
