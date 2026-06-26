from fastapi import Request

async def parse_twilio_webhook(request: Request) -> dict:
    """Parse incoming Twilio WhatsApp webhook."""
    form_data = await request.form()

    return {
        "from_phone": str(form_data.get("From", "")).replace("whatsapp:", ""),
        "to_phone": str(form_data.get("To", "")).replace("whatsapp:", ""),
        "message_body": str(form_data.get("Body", "")),
        "message_sid": str(form_data.get("MessageSid", "")),
        "num_media": int(form_data.get("NumMedia", 0)),
        "media_url": str(form_data.get("MediaUrl0", "")) if int(form_data.get("NumMedia", 0)) > 0 else None
    }
