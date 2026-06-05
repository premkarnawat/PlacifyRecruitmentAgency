"""
VERIQO Email Service — Phase 1.5
==================================
Replaces Resend with aiosmtplib + SMTP.
Configure SMTP credentials in .env (or use Supabase Auth SMTP settings).

Supported email types:
  - registration_welcome
  - email_verification
  - password_reset
  - interview_reminder
  - offer_update
  - joining_reminder
  - system_notification
  - interest_request
  - work_sample_assigned
  - verification_complete
"""
import ssl
import structlog
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any
from datetime import datetime

import aiosmtplib
from jinja2 import Environment, BaseLoader

from app.core.config import settings

log = structlog.get_logger(__name__)

# ─── Email Templates ──────────────────────────────────────────

_BASE_STYLE = """
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #0f0f0f; color: #e5e5e5; margin: 0; padding: 0; }
  .wrapper { max-width: 600px; margin: 40px auto; padding: 0 20px; }
  .card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px;
          padding: 40px; }
  .logo { font-size: 24px; font-weight: 700; color: #6366f1; margin-bottom: 32px; }
  h1 { font-size: 22px; font-weight: 600; color: #ffffff; margin: 0 0 16px; }
  p { color: #a3a3a3; line-height: 1.6; margin: 0 0 16px; }
  .btn { display: inline-block; background: #6366f1; color: #ffffff !important;
         padding: 12px 24px; border-radius: 8px; text-decoration: none;
         font-weight: 600; margin: 16px 0; }
  .footer { text-align: center; color: #525252; font-size: 12px; margin-top: 32px; }
  .highlight { color: #6366f1; font-weight: 600; }
  .badge { display: inline-block; background: #1e1b4b; color: #a5b4fc;
           padding: 4px 12px; border-radius: 999px; font-size: 13px; }
"""

