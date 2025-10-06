document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.getElementById('loading-placeholder');
  const widget = document.getElementById('linkedin-widget');
  const iframe = widget?.querySelector('iframe');

  if (!iframe) return;

  const showWidget = () => {
    if (placeholder) placeholder.style.display = 'none';
    if (widget) widget.style.display = 'block';
  };

  iframe.addEventListener('load', showWidget);
  setTimeout(showWidget, 2000);
});

  console.log("📰 News & Events page with LinkedIn iframe feed initialized.");