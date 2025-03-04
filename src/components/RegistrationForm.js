import React from 'react';

function RegistrationForm({ joinQueue, user }) {
  return (
    <div>
      <h2>Join the Event</h2>
      {user ? (
        <p>You’re in the queue! Check your status on the <a href="/display">Display Page</a>.</p>
      ) : (
        <div>
          <p>Register using the Google Form below:</p>
          <iframe
            src="https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform?embedded=true" // Replace with your form ID
            width="640"
            height="800"
            frameBorder="0"
            marginHeight="0"
            marginWidth="0"
          >
            Loading…
          </iframe>
          {/* Sync Now button removed */}
        </div>
      )}
    </div>
  );
}

export default RegistrationForm;