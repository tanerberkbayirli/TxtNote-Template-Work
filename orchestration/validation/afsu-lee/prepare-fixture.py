"""Apply the AFSU LEE source-specific content to the generic fixture."""
import json
import sys
from pathlib import Path

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name("master-fixture.json")
degree = sys.argv[2] if len(sys.argv) > 2 else "master"
doc = json.loads(path.read_text(encoding="utf-8"))
thesis = doc["researchData"]["thesis"]
values = thesis["values"]
values.update({
    "THESIS_TITLE_EN": "EXAMINING THE DIGITAL LITERACY LEVELS OF PRE-SERVICE TEACHERS IN ONLINE LEARNING ENVIRONMENTS",
    "STUDENT_NAME": "Çağrı Şükrü ÖZDOĞAN",
    "DEPARTMENT_NAME": "Eğitim Bilimleri",
    "PROGRAM_NAME": "Eğitim Programları ve Öğretim",
    "ADVISOR_TITLE": "Prof. Dr.",
    "ADVISOR_NAME": "Ayşe YILMAZ",
    "CO_ADVISOR_TITLE": "",
    "CO_ADVISOR_NAME": "",
    "CITY": "Afyonkarahisar",
    "YEAR": "2026",
    "BAP_SUPPORT_NOTE": "",
    "KEYWORDS": "Dijital okuryazarlık, eğitim, güvenlik, öğretmen adayları",
    "KEYWORDS_EN": "Digital literacy, education, online learning, pre-service teachers",
    "JURY_CHAIR_TITLE": "Prof. Dr.",
    "JURY_CHAIR_NAME": "Mehmet DEMİR",
    "JURY_CHAIR_AFFILIATION": "Afyonkarahisar Sağlık Bilimleri Üniversitesi, Eğitim Bilimleri Anabilim Dalı",
    "JURY_MEMBER_1_TITLE": "Doç. Dr.",
    "JURY_MEMBER_1_NAME": "Ayşe YILMAZ",
    "JURY_MEMBER_1_AFFILIATION": "Afyonkarahisar Sağlık Bilimleri Üniversitesi, Eğitim Bilimleri Anabilim Dalı",
    "JURY_MEMBER_2_TITLE": "Dr. Öğr. Üyesi",
    "JURY_MEMBER_2_NAME": "Selin KAYA",
    "JURY_MEMBER_2_AFFILIATION": "Anadolu Üniversitesi, Eğitim Bilimleri Bölümü",
    "JURY_MEMBER_3_TITLE": "",
    "JURY_MEMBER_3_NAME": "",
    "JURY_MEMBER_3_AFFILIATION": "",
    "JURY_MEMBER_4_TITLE": "",
    "JURY_MEMBER_4_NAME": "",
    "JURY_MEMBER_4_AFFILIATION": "",
    "JURY_DECISION": "Oy birliği ile kabul edilmiştir.",
    "DEFENSE_DATE": "15 / 01 / 2026",
    "INSTITUTE_DIRECTOR_DATE": "20 / 01 / 2026",
    "INSTITUTE_DIRECTOR": "Prof. Dr. Ahmet YILDIZ",
})
if degree == "phd":
    values.update({
        "JURY_MEMBER_3_TITLE": "Doç. Dr.",
        "JURY_MEMBER_3_NAME": "Burak AKIN",
        "JURY_MEMBER_3_AFFILIATION": "Afyonkarahisar Sağlık Bilimleri Üniversitesi, Eğitim Bilimleri Anabilim Dalı",
        "JURY_MEMBER_4_TITLE": "Dr. Öğr. Üyesi",
        "JURY_MEMBER_4_NAME": "Deniz ARSLAN",
        "JURY_MEMBER_4_AFFILIATION": "Anadolu Üniversitesi, Eğitim Bilimleri Bölümü",
    })

# The source requires thesis titles in uppercase on the abstract title page.
# Four paragraphs follow in the editable abstract sections: purpose, method,
# findings and conclusion. Existing copy is already longer than 250 words.
intro = (
    "<p>Bu bölüm, araştırmanın amacı ve kapsamını tanıtır; temel kavramları ve "
    "çalışmanın önemini açıklar.</p>"
    "<p>Girişte problem durumu, araştırmanın gerekçesi ve izlenen yaklaşım "
    "özetlenerek okuyucuya sonraki bölümlerin bağlamı sunulur.</p>"
)
if not doc["content"].startswith(intro):
    doc["content"] = intro + doc["content"]
# H3/H4 preserve sentence case rather than applying an unsupported global
# title-case transform. The fixture's sample heading text reflects that rule.
doc["content"] = doc["content"].replace("<h3>Alt Başlık", "<h3>Alt başlık").replace("<h4>Alt Başlık", "<h4>Alt başlık")
path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"prepared AFSU LEE {degree} fixture with 4-paragraph abstracts and introduction prose")
