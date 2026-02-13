from weasyprint import HTML
from jinja2 import Template
import hashlib, base64, io
import qrcode

def _qr_data_uri(text: str) -> str:
    img = qrcode.make(text)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

def render_pdf(html: str, manifest_url: str | None = None) -> tuple[bytes,str]:
    pdf_bytes = HTML(string=html).write_pdf()
    sha = hashlib.sha256(pdf_bytes).hexdigest()
    if manifest_url:
        # inject QR at end if template has {{qr}} or {{sha}}
        qr = _qr_data_uri(manifest_url)
        html2 = html.replace("{{qr}}", f'<img alt="QR" src="{qr}" width="96" height="96"/>') \
                    .replace("{{sha}}", sha)
        pdf_bytes = HTML(string=html2).write_pdf()
    return pdf_bytes, sha