import re

def format_for_whatsapp(
    reply: str,
    brochure_url: str = None,
    has_images: bool = False
) -> str:
    """
    Translates Markdown to WhatsApp-native styling and enhances readability:
    1. Converts **bold** to *bold*
    2. Converts *italic* to _italic_
    3. Converts headers (### Title) to bold lines
    4. Converts markdown lists to emoji bullets (🔹)
    5. Normalizes spacing and appends photo notice if images are sent
    """
    if not reply:
        return ""

    # Convert markdown headers (### Header) to bold lines (*Header*)
    text = re.sub(r'(?:^|\n)#{1,6}\s*(.*?)(?=\n|$)', r'\n*\1*', reply)

    # Convert markdown bold **text** to temporary placeholder so we don't mix it with italic asterisks
    text = re.sub(r'\*\*(.*?)\*\*', r'__tempbold__\1__tempbold__', text)

    # Convert markdown italic *text* to WhatsApp italic _text_
    text = re.sub(r'\*(.*?)\*', r'_\1_', text)

    # Restore temporary bold placeholders to WhatsApp bold *text*
    text = text.replace('__tempbold__', '*')

    # Convert code blocks or inline code back to plain text (or monospace `code` if preferred)
    text = re.sub(r'`(.*?)`', r'\1', text)

    # Convert markdown lists (e.g. - item, * item, + item) to nice emoji bullets (🔹 item)
    text = re.sub(r'(?:^|\n)[-\*+]\s+', r'\n🔹 ', text)

    # Normalize multiple line breaks to maximum double newlines
    text = re.sub(r'\n{3,}', '\n\n', text.strip())

    # Add hint if images are coming
    if has_images:
        # Check if notice is already in there
        if "project photos" not in text.lower() and "photos" not in text.lower() and "📸" not in text:
            if not text.endswith(("!", ".", "?", "🙏", "😊")):
                text += "\n\nSending you some project photos as well! 📸"
            else:
                text += "\n\nSending you some project photos as well! 📸"

    return text
