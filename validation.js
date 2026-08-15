/* ─────────────────────────────────────────────────────────────
   Shared input validation.

   Sweden-first, not Sweden-only: Regma hires in Gothenburg, so Swedish
   numbers are the common case and get proper checking, but a genuinely
   international applicant must not be blocked by a validator.
   ───────────────────────────────────────────────────────────── */

/* Swedish mobile operator prefixes (national form, after the leading 0) */
const SE_MOBILE_PREFIXES = ['70', '72', '73', '76', '79'];

/* Swedish landline area codes, longest first so 08 doesn't swallow 084x */
const SE_AREA_CODES = [
  '11', '13', '16', '18', '19', '21', '23', '26', '31', '33', '35', '36',
  '40', '42', '44', '46', '54', '60', '63', '90', '8',
];

/**
 * Validate and normalise a phone number.
 * Returns { ok, e164, display, reason, kind }
 *   e164    — storable form, e.g. "+46705081788"
 *   display — human form, e.g. "+46 70 508 17 88"
 *   kind    — 'se-mobile' | 'se-landline' | 'international'
 */
function validatePhone(raw) {
  const input = String(raw || '').trim();
  if (!input) return { ok: false, reason: 'Please enter a phone number.' };

  // Keep digits and a leading +. 00 is the international prefix in Europe.
  let cleaned = input.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);

  const hasPlus = cleaned.startsWith('+');
  let digits = cleaned.replace(/\+/g, '');

  if (!digits) return { ok: false, reason: 'That does not look like a phone number.' };
  if (/^(\d)\1+$/.test(digits)) {
    return { ok: false, reason: 'That looks like a placeholder rather than a real number.' };
  }

  // ── Swedish, written nationally: 070-508 17 88 ────────────────
  if (!hasPlus && digits.startsWith('0')) {
    const national = digits.slice(1);          // drop the trunk 0
    const kind = classifySwedish(national);
    if (!kind) {
      return {
        ok: false,
        reason: 'That is not a recognised Swedish number. Mobiles start 070, 072, 073, 076 or 079.',
      };
    }
    return { ok: true, kind, e164: '+46' + national, display: formatSwedish(national) };
  }

  // ── Swedish, written internationally: +46 70 508 17 88 ────────
  if (digits.startsWith('46') && (hasPlus || digits.length >= 11)) {
    let national = digits.slice(2);
    if (national.startsWith('0')) national = national.slice(1);  // +460… is a common slip
    const kind = classifySwedish(national);
    if (!kind) {
      return {
        ok: false,
        reason: 'That is not a recognised Swedish number. Mobiles are 9 digits starting 70, 72, 73, 76 or 79.',
      };
    }
    return { ok: true, kind, e164: '+46' + national, display: formatSwedish(national) };
  }

  // ── Any other country ─────────────────────────────────────────
  if (hasPlus) {
    // ITU-T E.164: max 15 digits including country code; nothing real is under 7
    if (digits.length < 7)  return { ok: false, reason: 'That number looks too short.' };
    if (digits.length > 15) return { ok: false, reason: 'That number looks too long.' };
    return { ok: true, kind: 'international', e164: '+' + digits, display: '+' + digits };
  }

  // No +, doesn't start 0, isn't Swedish — ambiguous, so ask rather than guess
  return {
    ok: false,
    reason: 'Add the country code, e.g. +46 for Sweden.',
  };
}

/* Which kind of Swedish number is this national part? */
function classifySwedish(national) {
  if (SE_MOBILE_PREFIXES.includes(national.slice(0, 2))) {
    return national.length === 9 ? 'se-mobile' : null;
  }
  const area = SE_AREA_CODES.find(a => national.startsWith(a));
  if (area) {
    // Swedish landlines run 7–9 digits nationally, area code included
    return national.length >= 7 && national.length <= 9 ? 'se-landline' : null;
  }
  return null;
}

/* +46 70 508 17 88 */
function formatSwedish(national) {
  if (national.length === 9 && SE_MOBILE_PREFIXES.includes(national.slice(0, 2))) {
    return '+46 ' + national.slice(0, 2) + ' ' + national.slice(2, 5) +
           ' ' + national.slice(5, 7) + ' ' + national.slice(7);
  }
  return '+46 ' + national;
}

/**
 * Attach live validation to a phone input.
 * Shows a hint under the field; never blocks typing.
 */
function attachPhoneValidation(input, hintEl) {
  if (!input) return;
  const hint = typeof hintEl === 'string' ? document.getElementById(hintEl) : hintEl;

  const check = (showEmpty) => {
    const val = input.value.trim();
    if (!val) {
      input.classList.remove('input-ok', 'input-bad');
      if (hint) { hint.textContent = ''; hint.className = 'field-hint'; }
      return !showEmpty;
    }
    const r = validatePhone(val);
    input.classList.toggle('input-ok', r.ok);
    input.classList.toggle('input-bad', !r.ok);
    if (hint) {
      hint.textContent = r.ok
        ? (r.kind === 'international' ? 'Looks good' : 'Looks good — ' + r.display)
        : r.reason;
      hint.className = 'field-hint ' + (r.ok ? 'is-ok' : 'is-bad');
    }
    return r.ok;
  };

  input.addEventListener('input', () => check(false));
  input.addEventListener('blur', () => {
    // Tidy a valid number into its canonical form when they leave the field
    const r = validatePhone(input.value);
    if (r.ok) input.value = r.display;
    check(false);
  });

  return check;
}

/* Basic email sanity — the browser's type="email" is lenient */
function validateEmail(raw) {
  const v = String(raw || '').trim();
  if (!v) return { ok: false, reason: 'Please enter your email address.' };
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) {
    return { ok: false, reason: 'That does not look like a valid email address.' };
  }
  if (/\s/.test(v)) return { ok: false, reason: 'Email addresses cannot contain spaces.' };
  return { ok: true, value: v.toLowerCase() };
}

window.validatePhone = validatePhone;
window.attachPhoneValidation = attachPhoneValidation;
window.validateEmail = validateEmail;
