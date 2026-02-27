"""Bot Event Service - System event queue for Bot conversations.

Events (signal triggers, AI decisions) are saved as assistant messages
to the Bot conversation and pushed to all bound channels.
Push = broadcast to ALL bound channels; Reply = unicast to originating channel.
"""
import asyncio
import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from database.models import HyperAiConversation, HyperAiMessage, BotConfig

logger = logging.getLogger(__name__)


def get_bot_conversations(db: Session) -> List[HyperAiConversation]:
    """Get all Bot conversations (one per platform)."""
    return db.query(HyperAiConversation).filter(
        HyperAiConversation.is_bot_conversation == True
    ).all()


def get_connected_bot_configs(db: Session) -> List[BotConfig]:
    """Get all connected bot configurations."""
    return db.query(BotConfig).filter(
        BotConfig.status == "connected"
    ).all()


def enqueue_system_event(
    db: Session,
    event_type: str,
    event_data: Dict[str, Any],
    format_message: bool = True
) -> List[Dict[str, Any]]:
    """
    Enqueue a system event to all Bot conversations.

    Args:
        db: Database session
        event_type: Type of event (signal_triggered, ai_decision, etc.)
        event_data: Event payload
        format_message: If True, format event_data into readable message

    Returns:
        List of dicts with conversation_id, message_id, platform for push
    """
    # Format event into readable message
    if format_message:
        content = _format_event_message(event_type, event_data)
    else:
        content = event_data.get("message", str(event_data))

    results = []
    bot_convs = get_bot_conversations(db)

    for conv in bot_convs:
        # Save as assistant message (Bot-initiated)
        message = HyperAiMessage(
            conversation_id=conv.id,
            role="assistant",
            content=content,
            is_complete=True
        )
        db.add(message)
        db.flush()

        results.append({
            "conversation_id": conv.id,
            "message_id": message.id,
            "platform": conv.bot_platform,
            "content": content
        })

    db.commit()
    return results


def _format_event_message(event_type: str, data: Dict[str, Any]) -> str:
    """Format event data into human-readable message."""
    if event_type == "signal_triggered":
        return (
            f"🔔 **Signal Triggered**\n"
            f"Signal: {data.get('signal_name', 'Unknown')}\n"
            f"Symbol: {data.get('symbol', 'N/A')}\n"
            f"Direction: {data.get('direction', 'N/A')}\n"
            f"Metric: {data.get('metric', 'N/A')} = {data.get('value', 'N/A')}"
        )
    elif event_type == "ai_decision":
        return (
            f"🤖 **AI Trader Decision**\n"
            f"Action: {data.get('action', 'Unknown')}\n"
            f"Symbol: {data.get('symbol', 'N/A')}\n"
            f"Size: {data.get('size', 'N/A')}\n"
            f"Reason: {data.get('reason', 'N/A')}"
        )
    elif event_type == "trade_executed":
        return (
            f"✅ **Trade Executed**\n"
            f"Symbol: {data.get('symbol', 'N/A')}\n"
            f"Side: {data.get('side', 'N/A')}\n"
            f"Size: {data.get('size', 'N/A')}\n"
            f"Price: {data.get('price', 'N/A')}"
        )
    else:
        return f"📢 {event_type}: {data.get('message', str(data))}"


async def push_event_to_all_channels(
    db: Session,
    event_results: List[Dict[str, Any]]
):
    """
    Push broadcast: send event notification to ALL bound channels.
    Called after enqueue_system_event to notify users on Telegram/Discord.
    """
    from services.bot_service import get_decrypted_bot_token

    for result in event_results:
        platform = result.get("platform")
        content = result.get("content", "")

        if platform == "telegram":
            await _push_to_telegram(db, content)
        elif platform == "discord":
            pass  # Discord push not implemented yet


async def _push_to_telegram(db: Session, content: str):
    """Push message to all known Telegram chat_ids."""
    from services.bot_service import get_decrypted_bot_token
    from services.telegram_bot_service import send_telegram_message
    from database.models import BotConfig

    token = get_decrypted_bot_token(db, "telegram")
    if not token:
        return

    # Get stored chat_ids from bot config metadata
    config = db.query(BotConfig).filter(
        BotConfig.platform == "telegram"
    ).first()
    if not config:
        return

    # Parse chat_ids from a JSON field (stored when users message the bot)
    import json
    chat_ids = []
    try:
        if config.error_message and config.error_message.startswith("["):
            # Reuse error_message field temporarily for chat_ids
            # TODO: Add proper chat_ids field to BotConfig
            pass
    except Exception:
        pass

    # For now, we store chat_ids in a separate tracking mechanism
    # This will be populated when users first message the bot
    from database.models import BotChatBinding
    bindings = db.query(BotChatBinding).filter(
        BotChatBinding.platform == "telegram",
        BotChatBinding.is_active == True
    ).all()

    for binding in bindings:
        try:
            await send_telegram_message(token, binding.chat_id, content)
        except Exception as e:
            logger.error(f"Failed to push to Telegram chat {binding.chat_id}: {e}")
