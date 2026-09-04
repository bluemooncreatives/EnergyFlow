import crypto from 'crypto'

/**
 * Human-readable support-ticket reference for contact-form submissions.
 *
 * Format: `MS-XXXXXXXX` (8 chars) drawn from an unambiguous alphabet — the
 * digits/letters that read the same out loud or look alike (0/O, 1/I/L) are
 * omitted so a customer can quote the ID over the phone or copy it from an
 * email without confusion.
 *
 * Uniqueness is NOT guaranteed by this function alone — with 8 chars over a
 * 30-symbol alphabet collisions are astronomically rare, but the persisted
 * field carries a unique index and the caller retries on a duplicate-key
 * error. Never trust a client-supplied ticket id; always mint it server-side.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no I, L, O, 0, 1
const ID_LENGTH = 8

export const generateTicketId = () => {
  let id = ''
  for (let i = 0; i < ID_LENGTH; i++) {
    // crypto.randomInt is unbiased over [0, ALPHABET.length)
    id += ALPHABET[crypto.randomInt(ALPHABET.length)]
  }
  return `MS-${id}`
}
