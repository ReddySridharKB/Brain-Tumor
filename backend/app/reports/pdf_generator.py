import os

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.config.settings import settings
from app.models.models import MRIScan, Patient


# =========================================================
# PREMIUM MEDICAL PDF ENGINE
# =========================================================


def generate_pdf_report(scan: MRIScan, patient: Patient) -> str:
    """
    Premium AI Brain MRI PDF Report
    Modern Clinical Styled PDF
    """

    reports_dir = os.path.join(settings.STORAGE_DIR, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    pdf_path = os.path.join(reports_dir, f"report_scan_{scan.id}.pdf")

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
    )

    styles = getSampleStyleSheet()

    # =========================================================
    # COLOR SYSTEM
    # =========================================================

    PRIMARY = HexColor("#0F172A")
    SECONDARY = HexColor("#1E293B")
    ACCENT = HexColor("#2563EB")
    CYAN = HexColor("#06B6D4")
    LIGHT_BG = HexColor("#F8FAFC")
    BORDER = HexColor("#CBD5E1")
    TEXT = HexColor("#111827")
    MUTED = HexColor("#64748B")
    SUCCESS = HexColor("#16A34A")
    WARNING = HexColor("#F59E0B")
    DANGER = HexColor("#DC2626")

    # =========================================================
    # RISK COLOR MAPPING
    # =========================================================

    risk_level = (scan.tumor_risk or "Unknown").lower()

    if "high" in risk_level:
        risk_color = DANGER
    elif "medium" in risk_level:
        risk_color = WARNING
    elif "low" in risk_level:
        risk_color = SUCCESS
    else:
        risk_color = ACCENT

    # =========================================================
    # TYPOGRAPHY STYLES
    # =========================================================

    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        alignment=TA_CENTER,
        textColor=colors.white,
        spaceAfter=8,
    )

    subtitle_style = ParagraphStyle(
        "SubtitleStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        alignment=TA_CENTER,
        textColor=HexColor("#CBD5E1"),
        spaceAfter=16,
    )

    section_style = ParagraphStyle(
        "SectionStyle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=PRIMARY,
        spaceAfter=12,
        spaceBefore=10,
    )

    label_style = ParagraphStyle(
        "LabelStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=PRIMARY,
    )

    value_style = ParagraphStyle(
        "ValueStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=TEXT,
    )

    body_style = ParagraphStyle(
        "BodyStyle",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=11,
        leading=18,
        alignment=TA_JUSTIFY,
        textColor=TEXT,
        spaceAfter=12,
    )

    small_style = ParagraphStyle(
        "SmallStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        textColor=MUTED,
        alignment=TA_CENTER,
    )

    metric_style = ParagraphStyle(
        "MetricStyle",
        parent=styles["Normal"],
        fontName="Courier-Bold",
        fontSize=14,
        alignment=TA_CENTER,
        textColor=colors.white,
    )

    metric_label_style = ParagraphStyle(
        "MetricLabelStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        alignment=TA_CENTER,
        textColor=HexColor("#E2E8F0"),
    )

    # =========================================================
    # STORY
    # =========================================================

    story = []

    # =========================================================
    # HEADER BANNER
    # =========================================================

    header_table = Table(
        [
            [
                Paragraph(
                    "Brain Tumor Detection & Monitoring Report",
                    title_style,
                )
            ],
            [
                Paragraph(
                    "AI Assisted Brain MRI Diagnostic Analysis",
                    subtitle_style,
                )
            ],
        ],
        colWidths=[doc.width],
    )

    header_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PRIMARY),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
                ("TOPPADDING", (0, 0), (-1, -1), 18),
                ("LEFTPADDING", (0, 0), (-1, -1), 20),
                ("RIGHTPADDING", (0, 0), (-1, -1), 20),
            ]
        )
    )

    story.append(header_table)
    story.append(Spacer(1, 18))

    # =========================================================
    # METRIC CARDS
    # =========================================================

    probability_text = (
        f"{scan.probability * 100:.1f}%"
        if scan.probability is not None
        else "N/A"
    )

    metric_data = [
        [
            _metric_card(
                "Tumor Type",
                scan.tumor_type or "Unknown",
                SECONDARY,
                metric_style,
                metric_label_style,
            ),
            _metric_card(
                "Risk Level",
                scan.tumor_risk or "Unknown",
                risk_color,
                metric_style,
                metric_label_style,
            ),
            _metric_card(
                "Confidence",
                probability_text,
                ACCENT,
                metric_style,
                metric_label_style,
            ),
        ]
    ]

    metric_table = Table(metric_data, colWidths=[doc.width / 3.15] * 3)
    metric_table.setStyle(
        TableStyle(
            [
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )

    story.append(metric_table)
    story.append(Spacer(1, 20))

    # =========================================================
    # PATIENT INFORMATION CARD
    # =========================================================

    story.append(Paragraph("Patient Information", section_style))

    patient_table_data = [
        [
            Paragraph("Name", label_style),
            Paragraph(patient.name, value_style),
            Paragraph("Patient UID", label_style),
            Paragraph(patient.patient_uid, value_style),
        ],
        [
            Paragraph("Age", label_style),
            Paragraph(str(patient.age), value_style),
            Paragraph("Sex", label_style),
            Paragraph(patient.sex, value_style),
        ],
        [
            Paragraph("Blood Group", label_style),
            Paragraph(patient.blood_group or "N/A", value_style),
            Paragraph("Scan Date", label_style),
            Paragraph(
                scan.uploaded_at.strftime("%Y-%m-%d %H:%M:%S"),
                value_style,
            ),
        ],
    ]

    patient_table = Table(
        patient_table_data,
        colWidths=[1.4 * inch, 1.7 * inch, 1.4 * inch, 2.1 * inch],
    )

    patient_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
                ("BOX", (0, 0), (-1, -1), 1, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )

    story.append(patient_table)
    story.append(Spacer(1, 20))

    # =========================================================
    # DIAGNOSIS BANNER
    # =========================================================

    diagnosis_text = f"""
    <font color='white'><b>Detected Region:</b> {scan.tumor_location or 'Unknown'}<br/>
    <b>Severity:</b> {scan.severity or 'N/A'}<br/>
    <b>Clinical Risk:</b> {scan.tumor_risk or 'Unknown'}</font>
    """

    diagnosis_table = Table(
        [[Paragraph(diagnosis_text, styles["BodyText"])]],
        colWidths=[doc.width],
    )

    diagnosis_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), risk_color),
                ("LEFTPADDING", (0, 0), (-1, -1), 20),
                ("RIGHTPADDING", (0, 0), (-1, -1), 20),
                ("TOPPADDING", (0, 0), (-1, -1), 16),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
            ]
        )
    )

    story.append(diagnosis_table)
    story.append(Spacer(1, 20))

    # =========================================================
    # MRI IMAGE SECTION
    # =========================================================

    story.append(Paragraph("MRI Scan Visualization", section_style))

    image_path = None

    if (
        scan.highlighted_image_path
        and os.path.exists(scan.highlighted_image_path)
    ):
        image_path = scan.highlighted_image_path
        image_title = "Highlighted MRI Tumor Detection"

    elif (
        scan.original_image_path
        and os.path.exists(scan.original_image_path)
    ):
        image_path = scan.original_image_path
        image_title = "Original MRI Scan"

    if image_path:
        img = Image(image_path)
        img.drawHeight = 4.1 * inch
        img.drawWidth = 4.1 * inch

        image_caption = Paragraph(
            f"<b>Figure:</b> {image_title}",
            small_style,
        )

        image_table = Table(
            [
                [img],
                [image_caption],
            ],
            colWidths=[doc.width],
        )

        image_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                    ("BOX", (0, 0), (-1, -1), 1.2, BORDER),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
                    ("TOPPADDING", (0, 0), (-1, -1), 14),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ]
            )
        )

        story.append(image_table)
        story.append(Spacer(1, 22))

    # =========================================================
    # CLINICAL SUMMARY TABLE
    # =========================================================

    story.append(Paragraph("Clinical Summary", section_style))

    clinical_data = [
        ["Tumor Type", scan.tumor_type or "N/A"],
        ["Tumor Location", scan.tumor_location or "N/A"],
        ["Risk Level", scan.tumor_risk or "N/A"],
        ["Severity", scan.severity or "N/A"],
        ["Detection Probability", probability_text],
    ]

    clinical_table = Table(clinical_data, colWidths=[2.7 * inch, 3.7 * inch])

    clinical_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), PRIMARY),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
                ("TEXTCOLOR", (1, 0), (1, -1), TEXT),
                ("BACKGROUND", (1, 0), (1, -1), LIGHT_BG),
                ("BOX", (0, 0), (-1, -1), 1, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 14),
            ]
        )
    )

    story.append(clinical_table)
    story.append(Spacer(1, 22))

    # =========================================================
    # CONFIDENCE BAR
    # =========================================================

    if scan.probability is not None:
        story.append(Paragraph("Detection Confidence", section_style))

        percentage = int(scan.probability * 100)

        filled = int(percentage / 5)
        empty = 20 - filled

        progress_bar = "█" * filled + "░" * empty

        confidence_text = f"""
        <font face='Courier-Bold' size='13'>
        {progress_bar}<br/><br/>
        Confidence Score: {percentage}%
        </font>
        """

        confidence_table = Table(
            [[Paragraph(confidence_text, body_style)]],
            colWidths=[doc.width],
        )

        confidence_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
                    ("BOX", (0, 0), (-1, -1), 1, BORDER),
                    ("LEFTPADDING", (0, 0), (-1, -1), 18),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 18),
                    ("TOPPADDING", (0, 0), (-1, -1), 18),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
                ]
            )
        )

        story.append(confidence_table)
        story.append(Spacer(1, 20))

    # =========================================================
    # AI FINDINGS
    # =========================================================

    story.append(Paragraph("AI Findings & Interpretation", section_style))

    if scan.ai_summary:
        paragraphs = [
            p.strip()
            for p in scan.ai_summary.split("\n")
            if p.strip()
        ]

        for para in paragraphs:
            quote_table = Table(
                [[Paragraph(para, body_style)]],
                colWidths=[doc.width],
            )

            quote_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                        ("LINEBEFORE", (0, 0), (0, -1), 4, CYAN),
                        ("LEFTPADDING", (0, 0), (-1, -1), 16),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
                        ("TOPPADDING", (0, 0), (-1, -1), 14),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
                    ]
                )
            )

            story.append(quote_table)
            story.append(Spacer(1, 10))

    else:
        story.append(
            Paragraph(
                "No AI summary available for this scan.",
                body_style,
            )
        )

    # =========================================================
    # PROGRESSION ANALYSIS
    # =========================================================

    if scan.comparison_result:
        story.append(Spacer(1, 10))
        story.append(Paragraph("Progression Analysis", section_style))

        progression_text = f"""
        Compared to the previous MRI scan, the tumor shows
        <b>{scan.comparison_result}</b> with an estimated
        growth variation of <b>{scan.growth_percentage}%</b>.
        """

        progression_table = Table(
            [[Paragraph(progression_text, body_style)]],
            colWidths=[doc.width],
        )

        progression_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
                    ("BOX", (0, 0), (-1, -1), 1, BORDER),
                    ("LEFTPADDING", (0, 0), (-1, -1), 16),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 16),
                    ("TOPPADDING", (0, 0), (-1, -1), 16),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
                ]
            )
        )

        story.append(progression_table)
        story.append(Spacer(1, 18))

    # =========================================================
    # CLINICAL RECOMMENDATION
    # =========================================================

    story.append(Paragraph("Clinical Recommendation", section_style))

    recommendation_text = """
    This AI-assisted MRI analysis indicates findings that should be
    clinically correlated with radiological and neurological evaluation.
    Further diagnostic confirmation and treatment planning should be
    performed by a licensed healthcare professional.
    """

    recommendation_table = Table(
        [[Paragraph(recommendation_text, body_style)]],
        colWidths=[doc.width],
    )

    recommendation_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), HexColor("#EFF6FF")),
                ("BOX", (0, 0), (-1, -1), 1, ACCENT),
                ("LEFTPADDING", (0, 0), (-1, -1), 16),
                ("RIGHTPADDING", (0, 0), (-1, -1), 16),
                ("TOPPADDING", (0, 0), (-1, -1), 16),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
            ]
        )
    )

    story.append(recommendation_table)
    story.append(Spacer(1, 25))

    # =========================================================
    # FOOTER
    # =========================================================

    story.append(
        HRFlowable(
            width="100%",
            thickness=0.8,
            color=BORDER,
        )
    )

    story.append(Spacer(1, 10))

    footer_text = """
    AI-generated medical assistance report. This report is intended
    solely for clinical support purposes and must not replace
    professional medical diagnosis or treatment decisions.
    Generated by NeuroVision AI Diagnostic Engine.
    """

    story.append(Paragraph(footer_text, small_style))

    # =========================================================
    # BUILD PDF
    # =========================================================

    doc.build(story)

    return pdf_path