_TEMPLATES: Dict[str, str] = {
    "registration_welcome": """
<!DOCTYPE html><html><head><style>{{ style }}</style></head><body>
<div class="wrapper"><div class="card">
  <div class="logo">Veriqo</div>
  <h1>Welcome to Veriqo, {{ name }}!</h1>
  <p>Your account has been created. You're one step closer to verified hiring.</p>
  {% if cta_url %}
  <a href="{{ cta_url }}" class="btn">Verify Your Email</a>
  {% endif %}
  <p>If you didn't create this account, you can safely ignore this email.</p>
</div><div class="footer">© {{ year }} Veriqo · Verified Hiring Intelligence</div></div>
</body></html>""",

    "email_verification": """
<!DOCTYPE html><html><head><style>{{ style }}</style></head><body>
<div class="wrapper"><div class="card">
  <div class="logo">Veriqo</div>
  <h1>Verify your email</h1>
  <p>Hi {{ name }}, click below to verify your email address.</p>
  <a href="{{ cta_url }}" class="btn">Verify Email</a>
  <p>This link expires in 24 hours. If you didn't request this, ignore it.</p>
</div><div class="footer">© {{ year }} Veriqo</div></div></body></html>""",

    "password_reset": """
<!DOCTYPE html><html><head><style>{{ style }}</style></head><body>
<div class="wrapper"><div class="card">
  <div class="logo">Veriqo</div>
  <h1>Reset your password</h1>
  <p>Hi {{ name }}, we received a request to reset your password.</p>
  <a href="{{ cta_url }}" class="btn">Reset Password</a>
  <p>This link expires in 1 hour. If you didn't request this, you can ignore it.</p>
</div><div class="footer">© {{ year }} Veriqo</div></div></body></html>""",

    "interview_reminder": """
<!DOCTYPE html><html><head><style>{{ style }}</style></head><body>
<div class="wrapper"><div class="card">
  <div class="logo">Veriqo</div>
  <h1>Interview Reminder</h1>
  <p>Hi {{ name }}, your interview is coming up!</p>
  <p><span class="highlight">Role:</span> {{ job_title }}</p>
  <p><span class="highlight">Company:</span> {{ company_name }}</p>
  <p><span class="highlight">Time:</span> {{ interview_time }}</p>
  {% if meeting_url %}
  <a href="{{ meeting_url }}" class="btn">Join Interview</a>
  {% endif %}
  <p>Please be punctual and prepared. Good luck!</p>
</div><div class="footer">© {{ year }} Veriqo</div></div></body></html>""",

    "offer_update": """
<!DOCTYPE html><html><head><style>{{ style }}</style></head><body>
<div class="wrapper"><div class="card">
  <div class="logo">Veriqo</div>
  <h1>{{ offer_status_title }}</h1>
  <p>Hi {{ name }}, here's an update on your offer for <span class="highlight">{{ job_title }}</span>.</p>
  <p>{{ offer_message }}</p>
  {% if cta_url %}
  <a href="{{ cta_url }}" class="btn">View Offer</a>
  {% endif %}
</div><div class="footer">© {{ year }} Veriqo</div></div></body></html>""",

    "joining_reminder": """
<!DOCTYPE html><html><head><style>{{ style }}</style></head><body>
<div class="wrapper"><div class="card">
  <div class="logo">Veriqo</div>
  <h1>Your joining date is approaching!</h1>
  <p>Hi {{ name }}, this is a reminder that you're scheduled to join <span class="highlight">{{ company_name }}</span>.</p>
  <p><span class="highlight">Joining Date:</span> {{ joining_date }}</p>
  <p>Please ensure all your onboarding documents are ready.</p>
</div><div class="footer">© {{ year }} Veriqo</div></div></body></html>""",

    "interest_request": """
<!DOCTYPE html><html><head><style>{{ style }}</style></head><body>
<div class="wrapper"><div class="card">
  <div class="logo">Veriqo</div>
  <h1>Are you interested in this opportunity?</h1>
  <p>Hi {{ name }}, you've been matched to a role at <span class="highlight">{{ company_name }}</span>.</p>
  <p><span class="highlight">Role:</span> {{ job_title }}</p>
  <p>Please confirm your interest and share your availability so we can proceed.</p>
  <a href="{{ cta_url }}" class="btn">Confirm Interest</a>
  <p>This request expires in 48 hours.</p>
</div><div class="footer">© {{ year }} Veriqo</div></div></body></html>""",

    "work_sample_assigned": """
<!DOCTYPE html><html><head><style>{{ style }}</style></head><body>
<div class="wrapper"><div class="card">
  <div class="logo">Veriqo</div>
  <h1>Work Sample Challenge Assigned</h1>
  <p>Hi {{ name }}, you have a new work sample challenge as part of your verification.</p>
  <p><span class="highlight">Task:</span> {{ task_title }}</p>
  <p><span class="highlight">Due:</span> {{ due_date }}</p>
  <a href="{{ cta_url }}" class="btn">View Challenge</a>
</div><div class="footer">© {{ year }} Veriqo</div></div></body></html>""",

    "verification_complete": """
<!DOCTYPE html><html><head><style>{{ style }}</style></head><body>
<div class="wrapper"><div class="card">
  <div class="logo">Veriqo</div>
  <h1>🎉 Your Candidate Passport is Ready!</h1>
  <p>Hi {{ name }}, your verification is complete.</p>
  <p>Trust Score: <span class="highlight">{{ trust_score }}/100</span></p>
  <p>Your Veriqo Passport is now active and can be shared with employers.</p>
  <a href="{{ cta_url }}" class="btn">View My Passport</a>
</div><div class="footer">© {{ year }} Veriqo</div></div></body></html>""",

    "system_notification": """
<!DOCTYPE html><html><head><style>{{ style }}</style></head><body>
<div class="wrapper"><div class="card">
  <div class="logo">Veriqo</div>
  <h1>{{ subject }}</h1>
  <p>Hi {{ name }},</p>
  <p>{{ message }}</p>
  {% if cta_url and cta_label %}
  <a href="{{ cta_url }}" class="btn">{{ cta_label }}</a>
  {% endif %}
</div><div class="footer">© {{ year }} Veriqo</div></div></body></html>""",
}

