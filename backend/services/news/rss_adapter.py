"""
Generic RSS feed news source adapter.

Works with any standard RSS 2.0 / Atom feed. Used for CoinJournal,
CoinTelegraph, Decrypt, Bitcoin.com, BeInCrypto, Crypto.News, etc.
Symbol tagging is done via keyword matching (not from the feed itself).
"""
import json
import logging
import re
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from typing import List, Optional
import xml.etree.ElementTree as ET

import requests

from .base import NewsItem, NewsSourceAdapter

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 15


def _strip_html(text: str) -> str:
    """Remove HTML tags and normalize whitespace."""
    if not text:
        return ""
    cleaned = unescape(text)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = re.sub(
        r"The post .*? appeared first on .*", "", cleaned,
        flags=re.IGNORECASE
    )
    return re.sub(r"\s+", " ", cleaned).strip()


def _parse_rss_date(date_str: str) -> Optional[datetime]:
    """Parse RSS date formats (RFC 822 and ISO 8601)."""
    if not date_str:
        return None
    try:
        parsed = parsedate_to_datetime(date_str.strip())
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except Exception:
        pass
    # Try ISO 8601 fallback
    try:
        return datetime.fromisoformat(
            date_str.strip().replace("Z", "+00:00")
        )
    except Exception:
        return None


class RSSAdapter(NewsSourceAdapter):
    source_type = "rss"

    def fetch(
        self, symbols: List[str], config: dict
    ) -> List[NewsItem]:
        url = config.get("url", "")
        if not url:
            logger.warning("[RSS] No URL configured, skipping")
            return []

        try:
            resp = requests.get(url, timeout=REQUEST_TIMEOUT, headers={
                "User-Agent": "HyperArena/1.0 NewsCollector"
            })
            if resp.status_code != 200:
                logger.warning(
                    "[RSS] %s returned HTTP %s", url, resp.status_code
                )
                return []

            root = ET.fromstring(resp.content)
            items = []

            # RSS 2.0 format
            channel = root.find("channel")
            if channel is not None:
                for item_el in channel.findall("item"):
                    item = self._parse_rss_item(item_el)
                    if item:
                        items.append(item)
            else:
                # Atom format fallback
                ns = {"atom": "http://www.w3.org/2005/Atom"}
                for entry in root.findall("atom:entry", ns):
                    item = self._parse_atom_entry(entry, ns)
                    if item:
                        items.append(item)

            logger.info("[RSS] %s: fetched %d articles", url, len(items))
            return items

        except Exception as e:
            logger.error("[RSS] Error fetching %s: %s", url, e)
            return []

    def _parse_rss_item(self, el) -> Optional[NewsItem]:
        """Parse a single RSS 2.0 <item> element."""
        title = _strip_html(el.findtext("title") or "")
        if not title:
            return None

        link = (el.findtext("link") or "").strip()
        if not link:
            return None

        summary = _strip_html(el.findtext("description") or "")
        published_at = _parse_rss_date(el.findtext("pubDate") or "")

        return NewsItem(
            title=title,
            source_url=link,
            summary=summary[:1000] if summary else "",
            published_at=published_at,
        )

    def _parse_atom_entry(self, el, ns: dict) -> Optional[NewsItem]:
        """Parse a single Atom <entry> element."""
        title = _strip_html(
            el.findtext("atom:title", namespaces=ns) or ""
        )
        if not title:
            return None

        link_el = el.find("atom:link", ns)
        link = link_el.get("href", "") if link_el is not None else ""
        if not link:
            return None

        summary_el = el.findtext("atom:summary", namespaces=ns)
        summary = _strip_html(summary_el or "")
        published_at = _parse_rss_date(
            el.findtext("atom:published", namespaces=ns)
            or el.findtext("atom:updated", namespaces=ns)
            or ""
        )

        return NewsItem(
            title=title,
            source_url=link,
            summary=summary[:1000] if summary else "",
            published_at=published_at,
        )
