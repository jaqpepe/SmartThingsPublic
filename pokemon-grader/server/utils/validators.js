/**
 * Validates email attachments for card grading
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function validateAttachments(attachments) {
  if (!attachments || attachments.length === 0) {
    return { ok: false, message: 'no_attachments' };
  }
  if (attachments.length < 2) {
    return { ok: false, message: 'only_one_image' };
  }
  if (attachments.length > 2) {
    return { ok: false, message: 'too_many_attachments' };
  }

  for (const att of attachments) {
    const type = (att.contentType || '').toLowerCase().split(';')[0].trim();
    if (!ALLOWED_TYPES.includes(type)) {
      return { ok: false, message: 'invalid_file_type' };
    }
    const sizeBytes = Buffer.from(att.data, 'base64').length;
    if (sizeBytes > MAX_SIZE_BYTES) {
      return { ok: false, message: 'file_too_large' };
    }
  }

  return { ok: true };
}

const ERROR_MESSAGES = {
  no_attachments: {
    subject: 'Missing card images — PokéGrader AI',
    body: 'Please attach 2 images to your email: the card front and the card back.',
  },
  only_one_image: {
    subject: 'Missing one card image — PokéGrader AI',
    body: 'We received only 1 image. Please attach both the front AND back of the card.',
  },
  too_many_attachments: {
    subject: 'Too many attachments — PokéGrader AI',
    body: 'Please attach exactly 2 images: the card front and the card back only.',
  },
  invalid_file_type: {
    subject: 'Unsupported file type — PokéGrader AI',
    body: 'Please use JPG, PNG, or WEBP images only. Other file types are not supported.',
  },
  file_too_large: {
    subject: 'Image too large — PokéGrader AI',
    body: 'Each image must be under 5MB. Please compress and resend.',
  },
};

function getErrorMessage(code) {
  return ERROR_MESSAGES[code] || {
    subject: 'Error processing your card — PokéGrader AI',
    body: 'An error occurred processing your request. Please try again.',
  };
}

module.exports = { validateAttachments, getErrorMessage };
