"""Single source of truth for language handling across all LLM prompts.

The frontend sends a code ('en' / 'hi') or a legacy name ('English' / 'Hindi' /
'Hinglish'); resolve() normalizes either to a canonical entry. To add a language,
add one row to LANGUAGES (+ an alias) — no prompt code changes needed.
"""

# Pin CBSE Hindi terminology so the model doesn't invent or transliterate terms.
_MATH_GLOSSARY_HI = (
    "Use standard CBSE Hindi mathematics terminology, e.g.: fraction → भिन्न, "
    "numerator → अंश, denominator → हर, equation → समीकरण, expression → व्यंजक, "
    "variable → चर, angle → कोण, triangle → त्रिभुज, area → क्षेत्रफल, "
    "perimeter → परिमाप, integer → पूर्णांक, decimal → दशमलव, factor → गुणनखंड, "
    "multiple → गुणज, ratio → अनुपात, percentage → प्रतिशत, number line → संख्या रेखा."
)

LANGUAGES = {
    "en": {
        "name": "English",
        "instruction": "Write in clear, simple English suitable for a school student.",
    },
    "hi": {
        "name": "Hindi",
        "instruction": (
            "Write in simple Hindi using Devanagari script, suitable for a school student. "
            + _MATH_GLOSSARY_HI +
            " Keep numerals, mathematical symbols, equations and units in standard form "
            "(do NOT convert digits to Hindi numerals). Do not translate the student's name "
            "or proper nouns."
        ),
    },
    "hinglish": {
        "name": "Hinglish",
        "instruction": (
            "Write in Hinglish — a natural mix of Hindi and English written in Latin script "
            "(e.g. 'Chalo fractions ko samajhte hain!'). Keep technical terms in English."
        ),
    },
}

_ALIASES = {
    "en": "en", "english": "en",
    "hi": "hi", "hindi": "hi", "हिन्दी": "hi", "हिंदी": "hi",
    "hinglish": "hinglish",
}

DEFAULT = "en"


def _key(language):
    if not language:
        return DEFAULT
    return _ALIASES.get(str(language).strip().lower(), DEFAULT)


def resolve(language):
    return LANGUAGES[_key(language)]


def lang_instruction(language):
    """A full directive sentence to drop into any prompt."""
    return resolve(language)["instruction"]


def lang_name(language):
    """The human-readable language name (English exonym)."""
    return resolve(language)["name"]
