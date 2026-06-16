/**
 * HattyCRM Contact Form Integration
 * Prehistoric Inc. — Website Contact Form → CRM Bridge
 * =====================================================
   *
   * SETUP (per company website):
 *   1. Copy this file to your website's JS folder
   *   2. Fill in HATTYCRM_URL and HATTYCRM_API_KEY below
 *   3. Set COMPANY_NAME to this website's company name
   *   4. Include this script on your contact form page
 *   5. Call hattycrm.submitContact(formData) on form submit
 *
 * HOW TO GET YOUR API KEY:
 *   1. Log into HattyCRM at your SERVER_URL
 *   2. Go to: Settings → API & Webhooks → API Keys
 *   3. Click "Add API Key", name it "Website Contact Form"
   *   4. Copy the token and paste it below
 */

// ── CONFIGURATION (edit these per website) ────────────────────
const HATTYCRM_URL = 'https://crm.prehistoricinc.com';  // Your HattyCRM URL
const HATTYCRM_API_KEY = 'YOUR_WORKSPACE_API_KEY_HERE'; // From CRM Settings > API Keys
const COMPANY_NAME = 'Company Name Here';               // e.g. "Dino Dig Co."
// ─────────────────────────────────────────────────────────────

const hattycrm = {

  /**
   * Submit a contact form to HattyCRM.
   * 
   * @param {Object} formData - Contact form fields
   * @param {string} formData.firstName
     * @param {string} formData.lastName
     * @param {string} formData.email       - Required
     * @param {string} [formData.phone]
     * @param {string} [formData.message]
     * @param {string} [formData.subject]
     * @returns {Promise<Object>} - CRM API response
   */
  async submitContact(formData) {
        if (!formData.email) {
      throw new Error('HattyCRM: email is required');
        }

    // Step 1: Create or find the person in CRM
    const personPayload = {
            name: {
        firstName: formData.firstName || '',
                  lastName: formData.lastName || ''
          },
                emails: {
        primaryEmail: formData.email,
                  additionalEmails: []
          }
            };

    if (formData.phone) {
      personPayload.phones = {
                primaryPhoneNumber: formData.phone,
                primaryPhoneCountryCode: '+1'
        };
    }

    // Step 2: Create person record via REST API
    let personId;
    try {
      const personResponse = await fetch(`${HATTYCRM_URL}/api/people`, {
                method: 'POST',
                          headers: {
          'Content-Type': 'application/json',
                      'Authorization': `Bearer ${HATTYCRM_API_KEY}`
            },
                    body: JSON.stringify(personPayload)
                      });

      if (!personResponse.ok) {
        const err = await personResponse.text();
        console.error('HattyCRM API error (person):', err);
        throw new Error(`HattyCRM API error: ${personResponse.status}`);
      }

      const personData = await personResponse.json();
      personId = personData.data?.createPerson?.id || personData.id;
    } catch (e) {
      console.error('HattyCRM: Failed to create person', e);
      throw e;
    }

    // Step 3: Create a Note with the message and source info
    if (formData.message || formData.subject) {
      const noteBody = [
        `**Source:** ${COMPANY_NAME} Website Contact Form`,
        formData.subject ? `**Subject:** ${formData.subject}` : '',
        formData.message ? `**Message:**\n${formData.message}` : '',
        `**Submitted:** ${new Date().toISOString()}`
      ].filter(Boolean).join('\n\n');

      try {
        await fetch(`${HATTYCRM_URL}/api/notes`, {
                    method: 'POST',
                                headers: {
            'Content-Type': 'application/json',
                          'Authorization': `Bearer ${HATTYCRM_API_KEY}`
              },
                        body: JSON.stringify({
                                      title: `Website inquiry from ${formData.firstName || formData.email}`,
                                      body: noteBody,
                                      noteTargets: personId ? [{ personId }] : []
                          })
      });
      } catch (noteErr) {
        // Non-fatal — person was created, note failed
        console.warn('HattyCRM: Note creation failed (non-fatal)', noteErr);
      }
    }

    console.log(`HattyCRM: Contact submitted successfully (personId: ${personId})`);
    return { success: true, personId };
  },

  /**
   * Auto-wire a standard HTML contact form.
       * Looks for fields: first-name, last-name, email, phone, subject, message
       * 
       * @param {string} formSelector - CSS selector for the form
   * @param {Object} [options]
       * @param {Function} [options.onSuccess] - callback after successful submit
   * @param {Function} [options.onError]   - callback on error
   */
  wireForm(formSelector, options = {}) {
    const form = document.querySelector(formSelector);
    if (!form) {
      console.warn(`HattyCRM: Form not found: ${formSelector}`);
      return;
    }

    form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const getValue = (names) => {
        for (const name of names) {
                    const el = form.querySelector(`[name="${name}"], #${name}, [data-crm="${name}"]`);
          if (el && el.value) return el.value.trim();
            }
        return '';
};

      const formData = {
                firstName: getValue(['first-name', 'firstName', 'fname', 'first_name']),
                          lastName:  getValue(['last-name', 'lastName', 'lname', 'last_name']),
                          email:     getValue(['email', 'email-address', 'your-email']),
                          phone:     getValue(['phone', 'telephone', 'phone-number']),
                          subject:   getValue(['subject', 'your-subject']),
                          message:   getValue(['message', 'your-message', 'comments'])
                  };

      try {
        const result = await hattycrm.submitContact(formData);
        if (options.onSuccess) options.onSuccess(result);
        else form.insertAdjacentHTML('afterend',
                    '<p class="hattycrm-success" style="color:green">Thank you! We will be in touch shortly.</p>');
      } catch (err) {
        if (options.onError) options.onError(err);
        else console.error('HattyCRM submission failed:', err);
      }
});

    console.log(`HattyCRM: Wired to form ${formSelector}`);
}
};

// ── AUTO-WIRE (optional) ──────────────────────────────────────
// Uncomment ONE of these to auto-wire your form on page load:

// Standard form with id="contact-form":
// document.addEventListener('DOMContentLoaded', () => hattycrm.wireForm('#contact-form'));

// WordPress Contact Form 7 (class .wpcf7-form):
// document.addEventListener('DOMContentLoaded', () => hattycrm.wireForm('.wpcf7-form'));

// Gravity Forms (class .gform_form):
// document.addEventListener('DOMContentLoaded', () => hattycrm.wireForm('.gform_form'));

// ── MANUAL USAGE EXAMPLE ────────────────────────────────────
/*
document.getElementById('my-form').addEventListener('submit', async (e) => {
    e.preventDefault();
  await hattycrm.submitContact({
        firstName: document.getElementById('fname').value,
        lastName:  document.getElementById('lname').value,
        email:     document.getElementById('email').value,
        phone:     document.getElementById('phone').value,
        message:   document.getElementById('message').value
    });
  alert('Thanks! We received your message.');
});
*/
