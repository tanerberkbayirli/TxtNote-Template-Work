// Generated from official source by spec2template.mjs; review the mapping inventory.
export default {
  "schemaVersion": 1,
  "templateVersion": "1.0.0",
  "id": "adu-sagbil-master-tr-v1",
  "universityId": "adu",
  "universityName": "Aydın Adnan Menderes Üniversitesi",
  "instituteId": "saglik-bilimleri-enstitusu",
  "instituteName": "Sağlık Bilimleri Enstitüsü",
  "degreeType": "master",
  "language": "tr",
  "status": "official",
  "source": {
    "type": "official",
    "documentName": "ADU_Saglik_Bilimleri_Tez_Sablonu_2026.docx",
    "verifiedAt": "2026-10-07",
    "notes": [
      "Source-derived Phase 4 pilot. XML/example structure has precedence; unresolved source properties are retained in the mapping inventory. Fixed-page text nodes remain editable in layout and Word; long replacement text needs layout review."
    ]
  },
  "page": {
    "size": "A4",
    "widthMm": 210.008611,
    "heightMm": 297.003611,
    "orientation": "portrait",
    "margins": {
      "topMm": 25.011944,
      "bottomMm": 25.011944,
      "leftMm": 30.00375,
      "rightMm": 20.0025
    },
    "header": {
      "heightMm": 0,
      "distanceMm": 12.505972
    },
    "footer": {
      "heightMm": 0,
      "distanceMm": 12.505972
    },
    "numbering": {
      "enabled": true,
      "position": "bottom",
      "align": "right",
      "format": "arabic",
      "startAt": 1,
      "restart": true,
      "style": {
        "fontFamily": "Times New Roman",
        "fontSizePt": 12
      },
      "baselineFromTopMm": 278.714
    }
  },
  "typography": {
    "body": {
      "fontFamily": "Times New Roman",
      "fontSizePt": 12,
      "align": "justify",
      "spaceAfterPt": 6,
      "lineSpacing": {
        "rule": "auto",
        "value": 1.5
      },
      "lineHeight": 1.5,
      "firstLineIndentMm": 10.001249999999999
    },
    "paragraph": {
      "fontFamily": "Times New Roman",
      "fontSizePt": 12,
      "align": "justify",
      "spaceAfterPt": 6,
      "lineSpacing": {
        "rule": "auto",
        "value": 1.5
      },
      "lineHeight": 1.5,
      "firstLineIndentMm": 10.001249999999999
    },
    "headings": {
      "1": {
        "fontFamily": "Times New Roman",
        "fontSizePt": 14,
        "fontWeight": 700,
        "align": "center",
        "spaceAfterPt": 41.396484375,
        "lineSpacing": {
          "rule": "auto",
          "value": 1.5
        },
        "lineHeight": 1.5,
        "firstLineIndentMm": 0,
        "numbering": {
          "enabled": true,
          "format": "{1}."
        },
        "pageBreakBefore": true
      },
      "2": {
        "fontFamily": "Times New Roman",
        "fontSizePt": 12,
        "fontWeight": 700,
        "align": "justify",
        "spaceAfterPt": 26.6982421875,
        "lineSpacing": {
          "rule": "auto",
          "value": 1.5
        },
        "lineHeight": 1.5,
        "firstLineIndentMm": 0,
        "numbering": {
          "enabled": true,
          "format": "{1}.{2}."
        }
      },
      "3": {
        "fontFamily": "Times New Roman",
        "fontSizePt": 12,
        "fontWeight": 700,
        "align": "justify",
        "spaceAfterPt": 26.6982421875,
        "lineSpacing": {
          "rule": "auto",
          "value": 1.5
        },
        "lineHeight": 1.5,
        "firstLineIndentMm": 0,
        "numbering": {
          "enabled": true,
          "format": "{1}.{2}.{3}."
        }
      },
      "4": {
        "fontFamily": "Times New Roman",
        "fontSizePt": 12,
        "fontWeight": 700,
        "align": "justify",
        "spaceAfterPt": 26.6982421875,
        "lineSpacing": {
          "rule": "auto",
          "value": 1.5
        },
        "lineHeight": 1.5,
        "firstLineIndentMm": 0,
        "numbering": {
          "enabled": true,
          "format": "{1}.{2}.{3}.{4}."
        }
      }
    },
    "paragraphStyles": {
      "sourceTable": {
        "fontFamily": "Times New Roman",
        "fontSizePt": 12,
        "align": "justify",
        "spaceAfterPt": 6,
        "lineSpacing": {
          "rule": "auto",
          "value": 1.5
        },
        "lineHeight": 1.5,
        "firstLineIndentMm": 10.001249999999999,
        "fontWeight": 400
      }
    },
    "lineSpacing": {
      "mode": "word",
      "singleLineEm": 1.14990234375,
      "baseline": "word",
      "paragraphSpacing": "additive"
    }
  },
  "placeholders": {},
  "sections": [
    {
      "id": "cover",
      "type": "outerCover",
      "title": "KAPAK",
      "status": "required",
      "group": "cover",
      "mode": "static",
      "tocEntry": "none",
      "blocks": [
        {
          "id": "cover-l1-w1",
          "type": "text",
          "value": "T.C.",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 106.02030512491861,
          "yMm": 25.003770955403645,
          "widthMm": 9.005228424072271,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l2-w1",
          "type": "text",
          "value": "AYDIN",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 66.69263996548122,
          "yMm": 34.4088385687934,
          "widthMm": 14.855700344509543,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l2-w2",
          "type": "text",
          "value": "ADNAN",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 81.59396985371907,
          "yMm": 34.4088385687934,
          "widthMm": 16.295034323798276,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l2-w3",
          "type": "text",
          "value": "MENDERES",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 97.93040271335177,
          "yMm": 34.4088385687934,
          "widthMm": 25.011465030246313,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l2-w4",
          "type": "text",
          "value": "ÜNİVERSİTESİ",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 123.0213668823242,
          "yMm": 34.4088385687934,
          "widthMm": 31.33606821695963,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l3-w1",
          "type": "text",
          "value": "SAĞLIK",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 77.06430447896321,
          "yMm": 43.84917534722222,
          "widthMm": 17.488835271199548,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l3-w2",
          "type": "text",
          "value": "BİLİMLERİ",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 94.61147308349608,
          "yMm": 43.84917534722222,
          "widthMm": 24.283311801486548,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l3-w3",
          "type": "text",
          "value": "ENSTİTÜSÜ",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 118.90655559963649,
          "yMm": 43.84917534722222,
          "widthMm": 25.032630835639097,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l4-w1",
          "type": "text",
          "value": "VETERİNERLİK",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 55.971723514133025,
          "yMm": 53.24715898301866,
          "widthMm": 33.94803195529513,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l4-w2",
          "type": "text",
          "value": "FARMAKOLOJİ",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 90.01830490960015,
          "yMm": 53.24715898301866,
          "widthMm": 33.19872907002767,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l4-w3",
          "type": "text",
          "value": "VE",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 123.27536731296114,
          "yMm": 53.24715898301866,
          "widthMm": 6.880099741617855,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l4-w4",
          "type": "text",
          "value": "TOKSİKOLOJİSİ",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 130.22650417751734,
          "yMm": 53.24715898301866,
          "widthMm": 34.88854302300348,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l5-w1",
          "type": "text",
          "value": "YÜKSEK",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 80.40863630506726,
          "yMm": 62.68749576144748,
          "widthMm": 18.890057881673187,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l5-w2",
          "type": "text",
          "value": "LİSANS",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 99.35702752007377,
          "yMm": 62.68749576144748,
          "widthMm": 16.30773273044163,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l5-w3",
          "type": "text",
          "value": "PROGRAMI",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 115.73579737345376,
          "yMm": 62.68749576144748,
          "widthMm": 24.909867011176217,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l6-w1",
          "type": "text",
          "value": "RATLARDA",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 63.76105749342176,
          "yMm": 101.30100877549913,
          "widthMm": 32.95214636060926,
          "heightMm": 7.490559895833333,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 16,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l6-w2",
          "type": "text",
          "value": "DENEYSEL",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 97.12078374226887,
          "yMm": 101.30100877549913,
          "widthMm": 31.39818759494358,
          "heightMm": 7.490559895833333,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 16,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l6-w3",
          "type": "text",
          "value": "AFLATOKSİN",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 128.97202648586696,
          "yMm": 101.30100877549913,
          "widthMm": 38.3065945095486,
          "heightMm": 7.490559895833333,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 16,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l7-w1",
          "type": "text",
          "value": "TOKSİKASYONUNDA",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 58.34239061143663,
          "yMm": 111.03768836127387,
          "widthMm": 59.26835335625542,
          "heightMm": 7.490559895833333,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 16,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l7-w2",
          "type": "text",
          "value": "VİTAMİNLERİN",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 118.0923611111111,
          "yMm": 111.03768836127387,
          "widthMm": 44.56754955715601,
          "heightMm": 7.490559895833333,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 16,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l8-w1",
          "type": "text",
          "value": "ETKİLERİNİN",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 72.15363845825195,
          "yMm": 122.8910130818685,
          "widthMm": 39.196193525526255,
          "heightMm": 7.490559895833333,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 16,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l8-w2",
          "type": "text",
          "value": "ARAŞTIRILMASI",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 111.79119533962673,
          "yMm": 122.8910130818685,
          "widthMm": 47.06177715725367,
          "heightMm": 7.490559895833333,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 16,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l9-w1",
          "type": "text",
          "value": "CEYDA",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 91.49997049967448,
          "yMm": 156.6851389567057,
          "widthMm": 16.03679750230576,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l9-w2",
          "type": "text",
          "value": "AKBULUT",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 107.58663931952582,
          "yMm": 156.6851389567057,
          "widthMm": 21.949345737033426,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l10-w1",
          "type": "text",
          "value": "YÜKSEK",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 87.30897416008843,
          "yMm": 166.08314412434893,
          "widthMm": 18.890052498711484,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l10-w2",
          "type": "text",
          "value": "LİSANS",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 106.25735999213323,
          "yMm": 166.08314412434893,
          "widthMm": 16.30773273044163,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l10-w3",
          "type": "text",
          "value": "TEZİ",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 122.62202648586695,
          "yMm": 166.08314412434893,
          "widthMm": 11.104949527316634,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l11-w1",
          "type": "text",
          "value": "DANIŞMAN",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 98.40030297173394,
          "yMm": 197.40980648464623,
          "widthMm": 24.249463738335493,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l12-w1",
          "type": "text",
          "value": "Prof.",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 88.70597114562987,
          "yMm": 206.85014326307507,
          "widthMm": 10.029697545369473,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l12-w2",
          "type": "text",
          "value": "Dr.",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 98.78130900065104,
          "yMm": 206.85014326307507,
          "widthMm": 6.968993971082895,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l12-w3",
          "type": "text",
          "value": "Onur",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 105.80863630506727,
          "yMm": 206.85014326307507,
          "widthMm": 10.914468044704861,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l12-w4",
          "type": "text",
          "value": "DEMİR",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 116.78002734714083,
          "yMm": 206.85014326307507,
          "widthMm": 15.566897243923606,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l13-w1",
          "type": "text",
          "value": "Bu",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 233.2767171223958,
          "widthMm": 5.948766623602971,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l13-w2",
          "type": "text",
          "value": "tez",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 36.66066602071126,
          "yMm": 233.2767171223958,
          "widthMm": 5.936068216959633,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l13-w3",
          "type": "text",
          "value": "Aydın",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 43.27172351413302,
          "yMm": 233.2767171223958,
          "widthMm": 11.583333333333336,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l13-w4",
          "type": "text",
          "value": "Adnan",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 55.54839125739203,
          "yMm": 233.2767171223958,
          "widthMm": 12.298766623602965,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l13-w5",
          "type": "text",
          "value": "Menderes",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 68.5362559000651,
          "yMm": 233.2767171223958,
          "widthMm": 17.670865503946942,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l13-w6",
          "type": "text",
          "value": "Üniversitesi",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 86.93855103386772,
          "yMm": 233.2767171223958,
          "widthMm": 21.442771360609257,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l13-w7",
          "type": "text",
          "value": "Bilimsel",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 109.07465142144096,
          "yMm": 233.2767171223958,
          "widthMm": 15.432140180799692,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l13-w8",
          "type": "text",
          "value": "Araştırma",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 125.20012062920463,
          "yMm": 233.2767171223958,
          "widthMm": 17.90793652004666,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l13-w9",
          "type": "text",
          "value": "Projeleri",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 143.77598936292858,
          "yMm": 233.2767171223958,
          "widthMm": 15.600766838921459,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l13-w10",
          "type": "text",
          "value": "Birimi",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 160.09972381591794,
          "yMm": 233.2767171223958,
          "widthMm": 12.06592661539716,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l13-w11",
          "type": "text",
          "value": "tarafından",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 172.8716832478841,
          "yMm": 233.2767171223958,
          "widthMm": 18.102681308322474,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l14-w1",
          "type": "text",
          "value": "………….",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 240.60038723415795,
          "widthMm": 18.99166935814751,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l14-w2",
          "type": "text",
          "value": "proje",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 49.071391042073564,
          "yMm": 240.60038723415795,
          "widthMm": 9.699501291910806,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l14-w3",
          "type": "text",
          "value": "numarası",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 58.80805986192491,
          "yMm": 240.60038723415795,
          "widthMm": 16.52363255818684,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l14-w4",
          "type": "text",
          "value": "ile",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 75.39002575344509,
          "yMm": 240.60038723415795,
          "widthMm": 5.246031739976672,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l14-w5",
          "type": "text",
          "value": "desteklenmiştir.",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 80.6943908267551,
          "yMm": 240.60038723415795,
          "widthMm": 27.934580103556314,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "cover-l15-w1",
          "type": "text",
          "value": "AYDIN–2024",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 97.80763888888887,
          "yMm": 264.6019799126519,
          "widthMm": 25.433392333984372,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        }
      ],
      "overrides": {
        "page": {
          "numbering": {
            "enabled": false
          }
        }
      }
    },
    {
      "id": "approval",
      "type": "approval",
      "title": "KABUL VE ONAY",
      "status": "required",
      "group": "front",
      "mode": "static",
      "tocEntry": "title",
      "blocks": [
        {
          "id": "approval-l1-w1",
          "type": "text",
          "value": "KABUL",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 94.29397523668077,
          "yMm": 25.02945844862196,
          "widthMm": 18.5979999118381,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l1-w2",
          "type": "text",
          "value": "VE",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 113.07574225531683,
          "yMm": 25.02945844862196,
          "widthMm": 7.894572703043622,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l1-w3",
          "type": "text",
          "value": "ONAY",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 121.20856840345594,
          "yMm": 25.02945844862196,
          "widthMm": 15.522186364067906,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l2-w1",
          "type": "text",
          "value": "T.C.",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 54.47484029134114,
          "widthMm": 8.52686614990234,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l2-w2",
          "type": "text",
          "value": "Aydın",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 38.69972114562988,
          "yMm": 54.47484029134114,
          "widthMm": 11.583333333333329,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l2-w3",
          "type": "text",
          "value": "Adnan",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 50.426056416829425,
          "yMm": 54.47484029134114,
          "widthMm": 12.260666020711263,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l2-w4",
          "type": "text",
          "value": "Menderes",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 62.863588587443026,
          "yMm": 54.47484029134114,
          "widthMm": 17.670870886908638,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l2-w5",
          "type": "text",
          "value": "Üniversitesi",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 80.71979302300346,
          "yMm": 54.47484029134114,
          "widthMm": 21.442765977647568,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l2-w6",
          "type": "text",
          "value": "Sağlık",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 102.30555555555554,
          "yMm": 54.47484029134114,
          "widthMm": 11.828871748182507,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l2-w7",
          "type": "text",
          "value": "Bilimleri",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 114.31552446153428,
          "yMm": 54.47484029134114,
          "widthMm": 16.30350172254775,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l2-w8",
          "type": "text",
          "value": "Enstitüsü",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 130.76626451280382,
          "yMm": 54.47484029134114,
          "widthMm": 16.77340198092989,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l2-w9",
          "type": "text",
          "value": "Veterinerlik",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 147.76802605523002,
          "yMm": 54.47484029134114,
          "widthMm": 21.415237511528858,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l2-w10",
          "type": "text",
          "value": "Farmakoloji",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 169.3262816535102,
          "yMm": 54.47484029134114,
          "widthMm": 21.684062618679462,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l3-w1",
          "type": "text",
          "value": "ve",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 61.79851040310329,
          "widthMm": 4.996267700195311,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l3-w2",
          "type": "text",
          "value": "Toksikolojisi",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 35.98756703270806,
          "yMm": 61.79851040310329,
          "widthMm": 23.388693173726402,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l3-w3",
          "type": "text",
          "value": "Anabilim",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 60.33205706278483,
          "yMm": 61.79851040310329,
          "widthMm": 16.94696481492784,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l3-w4",
          "type": "text",
          "value": "Dalı",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 78.27291933695474,
          "yMm": 61.79851040310329,
          "widthMm": 8.264398320515951,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l3-w5",
          "type": "text",
          "value": "Yüksek",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 87.56297459072536,
          "yMm": 61.79851040310329,
          "widthMm": 13.911663436889654,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l3-w6",
          "type": "text",
          "value": "Lisans",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 102.46006808810763,
          "yMm": 61.79851040310329,
          "widthMm": 12.053233591715497,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l3-w7",
          "type": "text",
          "value": "Programı",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 115.45216912163627,
          "yMm": 61.79851040310329,
          "widthMm": 16.726839362250445,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l3-w8",
          "type": "text",
          "value": "çerçevesinde",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 133.17714233398436,
          "yMm": 61.79851040310329,
          "widthMm": 22.801662360297314,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l3-w9",
          "type": "text",
          "value": "Ceyda",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 157.04960852728948,
          "yMm": 61.79851040310329,
          "widthMm": 11.807695176866332,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l3-w10",
          "type": "text",
          "value": "AKBULUT",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 169.8257989671495,
          "yMm": 61.79851040310329,
          "widthMm": 21.209909820556646,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l4-w1",
          "type": "text",
          "value": "tarafından",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 69.07982737223307,
          "widthMm": 18.102673233879933,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l4-w2",
          "type": "text",
          "value": "hazırlanan",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 47.96790542602539,
          "yMm": 69.07982737223307,
          "widthMm": 18.60643501281738,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l4-w3",
          "type": "text",
          "value": "“Ratlarda",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 66.41677394443087,
          "yMm": 69.07982737223307,
          "widthMm": 17.252464040120444,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l4-w4",
          "type": "text",
          "value": "Deneysel",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 83.44393768310546,
          "yMm": 69.07982737223307,
          "widthMm": 16.735301378038187,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l4-w5",
          "type": "text",
          "value": "Aflatoksin",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 100.03013458251952,
          "yMm": 69.07982737223307,
          "widthMm": 18.902772437201605,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l4-w6",
          "type": "text",
          "value": "Toksikasyonunda",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 118.73723992241753,
          "yMm": 69.07982737223307,
          "widthMm": 30.866167958577478,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l4-w7",
          "type": "text",
          "value": "Vitaminlerin",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 149.4289065890842,
          "yMm": 69.07982737223307,
          "widthMm": 22.657743496365015,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l4-w8",
          "type": "text",
          "value": "Etkilerinin",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 171.89944500393335,
          "yMm": 69.07982737223307,
          "widthMm": 19.110188717312298,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l5-w1",
          "type": "text",
          "value": "Araştırılması”",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 76.36116587320963,
          "widthMm": 24.976193173726394,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l5-w2",
          "type": "text",
          "value": "başlıklı",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 54.8710585700141,
          "yMm": 76.36116587320963,
          "widthMm": 13.467165374755865,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l5-w3",
          "type": "text",
          "value": "tez,",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 68.23992385864257,
          "yMm": 76.36116587320963,
          "widthMm": 7.007099956936315,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l5-w4",
          "type": "text",
          "value": "aşağıdaki",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 75.13602532280815,
          "yMm": 76.36116587320963,
          "widthMm": 16.95967398749457,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l5-w5",
          "type": "text",
          "value": "jüri",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 91.9846954345703,
          "yMm": 76.36116587320963,
          "widthMm": 6.88009974161784,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l5-w6",
          "type": "text",
          "value": "tarafından",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 98.758033074273,
          "yMm": 76.36116587320963,
          "widthMm": 18.140771145290785,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l5-w7",
          "type": "text",
          "value": "Yüksek",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 116.82590094672308,
          "yMm": 76.36116587320963,
          "widthMm": 13.911668819851329,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l5-w8",
          "type": "text",
          "value": "Lisans",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 130.626565890842,
          "yMm": 76.36116587320963,
          "widthMm": 12.053233591715497,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l5-w9",
          "type": "text",
          "value": "Tezi",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 142.56456459893118,
          "yMm": 76.36116587320963,
          "widthMm": 8.484534539116765,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l5-w10",
          "type": "text",
          "value": "olarak",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 150.9465680440267,
          "yMm": 76.36116587320963,
          "widthMm": 11.617202928331153,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l5-w11",
          "type": "text",
          "value": "kabul",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 162.45276709662542,
          "yMm": 76.36116587320963,
          "widthMm": 10.389532385932057,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l5-w12",
          "type": "text",
          "value": "edilmiştir.",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 172.73976838853622,
          "yMm": 76.36116587320963,
          "widthMm": 18.314328596327044,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l6-w1",
          "type": "text",
          "value": "Tez",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 131.00402993096245,
          "yMm": 95.21007995605468,
          "widthMm": 7.324603186713318,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l6-w2",
          "type": "text",
          "value": "Savunma",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 138.37003165351018,
          "yMm": 95.21007995605468,
          "widthMm": 16.75223617553712,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l6-w3",
          "type": "text",
          "value": "Tarihi:",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 155.18060116238064,
          "yMm": 95.21007995605468,
          "widthMm": 12.531595865885407,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l6-w4",
          "type": "text",
          "value": "06/02/2024",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 168.8606124030219,
          "yMm": 95.21007995605468,
          "widthMm": 20.30400043063696,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w1",
          "type": "text",
          "value": "Üye",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 31.927799224853512,
          "yMm": 119.34008856879339,
          "widthMm": 8.052734883626304,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w2",
          "type": "text",
          "value": "(T.D.)",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 40.012054909600145,
          "yMm": 119.34008856879339,
          "widthMm": 11.591800732082795,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w3",
          "type": "text",
          "value": ":",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 56.522055986192484,
          "yMm": 119.34008856879339,
          "widthMm": 2.176866149902345,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w4",
          "type": "text",
          "value": "..….",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 58.76572286817762,
          "yMm": 119.34008856879339,
          "widthMm": 8.408333333333331,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w5",
          "type": "text",
          "value": "(ünvan,",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 67.23238953484429,
          "yMm": 119.34008856879339,
          "widthMm": 13.784668604532882,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w6",
          "type": "text",
          "value": "adı",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 81.07539147271049,
          "yMm": 119.34008856879339,
          "widthMm": 6.156199052598751,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w7",
          "type": "text",
          "value": "soyadı)",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 87.28992385864257,
          "yMm": 119.34008856879339,
          "widthMm": 13.507376098632818,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w8",
          "type": "text",
          "value": "…….",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 100.85563329060871,
          "yMm": 119.34008856879339,
          "widthMm": 10.525000000000006,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w9",
          "type": "text",
          "value": "……",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 120.08203294542099,
          "yMm": 119.34008856879339,
          "widthMm": 9.466666666666669,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w10",
          "type": "text",
          "value": "(üniversite)",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 129.607032945421,
          "yMm": 119.34008856879339,
          "widthMm": 20.48179965549045,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w11",
          "type": "text",
          "value": "……",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 150.14716593424478,
          "yMm": 119.34008856879339,
          "widthMm": 9.466666666666669,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w12",
          "type": "text",
          "value": "…",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 163.86527777777775,
          "yMm": 119.34008856879339,
          "widthMm": 5.2333333333333485,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w13",
          "type": "text",
          "value": "(imza)",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 169.15694444444443,
          "yMm": 119.34008856879339,
          "widthMm": 12.019363996717658,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l7-w14",
          "type": "text",
          "value": "…",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 181.23463100857202,
          "yMm": 119.34008856879339,
          "widthMm": 5.2333333333333485,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l8-w1",
          "type": "text",
          "value": "Üye",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 31.927799224853512,
          "yMm": 128.7804145812988,
          "widthMm": 8.052734883626304,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l8-w2",
          "type": "text",
          "value": ":",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 56.522055986192484,
          "yMm": 128.7804145812988,
          "widthMm": 2.176866149902345,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l8-w3",
          "type": "text",
          "value": "..….",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 58.757255469428166,
          "yMm": 128.7804145812988,
          "widthMm": 8.408333333333324,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l8-w4",
          "type": "text",
          "value": "(ünvan,",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 67.22392213609483,
          "yMm": 128.7804145812988,
          "widthMm": 13.803718905978727,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l8-w5",
          "type": "text",
          "value": "adı",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 81.08597437540689,
          "yMm": 128.7804145812988,
          "widthMm": 6.156199052598737,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l8-w6",
          "type": "text",
          "value": "soyadı)",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 87.30050676133897,
          "yMm": 128.7804145812988,
          "widthMm": 13.49679319593642,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l8-w7",
          "type": "text",
          "value": "…….",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 100.85563329060871,
          "yMm": 128.7804145812988,
          "widthMm": 10.525000000000006,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l8-w8",
          "type": "text",
          "value": "……",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 120.08203294542099,
          "yMm": 128.7804145812988,
          "widthMm": 9.466666666666669,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l8-w9",
          "type": "text",
          "value": "(üniversite)",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 129.607032945421,
          "yMm": 128.7804145812988,
          "widthMm": 20.48179965549045,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l8-w10",
          "type": "text",
          "value": "……",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 150.14716593424478,
          "yMm": 128.7804145812988,
          "widthMm": 9.466666666666669,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l8-w11",
          "type": "text",
          "value": "…",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 163.86527777777775,
          "yMm": 128.7804145812988,
          "widthMm": 5.2333333333333485,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l8-w12",
          "type": "text",
          "value": "(imza)",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 169.15694444444443,
          "yMm": 128.7804145812988,
          "widthMm": 12.019363996717658,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l8-w13",
          "type": "text",
          "value": "…",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 181.23463100857202,
          "yMm": 128.7804145812988,
          "widthMm": 5.2333333333333485,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l9-w1",
          "type": "text",
          "value": "Üye",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 31.927799224853512,
          "yMm": 138.17841974894202,
          "widthMm": 8.052734883626304,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l9-w2",
          "type": "text",
          "value": ":",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 56.310387166341144,
          "yMm": 138.17841974894202,
          "widthMm": 2.176866149902338,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l9-w3",
          "type": "text",
          "value": "..….",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 58.54558664957682,
          "yMm": 138.17841974894202,
          "widthMm": 8.408333333333331,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l9-w4",
          "type": "text",
          "value": "(ünvan,",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 67.01225331624349,
          "yMm": 138.17841974894202,
          "widthMm": 13.793136003282328,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l9-w5",
          "type": "text",
          "value": "adı",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 80.86372265285915,
          "yMm": 138.17841974894202,
          "widthMm": 6.156199052598737,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l9-w6",
          "type": "text",
          "value": "soyadı)",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 87.07825503879123,
          "yMm": 138.17841974894202,
          "widthMm": 13.469286261664493,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l9-w7",
          "type": "text",
          "value": "…….",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 100.63974422878688,
          "yMm": 138.17841974894202,
          "widthMm": 10.525000000000006,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l9-w8",
          "type": "text",
          "value": "……",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 120.08203294542099,
          "yMm": 138.17841974894202,
          "widthMm": 9.466666666666669,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l9-w9",
          "type": "text",
          "value": "(üniversite)",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 129.607032945421,
          "yMm": 138.17841974894202,
          "widthMm": 20.48179965549045,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l9-w10",
          "type": "text",
          "value": "……",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 150.14716593424478,
          "yMm": 138.17841974894202,
          "widthMm": 9.466666666666669,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l9-w11",
          "type": "text",
          "value": "…",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 163.86527777777775,
          "yMm": 138.17841974894202,
          "widthMm": 5.2333333333333485,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l9-w12",
          "type": "text",
          "value": "(imza)",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 169.15694444444443,
          "yMm": 138.17841974894202,
          "widthMm": 12.019363996717658,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l9-w13",
          "type": "text",
          "value": "…",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 181.23463100857202,
          "yMm": 138.17841974894202,
          "widthMm": 5.2333333333333485,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l10-w1",
          "type": "text",
          "value": "ONAY:",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 175.90447616577146,
          "widthMm": 14.368870671590166,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l11-w1",
          "type": "text",
          "value": "Bu",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 185.3448021782769,
          "widthMm": 5.948766623602971,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l11-w2",
          "type": "text",
          "value": "tez",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 38.56566655900743,
          "yMm": 185.3448021782769,
          "widthMm": 5.936068216959633,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l11-w3",
          "type": "text",
          "value": "Aydın",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 47.081724590725365,
          "yMm": 185.3448021782769,
          "widthMm": 11.583333333333329,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l11-w4",
          "type": "text",
          "value": "Adnan",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 61.26339018079969,
          "yMm": 185.3448021782769,
          "widthMm": 12.26066602071127,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l11-w5",
          "type": "text",
          "value": "Menderes",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 76.11815745035807,
          "yMm": 185.3448021782769,
          "widthMm": 17.632759518093522,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l11-w6",
          "type": "text",
          "value": "Üniversitesi",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 96.34925460815428,
          "yMm": 185.3448021782769,
          "widthMm": 21.480866580539285,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l11-w7",
          "type": "text",
          "value": "Lisansüstü",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 120.42845882839626,
          "yMm": 185.3448021782769,
          "widthMm": 19.110199483235675,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l11-w8",
          "type": "text",
          "value": "Eğitim-Öğretim",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 142.1412269592285,
          "yMm": 185.3448021782769,
          "widthMm": 28.045345306396484,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l11-w9",
          "type": "text",
          "value": "ve",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 172.78914091322156,
          "yMm": 185.3448021782769,
          "widthMm": 4.996267700195318,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l11-w10",
          "type": "text",
          "value": "Sınav",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 180.36256968180336,
          "yMm": 185.3448021782769,
          "widthMm": 10.656236606174048,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l12-w1",
          "type": "text",
          "value": "Yönetmeliğinin",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 192.62614067925344,
          "widthMm": 27.572627067565918,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l12-w2",
          "type": "text",
          "value": "ilgili",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 57.73419130113389,
          "yMm": 192.62614067925344,
          "widthMm": 9.026394229465069,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l12-w3",
          "type": "text",
          "value": "maddeleri",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 66.86548686557346,
          "yMm": 192.62614067925344,
          "widthMm": 17.882534323798282,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l12-w4",
          "type": "text",
          "value": "uyarınca",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 84.89525413513182,
          "yMm": 192.62614067925344,
          "widthMm": 15.57536464267308,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l12-w5",
          "type": "text",
          "value": "yukarıdaki",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 100.59244952731662,
          "yMm": 192.62614067925344,
          "widthMm": 19.105968475341797,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l12-w6",
          "type": "text",
          "value": "jüri",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 119.8456563313802,
          "yMm": 192.62614067925344,
          "widthMm": 6.88009974161784,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l12-w7",
          "type": "text",
          "value": "tarafından",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 126.86875262790255,
          "yMm": 192.62614067925344,
          "widthMm": 18.102670542399096,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l12-w8",
          "type": "text",
          "value": "uygun",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 145.11018871731227,
          "yMm": 192.62614067925344,
          "widthMm": 11.583333333333343,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l12-w9",
          "type": "text",
          "value": "görülmüş",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 156.87038820054795,
          "yMm": 192.62614067925344,
          "widthMm": 16.993532816569,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l12-w10",
          "type": "text",
          "value": "ve",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 174.01115934583873,
          "yMm": 192.62614067925344,
          "widthMm": 4.996267700195318,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l12-w11",
          "type": "text",
          "value": "Sağlık",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 179.12925779554578,
          "yMm": 192.62614067925344,
          "widthMm": 11.828893280029291,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l13-w1",
          "type": "text",
          "value": "Bilimleri",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 199.94981079101558,
          "widthMm": 16.303504414028588,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l13-w2",
          "type": "text",
          "value": "Enstitüsünün",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 48.88653475443522,
          "yMm": 199.94981079101558,
          "widthMm": 23.089532385932074,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l13-w3",
          "type": "text",
          "value": "……………..……..…",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 74.4897307925754,
          "yMm": 199.94981079101558,
          "widthMm": 39.099994617038305,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l13-w4",
          "type": "text",
          "value": "tarih",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 116.14148966471353,
          "yMm": 199.94981079101558,
          "widthMm": 8.738534969753687,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l13-w5",
          "type": "text",
          "value": "ve",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 127.4402616712782,
          "yMm": 199.94981079101558,
          "widthMm": 4.996267700195318,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l13-w6",
          "type": "text",
          "value": "…………………………",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 134.97135882907443,
          "yMm": 199.94981079101558,
          "widthMm": 43.333333333333314,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l13-w7",
          "type": "text",
          "value": "sayılı",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 180.85646718343096,
          "yMm": 199.94981079101558,
          "widthMm": 10.173643324110259,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l14-w1",
          "type": "text",
          "value": "oturumunda",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 207.23114929199215,
          "widthMm": 21.45970346662733,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l14-w2",
          "type": "text",
          "value": "alınan",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 51.540835486518006,
          "yMm": 207.23114929199215,
          "widthMm": 11.312398105197481,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l14-w3",
          "type": "text",
          "value": "……………………",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 62.911566925048824,
          "yMm": 207.23114929199215,
          "widthMm": 34.90476726955837,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l14-w4",
          "type": "text",
          "value": "nolu",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 97.87466752794053,
          "yMm": 207.23114929199215,
          "widthMm": 8.526866149902347,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l14-w5",
          "type": "text",
          "value": "Yönetim",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 106.4598670111762,
          "yMm": 207.23114929199215,
          "widthMm": 15.832890913221576,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l14-w6",
          "type": "text",
          "value": "Kurulu",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 122.36379504733614,
          "yMm": 207.23114929199215,
          "widthMm": 12.971868303087035,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l14-w7",
          "type": "text",
          "value": "kararıyla",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 135.3939966837565,
          "yMm": 207.23114929199215,
          "widthMm": 16.00716968112519,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l14-w8",
          "type": "text",
          "value": "kabul",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 151.44679590861,
          "yMm": 207.23114929199215,
          "widthMm": 10.46573359171552,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l14-w9",
          "type": "text",
          "value": "edilmiştir.",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 161.97086283365883,
          "yMm": 207.23114929199215,
          "widthMm": 18.31857037014433,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l15-w1",
          "type": "text",
          "value": "Prof.",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 140.3173611111111,
          "yMm": 235.52037862141924,
          "widthMm": 9.335440826416004,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l15-w2",
          "type": "text",
          "value": "Dr.",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 149.71113527086044,
          "yMm": 235.52037862141924,
          "widthMm": 6.5033354865180115,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l15-w3",
          "type": "text",
          "value": "Süleyman",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 156.2728040907118,
          "yMm": 235.52037862141924,
          "widthMm": 17.97567571004231,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l15-w4",
          "type": "text",
          "value": "AYPAK",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 174.30681313408743,
          "yMm": 235.52037862141924,
          "widthMm": 15.562666236029742,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l16-w1",
          "type": "text",
          "value": "Enstitü",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 153.31369315253363,
          "yMm": 244.91838378906246,
          "widthMm": 13.009968905978724,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "approval-l16-w2",
          "type": "text",
          "value": "Müdürü",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 166.34812579684785,
          "yMm": 244.91838378906246,
          "widthMm": 14.639800516764325,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        }
      ],
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "roman-lower",
            "startAt": 1,
            "restart": true
          }
        }
      }
    },
    {
      "id": "thanks",
      "type": "acknowledgements",
      "title": "TEŞEKKÜR",
      "status": "required",
      "group": "front",
      "mode": "editable",
      "showTitle": true,
      "tocEntry": "title",
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "roman-lower",
            "restart": false
          }
        },
        "headings": {
          "1": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "align": "center",
            "spaceAfterPt": 6,
            "lineSpacing": {
              "rule": "auto",
              "value": 1.5
            },
            "lineHeight": 1.5,
            "firstLineIndentMm": 0,
            "numbering": {
              "enabled": false
            },
            "pageBreakBefore": false
          }
        }
      }
    },
    {
      "id": "toc",
      "type": "tableOfContents",
      "title": "İÇİNDEKİLER",
      "status": "required",
      "group": "front",
      "mode": "generated",
      "showTitle": true,
      "tocEntry": "none",
      "generatedIndex": {
        "kind": "toc",
        "title": "İÇİNDEKİLER",
        "levels": [
          1,
          2,
          3,
          4
        ],
        "includePageNumbers": true,
        "leader": "dots",
        "style": {
          "fontFamily": "Times New Roman",
          "fontSizePt": 11,
          "fontWeight": 700,
          "align": "left",
          "spaceAfterPt": 0,
          "lineSpacing": {
            "rule": "auto",
            "value": 1.5
          },
          "lineHeight": 1.5,
          "firstLineIndentMm": 0
        }
      },
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "roman-lower",
            "restart": false
          }
        },
        "headings": {
          "1": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "align": "center",
            "spaceAfterPt": 6,
            "lineSpacing": {
              "rule": "auto",
              "value": 1.5
            },
            "lineHeight": 1.5,
            "firstLineIndentMm": 0,
            "keepWithNext": true,
            "keepLines": true,
            "numbering": {
              "enabled": false
            },
            "pageBreakBefore": false
          }
        }
      }
    },
    {
      "id": "symbols",
      "type": "listOfAbbreviations",
      "title": "SİMGELER VE KISALTMALAR DİZİNİ",
      "status": "required",
      "group": "front",
      "mode": "editable",
      "showTitle": true,
      "tocEntry": "title",
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "roman-lower",
            "restart": false
          }
        },
        "headings": {
          "1": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "align": "center",
            "spaceAfterPt": 6,
            "lineSpacing": {
              "rule": "auto",
              "value": 1.5
            },
            "lineHeight": 1.5,
            "firstLineIndentMm": 0,
            "numbering": {
              "enabled": false
            },
            "pageBreakBefore": false
          }
        }
      }
    },
    {
      "id": "figures",
      "type": "listOfFigures",
      "title": "ŞEKİLLER DİZİNİ",
      "status": "required",
      "group": "front",
      "mode": "generated",
      "showTitle": true,
      "tocEntry": "none",
      "generatedIndex": {
        "kind": "figures",
        "title": "ŞEKİLLER DİZİNİ",
        "levels": [
          1,
          2,
          3,
          4
        ],
        "includePageNumbers": true,
        "leader": "dots",
        "style": {
          "fontFamily": "Times New Roman",
          "fontSizePt": 12,
          "align": "justify",
          "spaceAfterPt": 6,
          "lineSpacing": {
            "rule": "auto",
            "value": 1.5
          },
          "lineHeight": 1.5,
          "firstLineIndentMm": 10.001249999999999
        }
      },
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "roman-lower",
            "restart": false
          }
        },
        "headings": {
          "1": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "align": "center",
            "spaceAfterPt": 41.396484375,
            "lineSpacing": {
              "rule": "auto",
              "value": 1.5
            },
            "lineHeight": 1.5,
            "firstLineIndentMm": 0,
            "numbering": {
              "enabled": false
            },
            "pageBreakBefore": false
          }
        }
      }
    },
    {
      "id": "photos",
      "type": "custom",
      "title": "RESİMLER DİZİNİ",
      "status": "required",
      "group": "front",
      "mode": "generated",
      "showTitle": true,
      "tocEntry": "none",
      "generatedIndex": {
        "kind": "photo",
        "title": "RESİMLER DİZİNİ",
        "levels": [
          1,
          2,
          3,
          4
        ],
        "includePageNumbers": true,
        "leader": "dots",
        "style": {
          "fontFamily": "Times New Roman",
          "fontSizePt": 12,
          "align": "justify",
          "spaceAfterPt": 6,
          "lineSpacing": {
            "rule": "auto",
            "value": 1.5
          },
          "lineHeight": 1.5,
          "firstLineIndentMm": 10.001249999999999
        }
      },
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "roman-lower",
            "restart": false
          }
        },
        "headings": {
          "1": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "align": "center",
            "spaceAfterPt": 41.396484375,
            "lineSpacing": {
              "rule": "auto",
              "value": 1.5
            },
            "lineHeight": 1.5,
            "firstLineIndentMm": 0,
            "numbering": {
              "enabled": false
            },
            "pageBreakBefore": false
          }
        }
      }
    },
    {
      "id": "tables",
      "type": "listOfTables",
      "title": "TABLOLAR DİZİNİ",
      "status": "required",
      "group": "front",
      "mode": "generated",
      "showTitle": true,
      "tocEntry": "none",
      "generatedIndex": {
        "kind": "tables",
        "title": "TABLOLAR DİZİNİ",
        "levels": [
          1,
          2,
          3,
          4
        ],
        "includePageNumbers": true,
        "leader": "dots",
        "style": {
          "fontFamily": "Times New Roman",
          "fontSizePt": 12,
          "align": "justify",
          "spaceAfterPt": 6,
          "lineSpacing": {
            "rule": "auto",
            "value": 1.5
          },
          "lineHeight": 1.5,
          "firstLineIndentMm": 10.001249999999999
        }
      },
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "roman-lower",
            "restart": false
          }
        },
        "headings": {
          "1": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "align": "center",
            "spaceAfterPt": 41.396484375,
            "lineSpacing": {
              "rule": "auto",
              "value": 1.5
            },
            "lineHeight": 1.5,
            "firstLineIndentMm": 0,
            "numbering": {
              "enabled": false
            },
            "pageBreakBefore": false
          }
        }
      }
    },
    {
      "id": "abstract",
      "type": "abstract",
      "title": "ÖZET",
      "status": "required",
      "group": "front",
      "mode": "editable",
      "showTitle": true,
      "tocEntry": "title",
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "roman-lower",
            "restart": false
          }
        },
        "headings": {
          "1": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "align": "center",
            "spaceAfterPt": 6,
            "lineSpacing": {
              "rule": "auto",
              "value": 1.5
            },
            "lineHeight": 1.5,
            "firstLineIndentMm": 0,
            "numbering": {
              "enabled": false
            },
            "pageBreakBefore": false
          }
        }
      }
    },
    {
      "id": "english-abstract",
      "type": "englishAbstract",
      "title": "ABSTRACT",
      "status": "required",
      "group": "front",
      "mode": "editable",
      "showTitle": true,
      "tocEntry": "title",
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "roman-lower",
            "restart": false
          }
        },
        "headings": {
          "1": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "align": "center",
            "spaceAfterPt": 6,
            "lineSpacing": {
              "rule": "auto",
              "value": 1.5
            },
            "lineHeight": 1.5,
            "firstLineIndentMm": 0,
            "numbering": {
              "enabled": false
            },
            "pageBreakBefore": false
          }
        }
      }
    },
    {
      "id": "main",
      "type": "mainContent",
      "title": "ANA METİN",
      "status": "required",
      "group": "body",
      "mode": "editable",
      "showTitle": false,
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "arabic",
            "startAt": 1,
            "restart": true
          }
        }
      }
    },
    {
      "id": "bibliography",
      "type": "bibliography",
      "title": "KAYNAKLAR",
      "status": "required",
      "group": "back",
      "mode": "editable",
      "showTitle": true,
      "tocEntry": "title",
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "arabic",
            "restart": false
          }
        },
        "headings": {
          "1": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "color": "#000000",
            "align": "center",
            "spaceAfterPt": 0,
            "lineSpacing": {
              "rule": "auto",
              "value": 1.5
            },
            "lineHeight": 1.5,
            "firstLineIndentMm": 0,
            "numbering": {
              "enabled": false
            },
            "pageBreakBefore": false
          }
        }
      }
    },
    {
      "id": "appendices",
      "type": "appendices",
      "title": "EKLER",
      "status": "required",
      "group": "back",
      "mode": "editable",
      "showTitle": true,
      "tocEntry": "title",
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "arabic",
            "restart": false
          }
        },
        "headings": {
          "1": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "align": "center",
            "spaceAfterPt": 6,
            "lineSpacing": {
              "rule": "auto",
              "value": 1.5
            },
            "lineHeight": 1.5,
            "firstLineIndentMm": 0,
            "numbering": {
              "enabled": false
            },
            "pageBreakBefore": false
          }
        }
      }
    },
    {
      "id": "ethics",
      "type": "ethicsDeclaration",
      "title": "BİLİMSEL ETİK BEYANI",
      "status": "required",
      "group": "back",
      "mode": "static",
      "tocEntry": "title",
      "blocks": [
        {
          "id": "ethics-l1-w1",
          "type": "text",
          "value": "T.C.",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 110.34536412556965,
          "yMm": 25.02945844862196,
          "widthMm": 10.356222618950738,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l2-w1",
          "type": "text",
          "value": "AYDIN",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 64.43839018079969,
          "yMm": 35.65512339274088,
          "widthMm": 17.18640433417427,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l2-w2",
          "type": "text",
          "value": "ADNAN",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 81.8778995513916,
          "yMm": 35.65512339274088,
          "widthMm": 18.825844531589084,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l2-w3",
          "type": "text",
          "value": "MENDERES",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 100.95685450236002,
          "yMm": 35.65512339274088,
          "widthMm": 28.95967364841036,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l2-w4",
          "type": "text",
          "value": "ÜNİVERSİTESİ",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 130.15478159586587,
          "yMm": 35.65512339274088,
          "widthMm": 36.33963877360026,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l3-w1",
          "type": "text",
          "value": "SAĞLIK",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 76.59864061143662,
          "yMm": 46.28080986870659,
          "widthMm": 20.25231323242187,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l3-w2",
          "type": "text",
          "value": "BİLİMLERİ",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 97.08920728895399,
          "yMm": 46.28080986870659,
          "widthMm": 28.13250622219509,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l3-w3",
          "type": "text",
          "value": "ENSTİTÜSÜ",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 125.47482393052842,
          "yMm": 46.28080986870659,
          "widthMm": 28.92993816799587,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l4-w1",
          "type": "text",
          "value": "BİLİMSEL",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 86.41997265285914,
          "yMm": 67.57447136773003,
          "widthMm": 25.46285866631402,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l4-w2",
          "type": "text",
          "value": "ETİK",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 112.12108476426866,
          "yMm": 67.57447136773003,
          "widthMm": 13.342872789170997,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l4-w3",
          "type": "text",
          "value": "BEYANI",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 125.64772466023761,
          "yMm": 67.57447136773003,
          "widthMm": 20.23249316745334,
          "heightMm": 6.679239908854167,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l5-w1",
          "type": "text",
          "value": "“……………………………………………………..……………………………………",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 40.012054909600145,
          "yMm": 97.03042534722222,
          "widthMm": 148.9126716189914,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l6-w1",
          "type": "text",
          "value": "………………………………………………….……”",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 104.31174231635198,
          "widthMm": 92.85416130489773,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l6-w2",
          "type": "text",
          "value": "başlıklı",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 127.40146128336588,
          "yMm": 104.31174231635198,
          "widthMm": 13.467165374755865,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l6-w3",
          "type": "text",
          "value": "Yüksek",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 145.42276653713648,
          "yMm": 104.31174231635198,
          "widthMm": 13.911668819851343,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l6-w4",
          "type": "text",
          "value": "Lisans/Doktora",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 163.87587144639755,
          "yMm": 104.31174231635198,
          "widthMm": 27.132362704806866,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l7-w1",
          "type": "text",
          "value": "tezimdeki",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 111.63541242811414,
          "widthMm": 17.666637187533908,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l7-w2",
          "type": "text",
          "value": "bütün",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 48.30233807033962,
          "yMm": 111.63541242811414,
          "widthMm": 10.643532816569007,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l7-w3",
          "type": "text",
          "value": "bilgileri",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 59.55877308315701,
          "yMm": 111.63541242811414,
          "widthMm": 14.415427907307944,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l7-w4",
          "type": "text",
          "value": "etik",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 74.6125,
          "yMm": 111.63541242811414,
          "widthMm": 7.345763609144413,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l7-w5",
          "type": "text",
          "value": "davranış",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 82.56269840664334,
          "yMm": 111.63541242811414,
          "widthMm": 15.334057235717765,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l7-w6",
          "type": "text",
          "value": "ve",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 98.51389422946505,
          "yMm": 111.63541242811414,
          "widthMm": 4.996267700195318,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l7-w7",
          "type": "text",
          "value": "akademik",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 104.13576253255208,
          "yMm": 111.63541242811414,
          "widthMm": 17.497302669948994,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l7-w8",
          "type": "text",
          "value": "kurallar",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 122.23749999999998,
          "yMm": 111.63541242811414,
          "widthMm": 14.131799655490454,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l7-w9",
          "type": "text",
          "value": "çerçevesinde",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 137.00336227416992,
          "yMm": 111.63541242811414,
          "widthMm": 22.839762963189003,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l7-w10",
          "type": "text",
          "value": "elde",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 160.44332902696397,
          "yMm": 111.63541242811414,
          "widthMm": 8.03580008612738,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l7-w11",
          "type": "text",
          "value": "ettiğimi,",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 169.1132024976942,
          "yMm": 111.63541242811414,
          "widthMm": 15.253641170925562,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l7-w12",
          "type": "text",
          "value": "tez",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 184.97126770019528,
          "yMm": 111.63541242811414,
          "widthMm": 5.936068216959654,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w1",
          "type": "text",
          "value": "yazım",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 118.9167509290907,
          "widthMm": 11.312403488159177,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w2",
          "type": "text",
          "value": "kurallarına",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 41.698337639702686,
          "yMm": 118.9167509290907,
          "widthMm": 19.33879771762424,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w3",
          "type": "text",
          "value": "uygun",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 61.37063492668999,
          "yMm": 118.9167509290907,
          "widthMm": 11.583333333333329,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w4",
          "type": "text",
          "value": "olarak",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 73.34250322977701,
          "yMm": 118.9167509290907,
          "widthMm": 11.541001722547747,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w5",
          "type": "text",
          "value": "hazırlanan",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 85.23393931918673,
          "yMm": 118.9167509290907,
          "widthMm": 18.644524849785697,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w6",
          "type": "text",
          "value": "bu",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 104.2288985358344,
          "yMm": 118.9167509290907,
          "widthMm": 5.233333333333334,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w7",
          "type": "text",
          "value": "çalışmada,",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 109.81266623602973,
          "yMm": 118.9167509290907,
          "widthMm": 18.983193884955497,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w8",
          "type": "text",
          "value": "bana",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 129.1462944878472,
          "yMm": 118.9167509290907,
          "widthMm": 8.975600602891717,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w9",
          "type": "text",
          "value": "ait",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 138.49772627088757,
          "yMm": 118.9167509290907,
          "widthMm": 5.216398535834429,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w10",
          "type": "text",
          "value": "olmayan",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 144.077262963189,
          "yMm": 118.9167509290907,
          "widthMm": 15.596535831027552,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w11",
          "type": "text",
          "value": "her",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 160.02423316107854,
          "yMm": 118.9167509290907,
          "widthMm": 6.389033677842889,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w12",
          "type": "text",
          "value": "türlü",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 166.75099741617836,
          "yMm": 118.9167509290907,
          "widthMm": 8.996766408284515,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w13",
          "type": "text",
          "value": "ifade",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 176.10242919921873,
          "yMm": 118.9167509290907,
          "widthMm": 9.479348924424926,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l8-w14",
          "type": "text",
          "value": "ve",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 185.9152884589301,
          "yMm": 118.9167509290907,
          "widthMm": 4.996267700195318,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l9-w1",
          "type": "text",
          "value": "bilginin",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 126.24042104085287,
          "widthMm": 14.199533462524414,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l9-w2",
          "type": "text",
          "value": "kaynağına",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 44.488097911410854,
          "yMm": 126.24042104085287,
          "widthMm": 18.365135680304633,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l9-w3",
          "type": "text",
          "value": "eksiz",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 63.11053195529513,
          "yMm": 126.24042104085287,
          "widthMm": 9.682566494411901,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l9-w4",
          "type": "text",
          "value": "atıf",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 73.13506003485784,
          "yMm": 126.24042104085287,
          "widthMm": 6.638797717624243,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l9-w5",
          "type": "text",
          "value": "yaptığımı",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 80.02692510816786,
          "yMm": 126.24042104085287,
          "widthMm": 17.29058079189724,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l9-w6",
          "type": "text",
          "value": "bildiririm.",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 97.59173906114366,
          "yMm": 126.24042104085287,
          "widthMm": 18.301635572645395,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l9-w7",
          "type": "text",
          "value": "İfade",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 116.1676077948676,
          "yMm": 126.24042104085287,
          "widthMm": 9.652938673231347,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l9-w8",
          "type": "text",
          "value": "ettiklerimin",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 126.10748341878254,
          "yMm": 126.24042104085287,
          "widthMm": 20.75696589152018,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l9-w9",
          "type": "text",
          "value": "aksi",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 147.13022045559353,
          "yMm": 126.24042104085287,
          "widthMm": 7.802965460883229,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l9-w10",
          "type": "text",
          "value": "ortaya",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 155.2116500854492,
          "yMm": 126.24042104085287,
          "widthMm": 11.604499138726112,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l9-w11",
          "type": "text",
          "value": "çıktığında",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 167.05652355617946,
          "yMm": 126.24042104085287,
          "widthMm": 17.94180611504447,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l9-w12",
          "type": "text",
          "value": "ise",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 185.24717678493923,
          "yMm": 126.24042104085287,
          "widthMm": 5.70324435763888,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l10-w1",
          "type": "text",
          "value": "her",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 30.022798686557344,
          "yMm": 133.52174877590602,
          "widthMm": 6.389036369323726,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l10-w2",
          "type": "text",
          "value": "türlü",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 36.47016838921441,
          "yMm": 133.52174877590602,
          "widthMm": 8.97983430226644,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l10-w3",
          "type": "text",
          "value": "yasal",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 45.508333333333326,
          "yMm": 133.52174877590602,
          "widthMm": 9.678335486518016,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l10-w4",
          "type": "text",
          "value": "sonucu",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 55.24500215318467,
          "yMm": 133.52174877590602,
          "widthMm": 12.984566709730359,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l10-w5",
          "type": "text",
          "value": "kabul",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 68.28790219624837,
          "yMm": 133.52174877590602,
          "widthMm": 10.465733591715491,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l10-w6",
          "type": "text",
          "value": "ettiğimi",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 78.8119691212972,
          "yMm": 133.52174877590602,
          "widthMm": 14.199533462524414,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l10-w7",
          "type": "text",
          "value": "beyan",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 93.06983591715493,
          "yMm": 133.52174877590602,
          "widthMm": 11.08380525377062,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l10-w8",
          "type": "text",
          "value": "ederim.",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 104.21197450425889,
          "yMm": 133.52174877590602,
          "widthMm": 13.814301808675125,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l11-w1",
          "type": "text",
          "value": "……………………..",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 142.43402777777777,
          "yMm": 171.20547358194983,
          "widthMm": 36.98333333333332,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l12-w1",
          "type": "text",
          "value": "Öğrencinin",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 138.37003165351018,
          "yMm": 180.64582112630205,
          "widthMm": 20.003437381320538,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l12-w2",
          "type": "text",
          "value": "Adı",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 158.43180236816406,
          "yMm": 180.64582112630205,
          "widthMm": 7.349999999999994,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l12-w3",
          "type": "text",
          "value": "ve",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 165.8401357014974,
          "yMm": 180.64582112630205,
          "widthMm": 5.011081610785595,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l12-w4",
          "type": "text",
          "value": "Soyadı",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 170.8926158481174,
          "yMm": 180.64582112630205,
          "widthMm": 12.794058312310113,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l13-w1",
          "type": "text",
          "value": "…",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 151.95902777777778,
          "yMm": 190.0438047620985,
          "widthMm": 5.23333333333332,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l13-w2",
          "type": "text",
          "value": "/",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 157.25069444444443,
          "yMm": 190.0438047620985,
          "widthMm": 2.176866149902338,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l13-w3",
          "type": "text",
          "value": "…",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 159.4858939276801,
          "yMm": 190.0438047620985,
          "widthMm": 5.23333333333332,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l13-w4",
          "type": "text",
          "value": "/",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 164.77756059434677,
          "yMm": 190.0438047620985,
          "widthMm": 2.176866149902338,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        },
        {
          "id": "ethics-l13-w5",
          "type": "text",
          "value": "…",
          "layoutMode": "absolute",
          "wordBaseline": true,
          "xMm": 167.02546386718748,
          "yMm": 190.0438047620985,
          "widthMm": 5.2333333333333485,
          "heightMm": 5.867919921875,
          "flowHeightMm": 0,
          "style": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 12,
            "fontWeight": 400,
            "italic": false,
            "align": "left",
            "firstLineIndentMm": 0,
            "lineHeight": 1,
            "spaceBeforePt": 0,
            "spaceAfterPt": 0
          }
        }
      ],
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "arabic",
            "restart": false
          }
        }
      }
    },
    {
      "id": "cv",
      "type": "curriculumVitae",
      "title": "ÖZ GEÇMİŞ",
      "status": "required",
      "group": "back",
      "mode": "editable",
      "showTitle": true,
      "tocEntry": "title",
      "overrides": {
        "page": {
          "numbering": {
            "enabled": true,
            "format": "arabic",
            "restart": false
          }
        },
        "headings": {
          "1": {
            "fontFamily": "Times New Roman",
            "fontSizePt": 14,
            "fontWeight": 700,
            "align": "center",
            "spaceAfterPt": 41.396484375,
            "lineSpacing": {
              "rule": "auto",
              "value": 1.5
            },
            "lineHeight": 1.5,
            "firstLineIndentMm": 0,
            "numbering": {
              "enabled": false
            },
            "pageBreakBefore": false
          }
        }
      }
    }
  ],
  "tables": {
    "label": "Tablo",
    "position": "above",
    "style": {
      "fontFamily": "Times New Roman",
      "fontSizePt": 12,
      "fontWeight": 700,
      "align": "justify",
      "spaceAfterPt": 6,
      "lineSpacing": {
        "rule": "auto",
        "value": 1.5
      },
      "lineHeight": 1.5,
      "firstLineIndentMm": 0
    },
    "numbering": {
      "scope": "document",
      "format": "{n}",
      "sequence": "arabic"
    },
    "cellPadding": {
      "topMm": 0,
      "bottomMm": 0,
      "leftMm": 1.9049999999999998,
      "rightMm": 1.9049999999999998
    },
    "cellStyle": {
      "fontFamily": "Times New Roman",
      "fontSizePt": 12,
      "align": "justify",
      "spaceAfterPt": 6,
      "lineSpacing": {
        "rule": "auto",
        "value": 1.5
      },
      "lineHeight": 1.5,
      "firstLineIndentMm": 10.001249999999999,
      "fontWeight": 400
    }
  },
  "figures": {
    "label": "Şekil",
    "position": "below",
    "style": {
      "fontFamily": "Times New Roman",
      "fontSizePt": 12,
      "fontWeight": 700,
      "align": "center",
      "spaceAfterPt": 6,
      "lineSpacing": {
        "rule": "auto",
        "value": 1.5
      },
      "lineHeight": 1.5,
      "firstLineIndentMm": 10.001249999999999
    },
    "numbering": {
      "scope": "document",
      "format": "{n}",
      "sequence": "arabic"
    }
  },
  "captionKinds": {
    "photo": {
      "label": "Resim",
      "position": "below",
      "style": {
        "fontFamily": "Times New Roman",
        "fontSizePt": 12,
        "fontWeight": 700,
        "align": "center",
        "spaceAfterPt": 6,
        "lineSpacing": {
          "rule": "auto",
          "value": 1.5
        },
        "lineHeight": 1.5,
        "firstLineIndentMm": 10.001249999999999
      },
      "numbering": {
        "scope": "document",
        "format": "{n}",
        "sequence": "arabic"
      }
    }
  },
  "bibliography": {
    "heading": "KAYNAKLAR",
    "style": {
      "fontFamily": "Times New Roman",
      "fontSizePt": 12,
      "align": "justify",
      "spaceAfterPt": 6,
      "lineSpacing": {
        "rule": "auto",
        "value": 1.5
      },
      "lineHeight": 1.5,
      "firstLineIndentMm": 10.001249999999999,
      "leftIndentMm": 10.001249999999999,
      "hangingIndentMm": 10.001249999999999,
      "widowControl": false
    }
  },
  "toc": {
    "heading": "İÇİNDEKİLER",
    "levels": [
      1,
      2,
      3,
      4
    ],
    "showPageNumbers": true
  }
};