# =========================================================
# METRIC CARD COMPONENT
# =========================================================


def _metric_card(title, value, bg_color, value_style, label_style):
    card = Table(
        [
            [Paragraph(str(value), value_style)],
            [Paragraph(title, label_style)],
        ],
        colWidths=[2.0 * inch],
    )

    card.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg_color),
                ("BOX", (0, 0), (-1, -1), 0, bg_color),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
                ("TOPPADDING", (0, 0), (-1, -1), 16),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )

    # IMPORTANT:
    # Returning KeepTogether(card) inside another Table can trigger
    # ReportLab infinite height calculation issues on some systems.
    # Returning the card directly avoids the LayoutError.

    return card

def generate_comparison_pdf_report(scan1: MRIScan, scan2: MRIScan, patient: Patient) -> str:
    from app.ai.gemini_service import compare_scans
    
    reports_dir = os.path.join(settings.STORAGE_DIR, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    pdf_path = os.path.join(reports_dir, f"comparison_report_{scan1.id}_vs_{scan2.id}.pdf")

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
    )

    styles = getSampleStyleSheet()

    PRIMARY = HexColor("#0F172A")
    CYAN = HexColor("#06B6D4")
    LIGHT_BG = HexColor("#F8FAFC")
    BORDER = HexColor("#CBD5E1")
    TEXT = HexColor("#111827")
    MUTED = HexColor("#64748B")

    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=28,
        alignment=TA_CENTER,
        textColor=colors.white,
        spaceAfter=8,
    )

    subtitle_style = ParagraphStyle(
        "SubtitleStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        alignment=TA_CENTER,
        textColor=HexColor("#CBD5E1"),
        spaceAfter=16,
    )

    section_style = ParagraphStyle(
        "SectionStyle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=PRIMARY,
        spaceAfter=12,
        spaceBefore=10,
    )

    body_style = ParagraphStyle(
        "BodyStyle",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=11,
        leading=18,
        alignment=TA_JUSTIFY,
        textColor=TEXT,
        spaceAfter=12,
    )
    
    small_style = ParagraphStyle(
        "SmallStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        textColor=MUTED,
        alignment=TA_CENTER,
    )

    story = []

    header_table = Table(
        [
            [Paragraph("MRI Scan Comparison Report", title_style)],
            [Paragraph(f"Patient: {patient.name} (UID: {patient.patient_uid})", subtitle_style)],
        ],
        colWidths=[doc.width],
    )
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PRIMARY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
        ("TOPPADDING", (0, 0), (-1, -1), 18),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 20))

    comp_res = compare_scans(scan1.ai_summary or "", scan2.ai_summary or "")
    
    story.append(Paragraph("Progression Summary", section_style))
    summary_text = f"<b>Result:</b> {comp_res.get('comparison_result', 'Unknown')}<br/><b>Growth/Reduction:</b> {comp_res.get('growth_percentage', 0.0)}%<br/><br/>{comp_res.get('progression_summary', 'No summary available.')}"
    
    summary_table = Table([[Paragraph(summary_text, body_style)]], colWidths=[doc.width])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 1, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))

    story.append(Paragraph("Visual Comparison", section_style))
    
    img1_path = scan1.highlighted_image_path if scan1.highlighted_image_path and os.path.exists(scan1.highlighted_image_path) else scan1.original_image_path
    img2_path = scan2.highlighted_image_path if scan2.highlighted_image_path and os.path.exists(scan2.highlighted_image_path) else scan2.original_image_path
    
    img1 = Image(img1_path) if img1_path and os.path.exists(img1_path) else Paragraph("Image not available", body_style)
    img2 = Image(img2_path) if img2_path and os.path.exists(img2_path) else Paragraph("Image not available", body_style)
    
    if isinstance(img1, Image):
        img1.drawHeight = 3.0 * inch
        img1.drawWidth = 3.0 * inch
    if isinstance(img2, Image):
        img2.drawHeight = 3.0 * inch
        img2.drawWidth = 3.0 * inch

    image_table = Table(
        [
            [img1, img2],
            [Paragraph(f"Scan 1: {scan1.uploaded_at.strftime('%Y-%m-%d')}", small_style), Paragraph(f"Scan 2: {scan2.uploaded_at.strftime('%Y-%m-%d')}", small_style)]
        ],
        colWidths=[doc.width / 2.0, doc.width / 2.0]
    )
    image_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(image_table)
    story.append(Spacer(1, 20))

    story.append(HRFlowable(width="100%", thickness=0.8, color=BORDER))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Generated by NeuroVision AI Diagnostic Engine.", small_style))

    doc.build(story)
    return pdf_path
