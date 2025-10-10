import fs from 'fs';
import path from 'path';

/**
 * Simple template variable replacement
 * Supports:
 * - {{variable}} for simple replacement
 * - {{#variable}}content{{/variable}} for conditional sections (shows if variable is truthy)
 * - {{^variable}}content{{/variable}} for inverted sections (shows if variable is falsy)
 */
export const renderTemplate = (template: string, variables: Record<string, any>): string => {
  let result = template;

  // Handle conditional sections {{#var}}content{{/var}}
  const conditionalRegex = /\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs;
  result = result.replace(conditionalRegex, (match, varName, content) => {
    const value = variables[varName];
    return value ? content.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => {
      return variables[key] !== undefined ? String(variables[key]) : '';
    }) : '';
  });

  // Handle inverted sections {{^var}}content{{/var}}
  const invertedRegex = /\{\{\^(\w+)\}\}(.*?)\{\{\/\1\}\}/gs;
  result = result.replace(invertedRegex, (match, varName, content) => {
    const value = variables[varName];
    return value ? '' : content.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => {
      return variables[key] !== undefined ? String(variables[key]) : '';
    });
  });

  // Handle simple variables {{var}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] !== undefined ? String(variables[varName]) : '';
  });

  return result;
};

/**
 * Loads an email template from the templates directory
 */
export const loadTemplate = (templateName: string): string => {
  const templatePath = path.join(__dirname, '..', 'templates', 'email', `${templateName}.html`);

  try {
    return fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load template: ${templateName}`);
  }
};

/**
 * Loads and renders an email template with the base layout
 */
export const renderEmailTemplate = (
  templateName: string,
  variables: Record<string, any>
): string => {
  const baseTemplate = loadTemplate('base');
  const contentTemplate = loadTemplate(templateName);

  // Render the content template first
  const renderedContent = renderTemplate(contentTemplate, variables);

  // Then render the base template with the content inserted
  return renderTemplate(baseTemplate, {
    ...variables,
    content: renderedContent,
  });
};

/**
 * Generates a plain text version from HTML
 * Simple conversion that strips HTML tags and formats text
 */
export const htmlToPlainText = (html: string): string => {
  return html
    // Remove style tags and their content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove script tags and their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Convert <br> to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert closing </p>, </div>, </h1>, etc to double newlines
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n\n')
    // Remove all other HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Remove extra whitespace
    .replace(/[ \t]+/g, ' ')
    // Remove leading/trailing whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remove excessive newlines (more than 2)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
