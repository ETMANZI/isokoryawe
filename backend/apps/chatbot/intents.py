# Predefined intents and responses
INTENTS = {
    "greeting": {
        "patterns": ["hello", "hi", "hey", "good morning", "good afternoon", "hi there"],
        "responses": [
            "Hello! 👋 How can I help you with Market Hub today?",
            "Hi there! Welcome to Market Hub Support. What can I assist you with?",
            "Hey! I'm here to help you with listings, subscriptions, or any questions you have."
        ]
    },
    "pricing": {
        "patterns": ["how much", "price", "cost", "pricing", "fee", "charges"],
        "responses": [
            "Market Hub offers flexible subscription plans:\n\n• Basic: 1,500 RWF/month - 3 listings, 1 image per listing\n• Classic: 2,000 RWF/month - 3 listings, 2 images per listing\n• Premium: 3,000 RWF/month - 4 listings, 3 images per listing\n• Business: 4,000 RWF/month - 5 listings, 4 images per listing\n\nWhich plan interests you?"
        ]
    },
    "how_to_post": {
        "patterns": ["post listing", "create listing", "sell", "add listing", "how to post", "list item"],
        "responses": [
            "To post a listing:\n\n1️⃣ Click the 'Post Listing' button in the sidebar\n2️⃣ Fill in your listing details (title, description, price)\n3️⃣ Upload clear photos of your item\n4️⃣ Choose your listing type (House, Car, Product, etc.)\n5️⃣ Click 'Publish'\n\nNeed a subscription? Check our plans first!"
        ]
    },
    "subscription": {
        "patterns": ["subscribe", "subscription", "plan", "upgrade", "membership", "premium"],
        "responses": [
            "You can view all subscription plans on the Subscriptions page. Each plan offers different benefits:\n\n• Basic: 2 listings, 1 image\n• Classic: 3 listings, 2 images + business ads\n• Premium: 4 listings, 3 images + analytics\n• Business: 5 listings, 4 images + priority support\n\nWould you like me to help you choose a plan?"
        ]
    },
    "image_requirements": {
        "patterns": ["image", "photo", "picture", "upload photo", "image size"],
        "responses": [
            "Image guidelines:\n\n📸 Use clear, well-lit photos\n📏 Minimum size: 800x600 pixels\n💾 Maximum file size: 10MB per image\n🖼️ Supported formats: PNG, JPG, WEBP, GIF\n📷 Show multiple angles\n🚫 No watermarks or text on images\n\nYour plan determines how many images you can upload per listing."
        ]
    },
    "payment": {
        "patterns": ["payment", "pay", "mobile money", "mtn", "airtel", "transfer"],
        "responses": [
            "We accept multiple payment methods:\n\n💰 Mobile Money (MTN, Airtel)\n💳 Credit/Debit Cards\n🏦 Bank Transfer\n\nAfter subscribing, you'll receive payment instructions. All payments are securely processed."
        ]
    },
    "account": {
        "patterns": ["account", "profile", "change password", "update email", "delete account"],
        "responses": [
            "You can manage your account from the Dashboard:\n\n• Update profile information\n• Change password\n• View your listings\n• Track interested buyers\n• Manage notifications\n\nIs there something specific you'd like to update?"
        ]
    },
    "contact_support": {
        "patterns": ["support", "help", "contact", "talk to human", "agent", "customer service"],
        "responses": [
            "You can reach our support team:\n\n📞 Call: +250 788 263 338\n💬 WhatsApp: wa.me/250788263338\n✉️ Email: support@markethub.com\n\nOr visit our Help section for guides and FAQs. Would you like me to connect you with a human agent?"
        ]
    },
    "listing_approval": {
        "patterns": ["approve", "pending", "review", "how long", "approval time"],
        "responses": [
            "Listings are typically approved within 24 hours. Premium and Business subscribers get priority approval within 4 hours.\n\nYou'll receive a notification once your listing is approved. Need faster approval? Consider upgrading your subscription!"
        ]
    },
    "refund": {
        "patterns": ["refund", "money back", "return", "cancel subscription"],
        "responses": [
            "Subscription fees are generally non-refundable. However, if you experienced technical issues, please contact our support team within 7 days of payment.\n\nTo cancel auto-renewal, go to Subscriptions → Manage → Turn off auto-renew."
        ]
    },
    "featured_listing": {
        "patterns": ["featured", "boost", "promote", "advertise", "highlight"],
        "responses": [
            "Featured listings appear at the top of search results! 🚀\n\nPremium and Business plans include featured listing options. You can upgrade from the Subscriptions page to get more visibility for your items."
        ]
    },
    "business_ads": {
        "patterns": ["business ad", "company", "business account", "sell for business"],
        "responses": [
            "Business ads are available with Classic, Premium, and Business plans.\n\nBenefits:\n• Reach more customers\n• Company branding\n• Analytics dashboard\n• Priority support\n\nUpgrade your plan to start posting business ads!"
        ]
    },
    "analytics": {
        "patterns": ["analytics", "stats", "views", "interested", "performance"],
        "responses": [
            "Your dashboard shows:\n\n👁️ Views - How many people saw your listing\n⭐ Interested - Potential buyers\n📈 Trends - Performance over time\n\nPremium and Business plans include advanced analytics with detailed insights!"
        ]
    },
    "goodbye": {
        "patterns": ["bye", "goodbye", "see you", "thanks", "thank you"],
        "responses": [
            "You're welcome! 👋 Feel free to come back if you have more questions. Happy selling on Market Hub!",
            "Glad I could help! Have a great day! 🌟"
        ]
    },
    "help": {
        "patterns": ["help", "what can you do", "features", "capabilities"],
        "responses": [
            "I can help you with:\n\n📋 Posting listings\n💰 Pricing and subscriptions\n📸 Image guidelines\n✅ Listing approval\n📊 Analytics and stats\n🆘 Technical support\n🔐 Account management\n\nWhat would you like to know?"
        ]
    },
    "default": {
        "responses": [
            "I'm not sure I understand. Could you rephrase your question?\n\nYou can ask me about:\n• How to post a listing\n• Subscription plans\n• Image requirements\n• Pricing\n• Account help\n\nOr type 'help' to see all options."
        ]
    }
}

def get_intent(message):
    message_lower = message.lower()
    for intent, data in INTENTS.items():
        if intent == "default":
            continue
        for pattern in data.get("patterns", []):
            if pattern in message_lower:
                return intent
    return "default"

def get_response(intent):
    import random
    responses = INTENTS[intent].get("responses", INTENTS["default"]["responses"])
    return random.choice(responses)