_SUBJECTS = {
    "registration_welcome": "Welcome to Veriqo!",
    "email_verification": "Verify your Veriqo email",
    "password_reset": "Reset your Veriqo password",
    "interview_reminder": "Reminder: Interview coming up",
    "offer_update": "Offer Update — Veriqo",
    "joining_reminder": "Joining Reminder — Veriqo",
    "interest_request": "New Job Match — Are you interested?",
    "work_sample_assigned": "Work Sample Challenge Assigned",
    "verification_complete": "Your Veriqo Passport is Ready 🎉",
    "system_notification": "Veriqo Notification",
}


# ─── Email Service ────────────────────────────────────────────

class EmailService:
    def __init__(self):
        self.env = Environment(loader=BaseLoader())

    def _render(self, template_name: str, context: Dict[str, Any]) -> str:
        template_str = _TEMPLATES.get(template_name)
        if not template_str:
            raise ValueError(f"Unknown email template: {template_name}")
        context.setdefault("style", _BASE_STYLE)
        context.setdefault("year", datetime.now().year)
        tmpl = self.env.from_string(template_str)
        return tmpl.render(**context)

    async def send(
        self,
        to_email: str,
        template_name: str,
        context: Dict[str, Any],
        subject: Optional[str] = None,
    ) -> bool:
        """
        Render and send an HTML email.
        Returns True on success, False on failure (never raises — email failures
        should not crash the API).
        """
        try:
            html_body = self._render(template_name, context)
            subject = subject or _SUBJECTS.get(template_name, "Veriqo")

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
            msg["To"] = to_email
            msg.attach(MIMEText(html_body, "html"))

            await aiosmtplib.send(
                msg,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_user,
                password=settings.smtp_password,
                start_tls=settings.smtp_use_tls,
            )
            log.info("email.sent", to=to_email, template=template_name)
            return True

        except Exception as exc:
            log.error("email.failed", to=to_email, template=template_name, error=str(exc))
            return False

    # ── Convenience helpers ───────────────────────────────────

    async def send_welcome(self, to_email: str, name: str, verify_url: str) -> bool:
        return await self.send(to_email, "registration_welcome", {
            "name": name, "cta_url": verify_url,
        })

    async def send_verification(self, to_email: str, name: str, verify_url: str) -> bool:
        return await self.send(to_email, "email_verification", {
            "name": name, "cta_url": verify_url,
        })

    async def send_password_reset(self, to_email: str, name: str, reset_url: str) -> bool:
        return await self.send(to_email, "password_reset", {
            "name": name, "cta_url": reset_url,
        })

    async def send_interview_reminder(
        self,
        to_email: str,
        name: str,
        job_title: str,
        company_name: str,
        interview_time: str,
        meeting_url: Optional[str] = None,
    ) -> bool:
        return await self.send(to_email, "interview_reminder", {
            "name": name,
            "job_title": job_title,
            "company_name": company_name,
            "interview_time": interview_time,
            "meeting_url": meeting_url,
        })

    async def send_offer_update(
        self,
        to_email: str,
        name: str,
        job_title: str,
        offer_status_title: str,
        offer_message: str,
        cta_url: Optional[str] = None,
    ) -> bool:
        return await self.send(to_email, "offer_update", {
            "name": name,
            "job_title": job_title,
            "offer_status_title": offer_status_title,
            "offer_message": offer_message,
            "cta_url": cta_url,
        })

    async def send_interest_request(
        self,
        to_email: str,
        name: str,
        company_name: str,
        job_title: str,
        interest_url: str,
    ) -> bool:
        return await self.send(to_email, "interest_request", {
            "name": name,
            "company_name": company_name,
            "job_title": job_title,
            "cta_url": interest_url,
        })

    async def send_verification_complete(
        self,
        to_email: str,
        name: str,
        trust_score: float,
        passport_url: str,
    ) -> bool:
        return await self.send(to_email, "verification_complete", {
            "name": name,
            "trust_score": round(trust_score),
            "cta_url": passport_url,
        })

    async def send_work_sample_assigned(
        self,
        to_email: str,
        name: str,
        task_title: str,
        due_date: str,
        challenge_url: str,
    ) -> bool:
        return await self.send(to_email, "work_sample_assigned", {
            "name": name,
            "task_title": task_title,
            "due_date": due_date,
            "cta_url": challenge_url,
        })


# Singleton instance
email_service = EmailService()
