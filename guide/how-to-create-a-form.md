# How to Create a Form

This guide walks through creating a custom form on a page using the Arbor CMS admin UI. No code changes are needed — everything is done through the admin interface.

---

## Overview

Forms in Arbor CMS are created using the **Form widget**. Each form is backed by a **Form Type** that stores the form structure (field definitions) independently from the widget. This means you can reuse the same form definition across multiple pages, and submissions are preserved even if the widget is removed.

---

## Step 1: Navigate to the Page Editor

1. Log in to the admin panel at `/admin`
2. Go to **Pages** in the sidebar
3. Click on the page where you want to add a form (or create a new page first)
4. In the page editor, switch to the **Widgets** tab

---

## Step 2: Add a Form Widget

1. In the widget area (e.g., "Main Content"), click **Add Widget**
2. The "Add Widget" dialog opens, grouped by category
3. Under **Interactive**, click **Form**
4. A dialog appears asking whether to **Reuse an existing Form Type** or **Create a new one**

### Option A: Create a New Form
- Select **"Create a new form"**
- The widget is added with empty default fields
- You'll configure the form elements next

### Option B: Reuse an Existing Form Type
- Select **"Use an existing Form Type"**
- A list of all saved Form Types is shown with their names
- Click one to select it — the widget loads that Form Type's fields
- This is useful when you want the same form on multiple pages, or when recreating a deleted widget

---

## Step 3: Configure Form Fields

After adding the Form widget, click on it to expand the inline editor. You'll see:

- **Form Name** — A label for identifying this form in the admin (e.g., "Contact Form", "Newsletter Signup")
- **Submit Button Text** — The text on the submit button (default: "Submit")
- **Success Message** — Text shown after a successful submission (default: "Thank you for your submission!")
- **Form Elements** — The main section where you build the form fields

### Adding Form Elements

Click **Add Element** to add a new field. Each element has:

| Setting | Description |
|---------|-------------|
| **Type** | The field type (see table below) |
| **Label** | Display label shown above the field |
| **Name** | The field key used in submission data (auto-generated from label) |
| **Placeholder** | Placeholder text inside the field (optional) |
| **Required** | Whether the field must be filled out |
| **Options** | For select, radio, and checkbox types — the available choices |
| **Button Text** | For submit type — the button label |

### Available Field Types

| Type | Renders As | Use For |
|------|-----------|---------|
| **Text Input** | `<input type="text">` | Names, short text, general input |
| **Email Input** | `<input type="email">` | Email addresses (with basic validation) |
| **Textarea** | `<textarea>` | Long text, messages, comments |
| **Select** | `<select>` dropdown | Predefined single-choice options |
| **Checkbox** | Checkbox group | Multiple-choice selection |
| **Radio** | Radio button group | Single-choice from a list |
| **Submit** | `<button>` | Form submit button (usually the last element) |

### Reordering and Removing Elements

- Use the **↑** and **↓** arrows next to each element to reorder
- Click the **trash icon** to remove an element

---

## Step 4: Save the Widget

1. Click **Save** on the widget editor
2. The system automatically:
   - Creates a **Form Type** record if one doesn't exist yet
   - Links the widget to the Form Type via `formTypeId`
   - Saves the form element definitions to the Form Type

The Form Type is now independent from the widget — if you delete the widget later, the Form Type and its submissions are preserved.

---

## Step 5: Test the Form

1. Make sure the page is **published** (status = "published")
2. Open the page's public URL (use the "View Live" link in the page editor header)
3. Fill out the form and click submit
4. You should see the success message

---

## Step 6: View Submissions

1. In the admin sidebar, click **Forms**
2. The form submissions list shows all Form Types that have received submissions
3. Each row shows: **Form Name**, **Form Type**, **Submission Count**, **Last Submitted**
4. Click a row to see individual submissions in a detailed table
5. Columns are generated dynamically based on the form fields

---

## Reusing a Form Type on Another Page

To add the same form to a different page:

1. Go to the other page's editor → Widgets tab
2. Click **Add Widget** → **Form**
3. In the dialog, select **"Use an existing Form Type"**
4. Pick the Form Type you created earlier
5. The form loads with the same fields and settings
6. Submissions from both pages are grouped together under the same Form Type

---

## What Happens When a Form Type is Deleted

If a Form Type is deleted from the system (e.g., via the API), any widget still referencing it will show:
- An **error banner** in the widget editor: "The linked Form Type no longer exists"
- A **"Create Form Type"** button to recreate it from the widget's current fields
- An **"unlinked"** badge on the widget card in the editor

Submissions that were already linked to the deleted Form Type remain in the database but are orphaned (no longer grouped by Form Type).

---

## Tips

- **Form Name matters**: Use descriptive names — they appear in the admin forms list and help identify submissions.
- **Element Names**: Each element's `name` field is the key used in submission JSON data. Keep them consistent (e.g., `email`, `message`, `first_name`).
- **Submit button**: Always add a Submit element as the last form element. Without it, users won't have a way to submit.
- **Multiple forms per page**: You can add multiple Form widgets to the same page, each with different Form Types.
- **Styling**: Form rendering uses the site's theme styles automatically. No custom CSS needed.
