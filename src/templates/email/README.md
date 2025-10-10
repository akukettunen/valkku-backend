# Email Templates

This directory contains HTML email templates used by the email helper utility.

## Structure

- **base.html** - The base layout template that wraps all email content
- **team-invitation.html** - Team invitation email
- **password-reset.html** - Password reset email
- **welcome.html** - Welcome email for new users

## Template Syntax

Templates use a simple variable replacement syntax:

### Simple Variables
```html
<p>Hello {{user_name}},</p>
```

### Conditional Sections
```html
<p>Hello{{#user_name}} {{user_name}}{{/user_name}},</p>
```
This shows " Name" only if `user_name` is provided, otherwise just "Hello,".

## Creating a New Template

### 1. Create the Template File

Create a new `.html` file in this directory (e.g., `event-reminder.html`):

```html
<h1>Event Reminder</h1>

<p>Hello {{user_name}},</p>

<p>This is a reminder about the upcoming event: <strong>{{event_name}}</strong></p>

<p><strong>Date:</strong> {{event_date}}<br>
<strong>Location:</strong> {{event_location}}</p>

<div class="button-center">
  <a href="{{event_url}}" class="button button-primary">View Event Details</a>
</div>

<div class="note">
  <p style="margin: 0;">See you there!</p>
</div>
```

### 2. Add the Function in emailHelper.ts

```typescript
export const sendEventReminderEmail = async (
  email: string,
  userName: string,
  eventName: string,
  eventDate: string,
  eventLocation: string,
  eventUrl: string
): Promise<void> => {
  const htmlBody = renderEmailTemplate('event-reminder', {
    recipient_email: email,
    subject: `Reminder: ${eventName}`,
    user_name: userName,
    event_name: eventName,
    event_date: eventDate,
    event_location: eventLocation,
    event_url: eventUrl,
  });

  const textBody = htmlToPlainText(htmlBody);

  await sendEmail({
    to: email,
    subject: `Reminder: ${eventName}`,
    htmlBody,
    textBody,
  });
};
```

## Available CSS Classes (from base.html)

Use these classes in your templates for consistent styling:

### Buttons
- `.button` - Base button style
- `.button-primary` - Blue button (default)
- `.button-success` - Green button
- `.button-danger` - Red button
- `.button-center` - Centers the button

### Layout
- `.link-box` - Gray box for displaying links
- `.note` - Blue-bordered info box
- `.footer` - Footer styling (automatically added by base template)

### Example Button Usage
```html
<div class="button-center">
  <a href="{{url}}" class="button button-success">Click Here</a>
</div>
```

## Available Variables in Base Template

The base template automatically includes:
- `{{content}}` - Your template's content (required)
- `{{subject}}` - Email subject
- `{{recipient_email}}` - Recipient's email (shown in footer)

## Best Practices

1. **Always provide these variables:**
   - `recipient_email` - For the footer
   - `subject` - For the email title

2. **Use semantic HTML:**
   - Use `<h1>` for main title
   - Use `<p>` for paragraphs
   - Use `<strong>` for emphasis

3. **Keep it simple:**
   - Email clients have limited CSS support
   - Use inline styles from base template classes
   - Test in multiple email clients

4. **Provide plain text alternative:**
   - The `htmlToPlainText()` function automatically generates this
   - Review the output to ensure it's readable

5. **Mobile-friendly:**
   - The base template includes responsive styles
   - Buttons will automatically stack on mobile

## Testing

Test your templates by calling the email function:

```typescript
import { sendEventReminderEmail } from '@/utils/emailHelper';

await sendEventReminderEmail(
  'test@example.com',
  'John Doe',
  'Team Practice',
  'October 15, 2025 at 3:00 PM',
  'Sports Center',
  'https://example.com/event/123'
);
```

## Customizing the Base Template

If you need to modify the overall layout (logo, colors, footer), edit `base.html`.

Changes to `base.html` will affect all emails sent through the system.
