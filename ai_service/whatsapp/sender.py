from twilio.rest import Client
from config.settings import settings
import time

# Initialize Twilio client only if credentials are provided
twilio_client = None
if settings.twilio_ssid and settings.twilio_auth:
    try:
        twilio_client = Client(settings.twilio_ssid, settings.twilio_auth)
    except Exception as e:
        print(f"[Twilio Init Error] {e}")

# Ensure FROM_NUMBER is configured with 'whatsapp:' prefix
from_number = settings.twilio_number or "+14155238886"
if not from_number.startswith('whatsapp:'):
    from_number = f"whatsapp:{from_number}"
FROM_NUMBER = from_number

# Parse sandbox redirect whitelist
sandbox_redirect_str = settings.sandbox_redirect_numbers
if not sandbox_redirect_str or not sandbox_redirect_str.strip():
    sandbox_redirect_str = "+918000334811,+917041232198"

redirect_whitelist = []
for num in sandbox_redirect_str.split(","):
    cleaned = num.strip()
    if cleaned:
        if not cleaned.startswith("+"):
            cleaned = "+" + cleaned
        redirect_whitelist.append(cleaned)

def send_text_message(to_phone: str, message: str) -> dict:
    """Send plain text WhatsApp message."""
    to = f"whatsapp:{to_phone}" if not to_phone.startswith("whatsapp:") else to_phone
    if not to.startswith("whatsapp:+") and to.startswith("whatsapp:"):
        to = to.replace("whatsapp:", "whatsapp:+")
        
    # Sandbox Redirect work-around:
    clean_to = to.replace("whatsapp:", "")
    final_to = to
    final_message = message
    if redirect_whitelist:
        if clean_to not in redirect_whitelist:
            primary_redirect = redirect_whitelist[0]
            print(f"[Twilio Sandbox Redirect] Redirecting text from {clean_to} to {primary_redirect}")
            final_to = f"whatsapp:{primary_redirect}"
            final_message = f"[Sandbox Redirect for {clean_to}]\n\n{message}"
    else:
        # Block sends to non-whitelisted numbers to be absolutely safe
        hardcoded_whitelist = ["+918000334811", "+917041232198"]
        if clean_to not in hardcoded_whitelist:
            print(f"[Twilio Sandbox Block] Dropped outbound text to non-whitelisted number: {clean_to}")
            return {"success": False, "error": "Blocked: non-whitelisted number"}
        
    if not twilio_client:
        print(f"[Twilio STUB] Would send text to {final_to}: {final_message}")
        return {"success": True, "sid": f"stub_{int(time.time())}"}

    try:
        msg = twilio_client.messages.create(
            from_=FROM_NUMBER,
            to=final_to,
            body=final_message
        )
        return {"success": True, "sid": msg.sid}
    except Exception as e:
        print(f"Twilio text message error: {e}")
        return {"success": False, "error": str(e)}

def send_image_message(to_phone: str, image_url: str, caption: str = "") -> dict:
    """Send image with optional caption via WhatsApp."""
    to = f"whatsapp:{to_phone}" if not to_phone.startswith("whatsapp:") else to_phone
    if not to.startswith("whatsapp:+") and to.startswith("whatsapp:"):
        to = to.replace("whatsapp:", "whatsapp:+")
        
    # Sandbox Redirect work-around:
    clean_to = to.replace("whatsapp:", "")
    final_to = to
    final_caption = caption
    if redirect_whitelist:
        if clean_to not in redirect_whitelist:
            primary_redirect = redirect_whitelist[0]
            print(f"[Twilio Sandbox Redirect] Redirecting image from {clean_to} to {primary_redirect}")
            final_to = f"whatsapp:{primary_redirect}"
            final_caption = f"[Sandbox Redirect for {clean_to}]\n\n{caption}"
    else:
        # Block sends to non-whitelisted numbers to be absolutely safe
        hardcoded_whitelist = ["+918000334811", "+917041232198"]
        if clean_to not in hardcoded_whitelist:
            print(f"[Twilio Sandbox Block] Dropped outbound image to non-whitelisted number: {clean_to}")
            return {"success": False, "error": "Blocked: non-whitelisted number"}
        
    if not twilio_client:
        print(f"[Twilio STUB] Would send image to {final_to}: {final_caption} (Media: {image_url})")
        return {"success": True, "sid": f"stub_{int(time.time())}"}

    try:
        msg = twilio_client.messages.create(
            from_=FROM_NUMBER,
            to=final_to,
            body=final_caption,
            media_url=[image_url]
        )
        return {"success": True, "sid": msg.sid}
    except Exception as e:
        print(f"Twilio image message error: {e}")
        return {"success": False, "error": str(e)}

def send_template_message(to_phone: str, template_body: str) -> dict:
    """Send pre-approved template message (for first outbound contact)."""
    return send_text_message(to_phone, template_body)

def send_full_agent_response(
    to_phone: str,
    text_reply: str,
    images: list = None,
    brochure_url: str = None
) -> dict:
    """
    Send complete agent response:
    1. Text message first
    2. Images (if any) with small delay
    3. Brochure link (if any) as separate message
    """
    results = []

    # Clean the phone number format
    clean_phone = to_phone
    if clean_phone.startswith('whatsapp:'):
        clean_phone = clean_phone.replace('whatsapp:', '')
    if not clean_phone.startswith('+'):
        clean_phone = '+' + clean_phone

    # 1. Send text reply
    result = send_text_message(clean_phone, text_reply)
    results.append(result)

    # 2. Send images (max 2, with delay to avoid spam)
    if images:
        for i, img_data in enumerate(images[:2]):
            time.sleep(0.8)
            img_url = img_data
            caption = f"📸 Project Photo {i+1}" if i > 0 else "📸 Project Photo"
            
            if isinstance(img_data, dict):
                img_url = img_data.get("url", "")
                caption = img_data.get("caption", caption)
                
            # Local URL detection & fallback
            if "localhost" in img_url or "127.0.0.1" in img_url:
                print(f"[Twilio Sender] Local URL detected ({img_url}). Appending to body instead of media_url.")
                retry_body = f"{caption}\n\n🔗 {img_url}"
                result = send_text_message(clean_phone, retry_body)
            else:
                result = send_image_message(clean_phone, img_url, caption)
                # If image message fails (e.g. trial restrictions, retrieval fail), retry as text
                if not result.get("success"):
                    print(f"[Twilio Sender] Failed to send image media, retrying by appending URL to text: {result.get('error')}")
                    retry_body = f"{caption}\n\n🔗 {img_url}"
                    result = send_text_message(clean_phone, retry_body)
                    
            results.append(result)

    # 3. Send brochure link as separate message
    if brochure_url:
        time.sleep(0.5)
        brochure_msg = (
            f"📋 Here's the complete project brochure with floor plans, "
            f"pricing & specifications:\n{brochure_url}"
        )
        result = send_text_message(clean_phone, brochure_msg)
        results.append(result)

    return {"success": all(r.get("success") for r in results), "results": results}
